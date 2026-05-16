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

export type Role = "owner" | "manager" | "waiter";

/** A chain / tenant. One org owns many locations and users. */
export interface Org {
  id: ID;
  name: string;
}

export interface User {
  id: ID;
  orgId: ID;
  email: string;
  name: string;
  role: Role;
  /** scrypt hash, "salt:hash" hex. Set server-side; never sent to clients. */
  passwordHash: string;
}

/** A user with the secret stripped — safe to return over the API. */
export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(u: User): PublicUser {
  const { passwordHash: _omit, ...rest } = u;
  return rest;
}

export interface Location {
  id: ID;
  orgId: ID;
  name: string;
  /** ISO 3166-1 alpha-2, e.g. "AL", "MK", "XK". */
  countryCode: string;
  timezone: string;
  currency: CurrencyCode;
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

export function money(amountMinor: number, currency: CurrencyCode = "EUR"): Money {
  return { amountMinor: Math.round(amountMinor), currency };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
  return { amountMinor: a.amountMinor + b.amountMinor, currency: a.currency };
}

export function scaleMoney(m: Money, factor: number): Money {
  return { amountMinor: Math.round(m.amountMinor * factor), currency: m.currency };
}

export function formatMoney(m: Money): string {
  const major = (m.amountMinor / 100).toFixed(2);
  return `${major} ${m.currency}`;
}
