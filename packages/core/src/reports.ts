import type { CurrencyCode, ID, Money } from "./types";
import type { OrderChannel } from "./pos";

/** Reporting slice: aggregates over persisted paid orders. */

export interface DayBucket {
  date: string;
  revenueMinor: number;
  count: number;
}

export interface TopItem {
  menuItemId: ID;
  name: string;
  quantity: number;
  revenueMinor: number;
}

export interface ChannelBucket {
  channel: OrderChannel;
  revenueMinor: number;
  count: number;
}

export interface SalesReport {
  currency: CurrencyCode;
  totalRevenue: Money;
  orderCount: number;
  avgOrder: Money;
  byDay: DayBucket[];
  topItems: TopItem[];
  byChannel: ChannelBucket[];
}

export interface ReportRange {
  /** Inclusive ISO date (YYYY-MM-DD). Defaults to 30 days ago. */
  fromDate?: string;
  /** Inclusive ISO date (YYYY-MM-DD). Defaults to today. */
  toDate?: string;
}

export interface ReportService {
  sales(locationId: ID, range?: ReportRange): Promise<SalesReport>;
}
