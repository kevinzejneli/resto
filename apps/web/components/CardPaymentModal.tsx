"use client";

import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { Order } from "@resto/core";
import { api } from "../lib/api";

interface Props {
  orderId: string;
  clientSecret: string;
  paymentIntentId: string;
  publishableKey: string;
  onPaid: (order: Order | null | undefined) => void;
  onCancel: () => void;
}

function PayForm({
  orderId,
  paymentIntentId,
  onPaid,
  onCancel,
}: Pick<Props, "orderId" | "paymentIntentId" | "onPaid" | "onCancel">) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    try {
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });
      if (stripeError) {
        setError(stripeError.message ?? "Payment failed");
        return;
      }
      const res = await api.settleCard(orderId, paymentIntentId);
      onPaid(res.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <PaymentElement />
      {error && <p className="error" style={{ marginTop: 12 }}>{error}</p>}
      <div className="row" style={{ marginTop: 16 }}>
        <button
          type="submit"
          className="btn-primary"
          disabled={!stripe || busy}
        >
          {busy ? "Processing…" : "Pay"}
        </button>
        <button type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function CardPaymentModal({
  orderId,
  clientSecret,
  paymentIntentId,
  publishableKey,
  onPaid,
  onCancel,
}: Props) {
  const stripePromise = useMemo(
    () => loadStripe(publishableKey),
    [publishableKey],
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
      }}
    >
      <div className="card" style={{ width: 420, maxWidth: "90vw" }}>
        <h3 style={{ marginTop: 0 }}>Card payment</h3>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PayForm
            orderId={orderId}
            paymentIntentId={paymentIntentId}
            onPaid={onPaid}
            onCancel={onCancel}
          />
        </Elements>
      </div>
    </div>
  );
}
