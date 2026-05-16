import { NextResponse } from "next/server";

/**
 * Stripe webhook receiver. Verification + event handling is stubbed; wire
 * `createStripeClient().verifyWebhook` here once STRIPE_* env vars are set.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  // TODO: verify signature and dispatch payment_intent.succeeded -> mark order paid.
  return NextResponse.json({ received: true });
}
