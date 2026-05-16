import type { StockMovementReason } from "@resto/core";
import {
  authed,
  assertOrgLocation,
  HttpError,
} from "../../../../../lib/api-handler";

export const dynamic = "force-dynamic";

export function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return authed(request, async (c) => {
    const { id } = await ctx.params;
    const item = await c.b.services.inventory.get(id);
    if (!item) throw new HttpError("Inventory item not found", 404);
    assertOrgLocation(c, item.locationId);
    const body = (await request.json()) as {
      delta: number;
      reason?: StockMovementReason;
    };
    return c.b.services.inventory.recordMovement({
      inventoryItemId: id,
      delta: body.delta,
      reason: body.reason ?? "manual_adjustment",
    });
  });
}
