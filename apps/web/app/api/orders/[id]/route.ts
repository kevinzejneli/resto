import { backend } from "../../../../lib/backend";
import { fail, ok } from "../../../../lib/http";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const order = await backend().services.pos.getOrder(id);
  return order ? ok(order) : fail(new Error("Order not found"), 404);
}
