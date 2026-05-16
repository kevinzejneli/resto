# RestoMaster

Restaurant OS for Balkan/MENA small chains: **POS + inventory + WhatsApp ordering**.

Stack: Expo (mobile) · Next.js (web) · Stripe · WhatsApp Business Cloud API.

Functional single-location demo. Runs fully without external keys (Stripe and
WhatsApp fall back to simulated mode); add real credentials to go live.

## Layout

```
apps/
  web/            Next.js dashboard + API (the backend lives here)
  mobile/         Expo app (POS / Inventory / Orders, live data)
packages/
  core/           Domain models + in-memory store + service implementations
  integrations/   Stripe + WhatsApp Cloud API clients (real, with sim fallback)
  api-client/     Typed HTTP client shared by web & mobile
```

## What works

- **POS** — open orders (dine-in/takeaway), add/remove lines, send to kitchen,
  pay cash or card (Stripe PaymentIntent), live ticket totals.
- **Inventory** — stock auto-depletes from menu recipes when an order is paid
  or a WhatsApp order is confirmed; low-stock flags; manual adjustments.
- **WhatsApp ordering** — a conversational bot (`hi` → item numbers → `done` →
  `yes`) that turns chats into POS orders. Driven by the real Cloud API
  webhook, or the in-app simulator on the Orders page.
- Webhooks: `/api/webhooks/stripe`, `/api/webhooks/whatsapp` (with the Meta
  verification handshake and signature check).

## Develop

```bash
pnpm install
pnpm dev:web                # dashboard + API on http://localhost:3000
pnpm typecheck              # type-check every package

# optional: real integrations
cp .env.example .env        # add STRIPE_* / WHATSAPP_* keys

# mobile (point it at the running web backend)
pnpm --filter @resto/mobile exec expo install --fix   # once, aligns native deps
EXPO_PUBLIC_API_URL=http://<your-lan-ip>:3000 pnpm dev:mobile
```

Try it: open the **POS** page, start an order, pay it, then watch stock drop
on **Inventory**. On **WhatsApp Orders**, chat with the bot to place an order
that lands back in POS.

## Notes / next steps

- State is in-memory (single process); swap `packages/core/src/store.ts` for a
  real database behind the same `Store` shape to persist.
- No auth or multi-location yet — both are natural next layers.
