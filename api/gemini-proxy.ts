import { GoogleGenAI } from "@google/genai";
import { GenerateContentResponse, GenerateContentParameters } from "@google/genai";

// Acest fișier este conceput pentru a fi o funcție serverless (ex. Vercel, Netlify).
// Acționează ca un proxy pentru a apela în siguranță API-ul Gemini din frontend.
// Cheia API este accesată în siguranță din variabilele de mediu de pe server.

export async function POST(req: Request) {
  // Impune metoda POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Metoda nu este permisă' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parsează corpul cererii pentru a obține modelul, conținutul și configurația
    // geminiService.ts din frontend trimite 'contents' ca input principal.
    const { model, contents, config } = await req.json();

    // Validare de bază pentru conținut
    if (!contents) {
      return new Response(JSON.stringify({ error: 'Lipsesc "contents" din corpul cererii. Conținutul este necesar pentru generarea AI.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Inițializează GoogleGenAI cu cheia API din variabilele de mediu.
    // Ghidul specifică `process.env.API_KEY`.
    // FIX: Always use naming parameter for apiKey as per initialization guidelines.
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

    // Pregătește parametrii GenerateContentParameters
    const generationParameters: GenerateContentParameters = {
      model: model || 'gemini-3-flash-preview', // Utilizează modelul furnizat sau un model implicit pentru sarcini text de bază
      contents: contents,
      config: config,
    };

    // Apel către API-ul Gemini
    const response: GenerateContentResponse = await ai.models.generateContent(generationParameters);

    // Extrage părțile relevante din răspuns, așa cum se așteaptă frontend-ul (text, groundingMetadata, functionCalls)
    // Getter-ul .text din GenerateContentResponse furnizează textul agregat.
    return new Response(JSON.stringify({
      text: response.text, // Aceasta utilizează getter-ul .text
      // FIX: Extraction of groundingMetadata MUST look into candidates[0] as per guidelines for googleSearch.
      groundingMetadata: response.candidates?.[0]?.groundingMetadata,
      functionCalls: response.functionCalls,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // IMPLEMENTARE RECOMANDATĂ: Tipizare Strictă a Erorilor
    console.error("Eroare API Gemini în proxy:", error);
    let status = 500;
    let errorMessage = 'Eroare internă a serverului';

    if (error instanceof Error) {
        status = (error as any).status || (error as any).response?.status || 500;
        errorMessage = error.message || (error as any).response?.statusText || 'Eroare internă a serverului';
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}