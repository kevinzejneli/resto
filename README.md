# RestoMaster

Restaurant OS for Balkan/MENA small chains: **POS + inventory + WhatsApp ordering**.

Stack: Expo (mobile) · Next.js (web) · Stripe · WhatsApp Business Cloud API.

> Scaffold stage — structure, types, and integration boundaries only. No
> business logic is implemented yet.

## Layout

```
apps/
  web/            Next.js dashboard (Dashboard, POS, Inventory, WhatsApp Orders)
  mobile/         Expo app (POS / Inventory / Orders tabs)
packages/
  core/           Shared domain models for all three slices
  integrations/   Stripe + WhatsApp Cloud API client boundaries (stubbed)
```

The three product slices each have typed service interfaces in `@resto/core`:

| Slice            | Module                       | Service            |
| ---------------- | ---------------------------- | ------------------ |
| POS / orders     | `packages/core/src/pos.ts`   | `PosService`       |
| Inventory        | `packages/core/src/inventory.ts` | `InventoryService` |
| WhatsApp ordering| `packages/core/src/ordering.ts`  | `OrderingService`  |
| Shared menu      | `packages/core/src/menu.ts`  | `MenuService`      |

Webhooks live in the web app: `/api/webhooks/stripe`, `/api/webhooks/whatsapp`.

## Develop

```bash
pnpm install
cp .env.example .env        # fill in Stripe / WhatsApp keys

pnpm dev:web                # Next.js dashboard on :3000
pnpm dev:mobile             # Expo dev server
pnpm typecheck              # type-check all packages
```

For the mobile app, run `pnpm --filter @resto/mobile exec expo install --fix`
once to align native dependency versions with the installed Expo SDK.

## Next steps

1. Pick a persistence layer and back the `*Service` interfaces in `@resto/core`.
2. Implement the Stripe + WhatsApp clients in `@resto/integrations`.
3. Build the POS UI (highest-value slice) on web + mobile.
