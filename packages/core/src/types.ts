/** Shared primitives used across every domain slice. */

export type ID = string;

export type ISODateTime = string;

/** Currencies relevant to the Balkan/MENA launch markets. */
export type CurrencyCode = "EUR" | "USD" | "ALL" | "MKD" | "RSD";

/** Money is always stored as integer minor units (e.g. cents) to avoid float drift. */
export interface Money {
  amountMinor: number;
  currency: CurrencyCode;
}

export interface Location {
  id: ID;
  name: string;
  /** ISO 3166-1 alpha-2, e.g. "AL", "MK", "XK". */
  countryCode: string;
  timezone: string;
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}
