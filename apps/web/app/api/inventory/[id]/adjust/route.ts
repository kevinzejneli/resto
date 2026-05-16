import { backend } from "../../../../../lib/backend";
import { route } from "../../../../../lib/http";
import type { StockMovementReason } from "@resto/core";

export const dynamic = "force-dynamic";

export function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { services } = backend();
  return route(async () => {
    const { id } = await ctx.params;
    const body = (await request.json()) as {
      delta: number;
      reason?: StockMovementReason;
    };
    return services.inventory.recordMovement({
      inventoryItemId: id,
      delta: body.delta,
      reason: body.reason ?? "manual_adjustment",
    });
  });
}
