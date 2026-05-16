import { createApiClient } from "@resto/api-client";

/**
 * Point this at the running web backend. On a device/emulator, localhost
 * won't resolve to your machine — set EXPO_PUBLIC_API_URL (e.g. your LAN IP
 * or a tunnel) in apps/mobile/.env.
 */
const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export const api = createApiClient({ baseUrl });
