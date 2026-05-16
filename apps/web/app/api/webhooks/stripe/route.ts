import { backend } from "../../../../lib/backend";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const b = backend();
  const { stripe, services } = b;
  const raw = await request.text();

  let event;
  try {
    event = await stripe.verifyWebhook(raw, request.headers.get("stripe-signature"));
  } catch (e) {
    const message = e instanceof Error ? e.message : "verification failed";
    return new Response(message, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded" && event.orderId) {
    const order = await services.pos.getOrder(event.orderId);
    if (order && order.status !== "paid" && order.status !== "cancelled") {
      await services.pos.checkout(event.orderId, {
        method: "card",
        providerRef: "stripe_webhook",
      });
      b.persist();
    }
  }
  return Response.json({ received: true });
}
