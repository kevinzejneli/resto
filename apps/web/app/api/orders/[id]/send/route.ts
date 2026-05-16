import { authed, requireOrgOrder } from "../../../../../lib/api-handler";

export const dynamic = "force-dynamic";

export function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return authed(request, async (c) => {
    const { id } = await ctx.params;
    await requireOrgOrder(c, id);
    return c.b.services.pos.sendToKitchen(id);
  });
}
