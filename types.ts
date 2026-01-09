
export interface RiskMetric {
  id: string;
  name: string;
  category: 'Custo Aéreo' | 'Geopolítica' | 'Saúde Global' | 'Câmbio' | 'Clima' | 'Infraestrutura';
  riskDescription: string;
  probability: number; // 0-100
  trend: 'up' | 'down' | 'stable';
  volatility: 'high' | 'moderate' | 'low';
  history: HistoryPoint[];
  verdict?: string;
  isLoadingVerdict?: boolean;
  dataSource?: string; // 'polymarket', 'trends', 'polymarket+trends', 'fallback'
  hasRealData?: boolean; // true if data comes from real APIs
}

export interface HistoryPoint {
  date: string;
  value: number;
}

export interface PredictionData {
  metrics: RiskMetric[];
  lastUpdate: string;
}
