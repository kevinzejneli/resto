import {
  assertOrgLocation,
  authed,
  HttpError,
  requireRole,
} from "../../../../lib/api-handler";

export const dynamic = "force-dynamic";

export function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return authed(request, async (c) => {
    requireRole(c, "owner", "manager");
    const { id } = await ctx.params;
    const table = c.b.store.tables.find((t) => t.id === id);
    if (!table) throw new HttpError("Table not found", 404);
    assertOrgLocation(c, table.locationId);
    await c.b.services.tables.remove(id);
    return { ok: true };
  });
}
