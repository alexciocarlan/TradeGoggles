
import { GoogleGenAI, Type } from "@google/genai";
import { Trade } from "./types";

const getAIInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Global lock and persistent cooldown management
let isAiBusy = false;
const COOLDOWN_KEY = 'tg_ai_cooldown_until';

const checkCooldown = (): boolean => {
    const cooldownUntil = localStorage.getItem(COOLDOWN_KEY);
    if (cooldownUntil) {
        if (Date.now() < parseInt(cooldownUntil)) return true;
        localStorage.removeItem(COOLDOWN_KEY);
    }
    return false;
};

const setCooldown = (minutes: number) => {
    const until = Date.now() + minutes * 60 * 1000;
    localStorage.setItem(COOLDOWN_KEY, until.toString());
};

// Helper robust pentru gestionarea erorilor de tip 429 (Rate Limit) și 500 (Internal Error)
const callWithRetry = async (fn: () => Promise<any>, retries = 1, delay = 15000): Promise<any> => {
  if (checkCooldown()) {
    console.warn("AI is in cooldown period due to previous rate limits. Skipping call.");
    return null;
  }
  
  if (isAiBusy) {
    console.warn("AI is already processing a request. Skipping to avoid quota breach.");
    return null;
  }

  isAiBusy = true;
  try {
    return await fn();
  } catch (error: any) {
    const isQuotaExceeded = error?.status === 429 || 
                            error?.message?.includes('429') || 
                            error?.message?.includes('quota') ||
                            error?.message?.includes('RESOURCE_EXHAUSTED');
    
    if (isQuotaExceeded) {
        console.error("Gemini Quota Exceeded (429). Activating 15-minute global cooldown.");
        setCooldown(15);
        return null;
    }

    if (retries > 0) {
      const backoff = delay + Math.random() * 5000;
      console.warn(`Gemini API Error. Retrying in ${Math.round(backoff)}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      isAiBusy = false; 
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  } finally {
    isAiBusy = false;
  }
};

export interface MarketTickers {
  nqPrice: number;
  nqSettlement: number;
  nqEthOpen: number;
  esPrice: number;
  esSettlement: number;
  esEthOpen: number;
  vix: number;
  dxyEthOpen: number;
  dxyCurrent: number;
}

export const getMarketTickers = async (): Promise<MarketTickers | null> => {
  const CACHE_KEY = 'tg_market_tickers_cache';
  const CACHE_DURATION = 30 * 60 * 1000; 

  try {
    const cachedStr = localStorage.getItem(CACHE_KEY);
    if (cachedStr) {
      const cached = JSON.parse(cachedStr);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }

    // Daca suntem in cooldown, nu mai incercam deloc reteaua, dam cache direct
    if (checkCooldown()) {
        return cachedStr ? JSON.parse(cachedStr).data : null;
    }

    const ai = getAIInstance();
    const data = await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Return ONLY a raw JSON object for current prices, previous settlement, and ETH (18:00 EST) open for: NQ Futures, ES Futures. Also current VIX and DXY. Use keys: nqPrice, nqSettlement, nqEthOpen, esPrice, esSettlement, esEthOpen, vix, dxyEthOpen, dxyCurrent. NO MARKDOWN.",
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
        }
      });
      return JSON.parse(response.text || '{}');
    });
    
    if (data && data.nqPrice) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      return data;
    }
    
    return cachedStr ? JSON.parse(cachedStr).data : null;

  } catch (error: any) {
    const fallback = localStorage.getItem(CACHE_KEY);
    return fallback ? JSON.parse(fallback).data : null;
  }
};

export const getMarketWatchIntel = async (userMacroContext?: string) => {
  const CACHE_KEY = 'tg_market_watch_cache';
  const CACHE_DURATION = 60 * 60 * 1000;

  const cachedStr = localStorage.getItem(CACHE_KEY);
  if (cachedStr) {
    const cached = JSON.parse(cachedStr);
    if (Date.now() - cached.timestamp < CACHE_DURATION) return cached.data;
  }

  if (checkCooldown()) return cachedStr ? JSON.parse(cachedStr).data : null;

  try {
    const ai = getAIInstance();
    const data = await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Perform an urgent real-time macro and technical market analysis for TODAY.
        SEARCH specific sites: FRED Fed Liquidity, CBOE VIX Central, CNBC Market Data, TradingView News.
        USER LOCAL CONTEXT: ${userMacroContext || 'No local context provided.'}
        Return a JSON object with strictly the requested keys.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["volumeStats", "sectorRotation", "yieldCurve", "netLiquidity", "vixTermStructure"],
            properties: {
              volumeStats: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { sector: {type: Type.STRING}, ticker: {type: Type.STRING}, rVol: {type: Type.NUMBER}, heatIndex: {type: Type.NUMBER}, rawVolumeLabel: {type: Type.STRING} } } },
              sectorRotation: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { ticker: {type: Type.STRING}, performance: {type: Type.NUMBER}, label: {type: Type.STRING} } } },
              topMovers: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { symbol: {type: Type.STRING}, changePct: {type: Type.NUMBER}, rVol: {type: Type.NUMBER} } } },
              yieldCurve: { type: Type.OBJECT, properties: { y10: {type: Type.NUMBER}, y02: {type: Type.NUMBER}, spread: {type: Type.NUMBER}, status: {type: Type.STRING} } },
              economicSurpriseIndex: { type: Type.OBJECT, properties: { value: {type: Type.NUMBER}, trend: {type: Type.STRING} } },
              netLiquidity: { type: Type.OBJECT, properties: { fedBalanceSheet: {type: Type.NUMBER}, tga: {type: Type.NUMBER}, rrp: {type: Type.NUMBER}, totalNet: {type: Type.NUMBER}, trend: {type: Type.STRING} } },
              gammaExposure: { type: Type.OBJECT, properties: { value: {type: Type.NUMBER}, regime: {type: Type.STRING}, description: {type: Type.STRING} } },
              vixTermStructure: { type: Type.OBJECT, properties: { spot: {type: Type.NUMBER}, m1: {type: Type.NUMBER}, m2: {type: Type.NUMBER}, status: {type: Type.STRING}, spreadPct: {type: Type.NUMBER} } },
              putCallRatio: { type: Type.OBJECT, properties: { total: {type: Type.NUMBER}, equity: {type: Type.NUMBER}, sentiment: {type: Type.STRING} } },
              fearGreedIndex: { type: Type.NUMBER }
            }
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });

    if (data) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      return data;
    }
    return cachedStr ? JSON.parse(cachedStr).data : null;
  } catch (error) {
    return cachedStr ? JSON.parse(cachedStr).data : null;
  }
};

export interface ParsedRithmicResult {
  accountNameFromCsv: string;
  trades: Partial<Trade>[];
}

export const parseRithmicHistory = async (rawText: string): Promise<ParsedRithmicResult | null> => {
  try {
    const ai = getAIInstance();
    const sanitizedText = rawText.replace(/\0/g, '').substring(0, 15000);
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Parse this Rithmic CSV into trades JSON. Data: ${sanitizedText}`,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || '{}');
    });
  } catch (error) {
    return null;
  }
};

export const getRealtimeMarketContext = async () => {
  try {
    const ai = getAIInstance();
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Analyze current market sentiment for NQ/ES futures based on today's price action and news.",
        config: { tools: [{ googleSearch: {} }] },
      });
      return { text: response.text, sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
    });
  } catch (error) { return { text: "Context indisponibil momentan (API limit/error).", sources: [] }; }
};

export const analyzeTrade = async (trade: Trade) => {
  try {
    const ai = getAIInstance();
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this trade: ${JSON.stringify(trade)}`,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || '{}');
    });
  } catch (error) { return null; }
};

export const getDashboardInsights = async (trades: Trade[]) => {
  try {
    const ai = getAIInstance();
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Review these ${trades.length} trades and give one major improvement tip.`,
      });
      return response.text;
    });
  } catch (error) { return "Limită API atinsă. Monitorizează-ți disciplina manual."; }
};

export const getCMECalendar = async () => {
  try {
    const ai = getAIInstance();
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Provide current CME trading hours and upcoming holiday schedule for NQ/ES.",
        config: { tools: [{ googleSearch: {} }] },
      });
      return { text: response.text, sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
    });
  } catch (error) { return { text: "CME schedule temporarily unavailable.", sources: [] }; }
};

export const getFinancialCalendar = async (type: 'economic' | 'earnings') => {
  try {
    const ai = getAIInstance();
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `List major ${type} events for the current week.`,
        config: { tools: [{ googleSearch: {} }] },
      });
      return { text: response.text, sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
    });
  } catch (error) { return { text: "Calendar unavailable due to API limits/errors.", sources: [] }; }
};
