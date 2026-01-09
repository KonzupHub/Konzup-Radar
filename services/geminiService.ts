
import { GoogleGenAI } from "@google/genai";
import { RiskMetric } from "../types";
import { Language } from "../translations";

export const getKonzupVerdict = async (metric: RiskMetric, lang: Language): Promise<string> => {
  // API Key loaded from environment variable (set in .env file)
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found in environment variables");
    return "Configure GEMINI_API_KEY no arquivo .env para habilitar insights de IA.";
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  const langNames = { pt: 'Português', en: 'English', es: 'Español' };
  
  const prompt = `
    Aja como o Konzup Radar, um consultor de inteligência preditiva para o mercado de turismo. 
    DATA: Janeiro de 2026.
    IDIOMA DA RESPOSTA: ${langNames[lang]}.
    RISCO: ${metric.riskDescription}
    MÉTRICA ATUAL: ${metric.probability}% de probabilidade.
    TENDÊNCIA: ${metric.trend}.
    VOLATILIDADE: ${metric.volatility}.

    Forneça um "Insight Konzup": uma frase única, curta, executiva e de alto impacto para CEOs de turismo sobre a perspectiva e o impacto desse risco nas operações. 
    Responda obrigatoriamente em ${langNames[lang]}.
    Seja direto e use um tom sério de terminal financeiro.
    IMPORTANTE: Apresente como uma análise de probabilidade, não como um fato consumado.
    NÃO use formatação markdown como asteriscos (**). Nunca use negrito.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });

    // Limpeza rigorosa de asteriscos e markdown
    const cleanText = response.text?.trim().replace(/\*\*/g, '').replace(/\*/g, '') || "Análise indisponível no momento.";
    return cleanText;
  } catch (error: any) {
    console.error("Gemini Insight Error:", error);
    // Retorna o erro de forma amigável para o dashboard
    return "Conexão AI em modo de espera. Monitore indicadores técnicos.";
  }
};
