import { authed, requireOrgOrder } from "../../../../../lib/api-handler";

export const dynamic = "force-dynamic";

export function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return authed(request, async (c) => {
    const { id } = await ctx.params;
    await requireOrgOrder(c, id);
    const body = (await request.json()) as {
      menuItemId: string;
      quantity?: number;
      notes?: string;
    };
    return c.b.services.pos.addLine(id, {
      menuItemId: body.menuItemId,
      quantity: body.quantity ?? 1,
      ...(body.notes ? { notes: body.notes } : {}),
    });
  });
}

export function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return authed(request, async (c) => {
    const { id } = await ctx.params;
    await requireOrgOrder(c, id);
    const index = Number(new URL(request.url).searchParams.get("index"));
    return c.b.services.pos.removeLine(id, index);
  });
}
