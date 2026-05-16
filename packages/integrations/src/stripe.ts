import Stripe from "stripe";
import type { Money } from "@resto/core";

/**
 * Stripe payment boundary. When no real secret key is configured it runs in
 * "simulated" mode so POS checkout still works end-to-end in dev/demo.
 */

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  publishableKey: string;
}

export interface CreatePaymentIntentInput {
  amount: Money;
  orderId: string;
  description?: string;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  status: "requires_payment_method" | "succeeded";
  simulated: boolean;
}

export interface StripeWebhookEvent {
  type: string;
  orderId?: string;
}

export interface RetrievedIntent {
  id: string;
  status: string;
  orderId?: string;
}

export interface StripeClient {
  readonly simulated: boolean;
  /** Safe to expose to the browser for Stripe.js; null in simulated mode. */
  readonly publishableKey: string | null;
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent>;
  retrievePaymentIntent(id: string): Promise<RetrievedIntent>;
  verifyWebhook(payload: string, signature: string | null): Promise<StripeWebhookEvent>;
}

function isRealKey(key: string): boolean {
  return key.startsWith("sk_") && !key.includes("xxx");
}

export function stripeConfigFromEnv(env: NodeJS.ProcessEnv = process.env): StripeConfig {
  return {
    secretKey: env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: env.STRIPE_WEBHOOK_SECRET ?? "",
    publishableKey: env.STRIPE_PUBLISHABLE_KEY ?? "",
  };
}

export function createStripeClient(config: StripeConfig): StripeClient {
  const real = isRealKey(config.secretKey);
  const stripe = real ? new Stripe(config.secretKey) : null;

  return {
    simulated: !real,
    publishableKey: real ? config.publishableKey || null : null,

    async createPaymentIntent(input) {
      if (!stripe) {
        return {
          id: `pi_sim_${input.orderId}`,
          clientSecret: `pi_sim_${input.orderId}_secret`,
          status: "succeeded",
          simulated: true,
        };
      }
      const pi = await stripe.paymentIntents.create({
        amount: input.amount.amountMinor,
        currency: input.amount.currency.toLowerCase(),
        description: input.description ?? `Order ${input.orderId}`,
        metadata: { orderId: input.orderId },
        automatic_payment_methods: { enabled: true },
      });
      return {
        id: pi.id,
        clientSecret: pi.client_secret ?? "",
        status: pi.status === "succeeded" ? "succeeded" : "requires_payment_method",
        simulated: false,
      };
    },

    async retrievePaymentIntent(id) {
      if (!stripe) {
        return { id, status: "succeeded" };
      }
      const pi = await stripe.paymentIntents.retrieve(id);
      return {
        id: pi.id,
        status: pi.status,
        ...(pi.metadata?.orderId ? { orderId: pi.metadata.orderId } : {}),
      };
    },

    async verifyWebhook(payload, signature) {
      if (!stripe || !config.webhookSecret) {
        const parsed = JSON.parse(payload) as {
          type?: string;
          data?: { object?: { metadata?: { orderId?: string } } };
        };
        return {
          type: parsed.type ?? "unknown",
          ...(parsed.data?.object?.metadata?.orderId
            ? { orderId: parsed.data.object.metadata.orderId }
            : {}),
        };
      }
      if (!signature) throw new Error("Missing stripe-signature header");
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        config.webhookSecret,
      );
      const obj = event.data.object as { metadata?: { orderId?: string } };
      return {
        type: event.type,
        ...(obj.metadata?.orderId ? { orderId: obj.metadata.orderId } : {}),
      };
    },
  };
}
