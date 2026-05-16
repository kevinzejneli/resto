import type { PaymentMethod } from "@resto/core";
import { authed, requireOrgOrder } from "../../../../../lib/api-handler";

export const dynamic = "force-dynamic";

export function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return authed(request, async (c) => {
    const { id } = await ctx.params;
    const order = await requireOrgOrder(c, id);
    const body = (await request.json().catch(() => ({}))) as { method?: PaymentMethod };
    const method: PaymentMethod = body.method ?? "cash";

    if (method === "card") {
      const intent = await c.b.stripe.createPaymentIntent({
        amount: order.total,
        orderId: order.id,
      });
      if (intent.status !== "succeeded") {
        return { requiresAction: true, clientSecret: intent.clientSecret };
      }
      const payment = await c.b.services.pos.checkout(id, {
        method,
        providerRef: intent.id,
      });
      return {
        payment,
        order: await c.b.services.pos.getOrder(id),
        simulated: intent.simulated,
      };
    }

    const payment = await c.b.services.pos.checkout(id, { method });
    return { payment, order: await c.b.services.pos.getOrder(id) };
  });
}
