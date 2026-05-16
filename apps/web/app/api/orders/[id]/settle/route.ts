import { authed, HttpError, requireOrgOrder } from "../../../../../lib/api-handler";

export const dynamic = "force-dynamic";

/**
 * Finalize a card order after the browser confirmed the PaymentIntent with
 * Stripe.js. The intent is re-fetched server-side so a client can't fake it.
 */
export function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return authed(request, async (c) => {
    const { id } = await ctx.params;
    const order = await requireOrgOrder(c, id);
    const { paymentIntentId } = (await request.json()) as {
      paymentIntentId?: string;
    };
    if (!paymentIntentId) throw new HttpError("paymentIntentId required", 400);

    const pi = await c.b.stripe.retrievePaymentIntent(paymentIntentId);
    if (pi.status !== "succeeded") {
      throw new HttpError(`Payment not completed (status: ${pi.status})`, 402);
    }
    if (pi.orderId && pi.orderId !== order.id) {
      throw new HttpError("PaymentIntent does not match order", 400);
    }
    if (order.status === "paid") {
      return { payment: { orderId: order.id, paid: true, method: "card" }, order };
    }
    const payment = await c.b.services.pos.checkout(id, {
      method: "card",
      providerRef: pi.id,
    });
    return { payment, order: await c.b.services.pos.getOrder(id) };
  });
}
