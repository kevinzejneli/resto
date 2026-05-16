import { createStore, createServices, type Services, type Store } from "@resto/core";
import {
  createStripeClient,
  stripeConfigFromEnv,
  type StripeClient,
} from "@resto/integrations";
import {
  createWhatsAppClient,
  whatsappConfigFromEnv,
  type WhatsAppClient,
} from "@resto/integrations";

export interface Backend {
  store: Store;
  services: Services;
  stripe: StripeClient;
  whatsapp: WhatsAppClient;
}

// Survive Next.js dev HMR by stashing the singleton on globalThis.
const g = globalThis as unknown as { __restoBackend?: Backend };

function build(): Backend {
  const store = createStore();
  return {
    store,
    services: createServices(store),
    stripe: createStripeClient(stripeConfigFromEnv()),
    whatsapp: createWhatsAppClient(whatsappConfigFromEnv()),
  };
}

export function backend(): Backend {
  if (!g.__restoBackend) g.__restoBackend = build();
  return g.__restoBackend;
}

/** Every request is single-location for now. */
export const LOCATION_ID = "loc_tirana";
