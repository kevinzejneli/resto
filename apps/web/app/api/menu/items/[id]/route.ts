import type { RecipeLine } from "@resto/core";
import {
  assertOrgLocation,
  authed,
  HttpError,
  requireRole,
  type Ctx,
} from "../../../../../lib/api-handler";

export const dynamic = "force-dynamic";

async function requireOrgItem(c: Ctx, id: string) {
  const item = await c.b.services.menu.getItem(id);
  if (!item) throw new HttpError("Menu item not found", 404);
  assertOrgLocation(c, item.locationId);
  return item;
}

export function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return authed(request, async (c) => {
    requireRole(c, "owner", "manager");
    const { id } = await ctx.params;
    await requireOrgItem(c, id);
    const patch = (await request.json()) as {
      name?: string;
      description?: string;
      priceMinor?: number;
      categoryId?: string;
      recipe?: RecipeLine[];
      available?: boolean;
    };
    return c.b.services.menu.updateItem(id, patch);
  });
}

export function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return authed(request, async (c) => {
    requireRole(c, "owner", "manager");
    const { id } = await ctx.params;
    await requireOrgItem(c, id);
    await c.b.services.menu.deleteItem(id);
    return { ok: true };
  });
}
