
import axios from 'axios';
import { RiskMetric } from "../types";
import { Language } from "../translations";

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';

export const getKonzupVerdict = async (metric: RiskMetric, lang: Language): Promise<string> => {
  try {
    const response = await axios.post(`${API_BASE}/api/gemini/insight`, {
      metric: {
        riskDescription: metric.riskDescription,
        probability: metric.probability,
        trend: metric.trend,
        volatility: metric.volatility
      },
      lang
    }, {
      timeout: 30000
    });
    
    if (response.data?.insight) {
      return response.data.insight;
    }
    
    return "Análise em processamento...";
  } catch (error: any) {
    console.error("Gemini Insight Error:", error.message);
    return "Conexão AI em modo de espera. Monitore indicadores técnicos.";
  }
};
