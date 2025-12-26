
import { GoogleGenAI, Type } from "@google/genai";
import { Trade } from "./types";

const getAIInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  const CACHE_DURATION = 2 * 60 * 1000; // 2 minute cache pentru tickere

  try {
    const cachedStr = localStorage.getItem(CACHE_KEY);
    if (cachedStr) {
      const cached = JSON.parse(cachedStr);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }

    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Return ONLY a raw JSON object for current prices, previous settlement, and ETH (18:00 EST) open for: NQ Futures, ES Futures. Also current VIX and DXY. Use keys: nqPrice, nqSettlement, nqEthOpen, esPrice, esSettlement, esEthOpen, vix, dxyEthOpen, dxyCurrent. NO MARKDOWN.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      }
    });
    
    const data = JSON.parse(response.text || '{}');
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    return data;
  } catch (error) {
    console.error("Tickers Error:", error);
    return null;
  }
};

export const getMarketWatchIntel = async () => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform an urgent real-time macro and technical market analysis for TODAY.
      SEARCH specific sites: FRED Fed Liquidity, CBOE VIX Central, CNBC Market Data, TradingView News.
      
      Return a JSON object with:
      1. volumeStats: Array of 8 tickers (NQ, ES, TSLA, NVDA, AAPL, AMZN, MSFT, AMD) with rVol (relative to 10d avg) and heatIndex (0-100).
      2. sectorRotation: Array of {ticker, performance, label} for XLK, XLE, XLF, XLV (daily % change).
      3. topMovers: Array of {symbol, changePct, rVol} for 5 biggest S&P 500 movers.
      4. yieldCurve: Current y10, y02 rates and spread (y10-y02). Status: 'Inverted' or 'Normal'.
      5. economicSurpriseIndex: Current Citi Economic Surprise Index value and trend.
      6. netLiquidity: Current Fed Net Liquidity formula: (Fed Balance Sheet - TGA - RRP). Provide values in Billions.
      7. gammaExposure: Estimated SPX GEX value (in billions), regime (Positive/Negative), and short description.
      8. vixTermStructure: Current VIX Spot, M1 Future, M2 Future. Status: 'Contango' or 'Backwardation'.
      9. putCallRatio: Current CBOE Total PCR, Equity PCR, and sentiment.
      10. fearGreedIndex: Current CNN Fear & Greed value (0-100).
      
      CRITICAL: If exact real-time numbers are not found, use the most recent available data from the last 24 hours.`,
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
    
    const text = response.text;
    if (!text) throw new Error("Empty AI Response");
    return JSON.parse(text);
  } catch (error) {
    console.error("Market Watch Error:", error);
    // Returnăm un set de date mock de rezervă pentru a nu lăsa interfața goală în caz de eroare API extremă
    return {
      volumeStats: [
        { sector: "EQUITY FUTURES", ticker: "NQ", rVol: 125, heatIndex: 65 },
        { sector: "EQUITY FUTURES", ticker: "ES", rVol: 98, heatIndex: 45 },
        { sector: "MAG 7 TECH", ticker: "NVDA", rVol: 240, heatIndex: 92 },
        { sector: "MAG 7 TECH", ticker: "TSLA", rVol: 180, heatIndex: 78 }
      ],
      sectorRotation: [
        { ticker: "XLK", performance: 1.2, label: "Technology" },
        { ticker: "XLE", performance: -0.5, label: "Energy" },
        { ticker: "XLF", performance: 0.3, label: "Financials" },
        { ticker: "XLV", performance: -0.2, label: "Healthcare" }
      ],
      yieldCurve: { y10: 4.25, y02: 4.65, spread: -0.40, status: "Inverted" },
      netLiquidity: { fedBalanceSheet: 7500, tga: 650, rrp: 400, totalNet: 6450, trend: "Stable" },
      vixTermStructure: { spot: 14.5, m1: 15.2, m2: 15.8, status: "Contango", spreadPct: 4.8 },
      gammaExposure: { value: 2.5, regime: "Positive", description: "Market is in a low volatility regime with dealers long gamma." },
      putCallRatio: { total: 0.85, equity: 0.55, sentiment: "Bullish" },
      economicSurpriseIndex: { value: 15.2, trend: "Rising" }
    };
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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse this Rithmic CSV into trades JSON. Data: ${sanitizedText}`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    return null;
  }
};

export const getRealtimeMarketContext = async () => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Analyze current market sentiment for NQ/ES futures based on today's price action and news.",
      config: { tools: [{ googleSearch: {} }] },
    });
    return { text: response.text, sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
  } catch (error) { return { text: "Context indisponibil.", sources: [] }; }
};

export const analyzeTrade = async (trade: Trade) => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this trade: ${JSON.stringify(trade)}`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) { return null; }
};

export const getDashboardInsights = async (trades: Trade[]) => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Review these ${trades.length} trades and give one major improvement tip.`,
    });
    return response.text;
  } catch (error) { return "Continuă să tranzacționezi cu disciplină."; }
};

export const getCMECalendar = async () => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Provide current CME trading hours and upcoming holiday schedule for NQ/ES.",
      config: { tools: [{ googleSearch: {} }] },
    });
    return { text: response.text, sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
  } catch (error) { return { text: "CME schedule unavailable.", sources: [] }; }
};

export const getFinancialCalendar = async (type: 'economic' | 'earnings') => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `List major ${type} events for the current week.`,
      config: { tools: [{ googleSearch: {} }] },
    });
    return { text: response.text, sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
  } catch (error) { return { text: "Calendar unavailable.", sources: [] }; }
};
