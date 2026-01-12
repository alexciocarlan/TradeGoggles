
import { Trade, AppError } from "./types";
import { z } from 'zod'; 
import * as jsonrepairPkg from 'jsonrepair';

// Robust import to handle default vs named export
const jsonrepair = (jsonrepairPkg as any).jsonrepair || (jsonrepairPkg as any).default || jsonrepairPkg;

const GEMINI_PROXY_ENDPOINT = '/api/gemini-proxy'; 

/**
 * Utility to extract JSON from a string that may contain surrounding text or markdown.
 * Supports both Objects {} and Arrays [].
 */
const extractJSON = (text: string): string => {
  // First attempt: Look for markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1];
  }
  // Second attempt: Find first { or [ and last } or ]
  const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  return match ? match[0] : text;
};

interface ProxyGeminiResponse {
  text: string;
  groundingMetadata?: any;
  functionCalls?: any[];
}

export const MarketTickersSchema = z.object({
  nqPrice: z.number(),
  nqSettlement: z.number(),
  nqEthOpen: z.number(),
  esPrice: z.number(),
  esSettlement: z.number(),
  esEthOpen: z.number(),
  vix: z.number(),
  dxyEthOpen: z.number(),
  dxyCurrent: z.number(),
});

export type MarketTickers = z.infer<typeof MarketTickersSchema>;

/**
 * Updated schema for Rithmic results to use the user-provided union types.
 */
export const ParsedRithmicResultSchema = z.object({
  trades: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.null()]))),
  accountName: z.string().optional()
});

export type ParsedRithmicResult = z.infer<typeof ParsedRithmicResultSchema>;

export const TradeAnalysisSchema = z.object({
  technical: z.string(),
  takeaway: z.string()
});

export const MarketWatchIntelSchema = z.object({
  volumeStats: z.array(z.object({
    ticker: z.string(),
    rVol: z.number(),
    heatIndex: z.number(),
    sector: z.string().optional(),
  })),
  vixTermStructure: z.object({
    spot: z.number(),
    m1: z.number(),
    m2: z.number(),
    status: z.string(),
    spreadPct: z.number(),
  }),
  gammaExposure: z.object({
    value: z.number(),
    regime: z.string(),
    description: z.string(),
  }),
  putCallRatio: z.object({
    total: z.number(),
    equity: z.number(),
    sentiment: z.string(),
  }),
  sectorRotation: z.array(z.object({
    label: z.string(),
    performance: z.number(),
  })),
  yieldCurve: z.object({
    spread: z.number(),
    y10: z.number(),
    y02: z.number(),
    status: z.string(),
  }),
  netLiquidity: z.object({
    totalNet: z.number(),
    fedBalanceSheet: z.number(),
    tga: z.number(),
    rrp: z.number(),
    trend: z.string(),
  }),
  economicSurpriseIndex: z.object({
    value: z.number(),
    trend: z.string(),
  }),
});

const callGeminiProxy = async (
  payload: { model: string; contents?: any; config?: any; },
  signal?: AbortSignal
): Promise<ProxyGeminiResponse> => {
  try {
    const response = await fetch(GEMINI_PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown proxy error' }));
      throw new AppError(
        'API_RESPONSE_ERROR',
        `Proxy call failed: ${response.status} - ${errorData.error || response.statusText}`,
        { status: response.status, details: errorData }
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof AppError) throw error;
    if ((error as Error).name === 'AbortError') throw error;
    throw new AppError('API_NETWORK_ERROR', `Communication failure: ${(error as Error).message}`);
  }
};

const safeParseAIResponse = <TData>(text: string, schema: z.ZodSchema<TData>): TData | null => {
  if (!text || typeof text !== 'string') return null;
  
  try {
    const jsonCandidate = extractJSON(text.trim());
    
    try {
      // Prioritize repair as it handles more edge cases (like single quotes)
      const repaired = jsonrepair(jsonCandidate);
      const parsed = JSON.parse(repaired);
      return schema.parse(parsed) as TData;
    } catch (repairError) {
      console.warn("jsonrepair failed, attempting direct JSON.parse fallback", repairError);
      const parsed = JSON.parse(jsonCandidate);
      return schema.parse(parsed) as TData;
    }
  } catch (e) {
    console.error("[AI Parse] Failed to decode JSON response", e);
    // Detailed logging for debug
    console.debug("Failed Content:", text);
    return null;
  }
};

export const callAI = async <TModel>(
  prompt: string, 
  schema: z.ZodSchema<TModel>, 
  model: string = "gemini-3-flash-preview",
  signal?: AbortSignal
): Promise<TModel> => {
  const response = await callGeminiProxy({ 
    model, 
    contents: prompt,
    config: { responseMimeType: "application/json" }
  }, signal);

  const parsed = safeParseAIResponse<TModel>(response.text, schema);
  if (parsed === null) {
    throw new AppError('AI_VALIDATION_ERROR', 'AI response validation failed.', { raw: response.text });
  }
  return parsed;
};

// EXTERNAL FEEDS DISABLED
export const getMarketTickers = async (signal?: AbortSignal) => {
  return null;
};

export const parseRithmicHistory = async (rawText: string, signal?: AbortSignal) => {
    try {
      // Increased limit to 50k chars to prevent data loss on larger CSVs while keeping within reason.
      const csvSegment = rawText.substring(0, 50000); 
      return await callAI(
        `Parse this Rithmic/NinjaTrader/Tradovate CSV export into a JSON object with 'trades' (array) and 'accountName'. 
         Map columns to: date (ISO), symbol, side (BUY/SELL), qty, entryPrice, exitPrice, pnl.
         Ignore header rows.
         CSV Data:
         ${csvSegment}`,
        ParsedRithmicResultSchema,
        "gemini-3-pro-preview",
        signal
      );
    } catch (e) { return null; }
};

export const analyzeTrade = async (trade: Trade, signal?: AbortSignal) => {
    try {
      return await callAI(
        `Analyze trade: ${JSON.stringify(trade)}`,
        TradeAnalysisSchema,
        "gemini-3-flash-preview",
        signal
      );
    } catch (e) {
      return { technical: "Analysis unavailable.", takeaway: "Protocol sync required." };
    }
};

// EXTERNAL FEEDS DISABLED
export const getRealtimeMarketContext = async (signal?: AbortSignal) => {
  return { text: "External Market Feeds Disabled.", sources: [] };
};

export const getDashboardInsights = async (trades: Trade[], signal?: AbortSignal) => {
  try {
    const response = await callGeminiProxy({
        model: "gemini-3-flash-preview",
        contents: `Give 1 coaching tip for these ${(trades || []).length} trades.`,
    }, signal);
    return response.text;
  } catch (e) { return "Coaching disabled."; }
};

// EXTERNAL FEEDS DISABLED
export const getFinancialCalendar = async (type: 'economic' | 'earnings', signal?: AbortSignal) => {
  return { text: "Economic Calendar Feed Disabled.", sources: [] };
};

// EXTERNAL FEEDS DISABLED
export const getCMECalendar = async (signal?: AbortSignal) => {
  return { text: "CME Calendar Feed Disabled.", sources: [] };
};

// EXTERNAL FEEDS DISABLED
export const getMarketWatchIntel = async (macro: string, signal?: AbortSignal) => {
  return null;
};
