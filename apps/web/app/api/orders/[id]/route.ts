import { authed, requireOrgOrder } from "../../../../lib/api-handler";

export const dynamic = "force-dynamic";

export function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return authed(request, async (c) => requireOrgOrder(c, (await ctx.params).id));
}
