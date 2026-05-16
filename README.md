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

- **Auth** — token sign-in (scrypt-hashed passwords, HMAC-signed bearer
  tokens). Every data API requires a valid session. Demo login:
  `owner@demo.test` / `demo1234`.
- **Multi-location** — one org owns many locations (seeded: Tirana/EUR &
  Skopje/MKD), each with its own menu, inventory, tables and orders. A
  location switcher scopes the whole UI; the API enforces org/location
  ownership (cross-tenant access → 403/404).
- **Persistence** — the working set is durably written to a JSON file
  (atomic temp+rename) behind a `Persistence` port, so it survives restarts.
  Swap the port for Postgres/SQLite without touching the service layer.
- **POS** — open orders (dine-in/takeaway), add/remove lines, send to kitchen,
  pay cash or card, live ticket totals.
- **Card payments** — real Stripe flow: server creates a PaymentIntent, the
  browser confirms it with Stripe.js (Payment Element), and the server
  re-verifies the intent before marking the order paid. Falls back to
  instant simulated success when no keys are set.
- **Reports** — sales history per location (revenue, order count, average,
  revenue-by-day, top items, by channel) over 7/30/90-day windows.
- **Menu & table management** — owner/manager-only CRUD for categories,
  menu items (price, availability) and tables; role-enforced server-side.
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

- Persistence is a single JSON file (fine for a single-server pilot). For
  scale, implement the `Persistence` port in `packages/core/src/store.ts`
  against Postgres/SQLite — the service layer is unchanged.
- Auth has no signup/refresh yet; tokens are 7-day bearer. Roles are
  enforced on management endpoints (owner/manager).
- Reporting reads persisted orders; richer analytics (exports, comparisons)
  and a kitchen-display flow are natural next layers.
