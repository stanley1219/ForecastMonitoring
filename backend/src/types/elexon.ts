export interface ActualRecord {
  startTime: string;
  generation: number;
  fuelType: string;
}

export interface ForecastRecord {
  startTime: string;
  publishTime: string;
  generation: number;
}

export interface ActualDataPoint {
  time: string;
  generation: number;
}

export interface ForecastDataPoint {
  time: string;
  publishTime: string;
  generation: number;
}

