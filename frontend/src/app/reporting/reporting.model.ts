export interface CostByMonth {
  period: string;
  totalCost: number;
}

export interface CostByCategoryAndProvider {
  serviceCategory: string | null;
  provider: string;
  totalCost: number;
}

export interface CostByDay {
  day: string;
  totalCost: number;
}
