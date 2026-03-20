export interface GenerationDataPoint {
  time: string;
  actual: number;
  forecast: number;
}

export interface GenerationResponse {
  data: GenerationDataPoint[];
  from: string;
  to: string;
  horizonHours: number;
}

export interface CompareDataPoint {
  time: string;
  actual: number;
  forecastA: number;
  forecastB: number;
}
