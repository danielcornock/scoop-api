import { Dictionary } from 'lodash';

export interface IMonthlyDistributionMeta {
  fields: Array<string>;
  preferredCurrency: string;
  allTimeDistribution: Dictionary<number>;
  uncommittedSpendingData: Array<{ date: string; value: number }>;
}
