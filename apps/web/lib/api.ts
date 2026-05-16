"use client";

import { createApiClient } from "@resto/api-client";

const TOKEN_KEY = "resto_token";
const LOC_KEY = "resto_loc";

export const api = createApiClient({ baseUrl: "" });

// Hydrate from localStorage on the client.
if (typeof window !== "undefined") {
  const t = window.localStorage.getItem(TOKEN_KEY);
  const l = window.localStorage.getItem(LOC_KEY);
  if (t) api.setToken(t);
  if (l) api.setLocationId(l);
}

export function saveAuthToken(token: string): void {
  api.setToken(token);
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth(): void {
  api.setToken(null);
  window.localStorage.removeItem(TOKEN_KEY);
}

export function setActiveLocation(id: string): void {
  api.setLocationId(id);
  window.localStorage.setItem(LOC_KEY, id);
}

export function isAuthed(): boolean {
  return Boolean(api.getToken());
}
