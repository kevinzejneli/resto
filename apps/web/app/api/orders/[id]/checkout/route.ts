import { backend } from "../../../../../lib/backend";
import { route } from "../../../../../lib/http";
import type { PaymentMethod } from "@resto/core";

export const dynamic = "force-dynamic";

export function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { services, stripe } = backend();
  return route(async () => {
    const { id } = await ctx.params;
    const body = (await request.json().catch(() => ({}))) as { method?: PaymentMethod };
    const method: PaymentMethod = body.method ?? "cash";

    const order = await services.pos.getOrder(id);
    if (!order) throw new Error("Order not found");

    if (method === "card") {
      const intent = await stripe.createPaymentIntent({
        amount: order.total,
        orderId: order.id,
      });
      if (intent.status !== "succeeded") {
        return { requiresAction: true, clientSecret: intent.clientSecret };
      }
      const payment = await services.pos.checkout(id, {
        method,
        providerRef: intent.id,
      });
      return { payment, order: await services.pos.getOrder(id), simulated: intent.simulated };
    }

    const payment = await services.pos.checkout(id, { method });
    return { payment, order: await services.pos.getOrder(id) };
  });
}
