export interface CostByMonth {
  period: string;
  totalCost: number;
}

export interface CostByProviderAndService {
  provider: string;
  serviceName: string | null;
  totalCost: number;
}
