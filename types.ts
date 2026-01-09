
export interface RiskMetric {
  id: string;
  name: string;
  category: 'Custo Aéreo' | 'Geopolítica' | 'Saúde Global';
  riskDescription: string;
  probability: number; // 0-100
  trend: 'up' | 'down' | 'stable';
  volatility: 'high' | 'moderate' | 'low';
  history: HistoryPoint[];
  verdict?: string;
  isLoadingVerdict?: boolean;
}

export interface HistoryPoint {
  date: string;
  value: number;
}

export interface PredictionData {
  metrics: RiskMetric[];
  lastUpdate: string;
}
