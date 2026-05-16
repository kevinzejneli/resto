import {
  createServices,
  createStore,
  snapshot,
  type Services,
  type Store,
} from "@resto/core";
import {
  createStripeClient,
  createWhatsAppClient,
  stripeConfigFromEnv,
  whatsappConfigFromEnv,
  type StripeClient,
  type WhatsAppClient,
} from "@resto/integrations";
import { createFilePersistence, DATA_FILE } from "./persistence";
import { ensureSeedUser } from "./auth";

export interface Backend {
  store: Store;
  services: Services;
  stripe: StripeClient;
  whatsapp: WhatsAppClient;
  /** Flush the working set to durable storage. */
  persist: () => void;
}

// Survive Next.js dev HMR by stashing the singleton on globalThis.
const g = globalThis as unknown as { __restoBackend?: Backend };

function build(): Backend {
  const persistence = createFilePersistence(DATA_FILE);
  const store = createStore({ persistence });
  ensureSeedUser(store);
  persistence.save(snapshot(store));
  return {
    store,
    services: createServices(store),
    stripe: createStripeClient(stripeConfigFromEnv()),
    whatsapp: createWhatsAppClient(whatsappConfigFromEnv()),
    persist: () => persistence.save(snapshot(store)),
  };
}

export function backend(): Backend {
  if (!g.__restoBackend) g.__restoBackend = build();
  return g.__restoBackend;
}
