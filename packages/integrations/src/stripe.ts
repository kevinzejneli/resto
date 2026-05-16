import type { Money } from "@resto/core";

/**
 * Stripe payment boundary. Intentionally a thin stub — swap the body for the
 * real `stripe` SDK once keys are wired. Signatures are stable so callers
 * (POS checkout) don't change.
 */

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
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
}

export interface StripeClient {
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent>;
  verifyWebhook(payload: string, signature: string): Promise<{ type: string }>;
}

export function createStripeClient(_config: StripeConfig): StripeClient {
  return {
    async createPaymentIntent() {
      throw new Error("StripeClient.createPaymentIntent not implemented yet");
    },
    async verifyWebhook() {
      throw new Error("StripeClient.verifyWebhook not implemented yet");
    },
  };
}
