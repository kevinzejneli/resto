"use client";

import { useCallback, useEffect, useState } from "react";
import { formatMoney, type Order } from "@resto/core";
import type { Bootstrap } from "@resto/api-client";
import { api } from "../../lib/api";
import { CardPaymentModal } from "../../components/CardPaymentModal";

interface CardFlow {
  orderId: string;
  clientSecret: string;
  paymentIntentId: string;
}

export default function PosPage() {
  const [boot, setBoot] = useState<Bootstrap | null>(null);
  const [open, setOpen] = useState<Order[]>([]);
  const [active, setActive] = useState<Order | null>(null);
  const [tableId, setTableId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cardFlow, setCardFlow] = useState<CardFlow | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await api.listOrders(true);
      setOpen(list);
      setActive((a) => (a ? list.find((o) => o.id === a.id) ?? a : a));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }, []);

  useEffect(() => {
    void api.bootstrap().then(setBoot).catch((e) => setError(String(e)));
    void refresh();
  }, [refresh]);

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  async function newOrder() {
    const order = await run(() =>
      api.openOrder({ channel: "pos", ...(tableId ? { tableId } : {}) }),
    );
    if (order) {
      setActive(order);
      void refresh();
    }
  }

  async function addItem(menuItemId: string) {
    if (!active) return;
    const o = await run(() => api.addLine(active.id, { menuItemId, quantity: 1 }));
    if (o) {
      setActive(o);
      void refresh();
    }
  }

  async function removeLine(index: number) {
    if (!active) return;
    const o = await run(() => api.removeLine(active.id, index));
    if (o) setActive(o);
  }

  async function send() {
    if (!active) return;
    const o = await run(() => api.sendToKitchen(active.id));
    if (o) {
      setActive(o);
      void refresh();
    }
  }

  async function checkout(method: "cash" | "card") {
    if (!active) return;
    const res = await run(() => api.checkout(active.id, method));
    if (!res) return;
    if (
      res.requiresAction &&
      res.clientSecret &&
      res.paymentIntentId &&
      boot?.integrations.stripePublishableKey
    ) {
      setCardFlow({
        orderId: active.id,
        clientSecret: res.clientSecret,
        paymentIntentId: res.paymentIntentId,
      });
      return;
    }
    if (res.order) {
      setActive(res.order);
      void refresh();
    }
  }

  function onCardPaid(order: Order | null | undefined) {
    setCardFlow(null);
    if (order) setActive(order);
    void refresh();
  }

  return (
    <>
      <h1>POS</h1>
      <p className="sub">Take orders, fire to kitchen, and check out.</p>
      {error && <p className="error">{error}</p>}

      <div className="cols">
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="row">
              <select value={tableId} onChange={(e) => setTableId(e.target.value)}>
                <option value="">Takeaway</option>
                {boot?.tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} ({t.seats})
                  </option>
                ))}
              </select>
              <button className="btn-primary" onClick={newOrder} disabled={busy}>
                New order
              </button>
            </div>
          </div>

          <h3>Menu</h3>
          <div className="grid menu-grid">
            {boot?.menuItems.map((m) => (
              <button
                key={m.id}
                className="card tile"
                disabled={!active || active.status !== "open" || busy || !m.available}
                onClick={() => addItem(m.id)}
              >
                <div>{m.name}</div>
                <div className="price">{formatMoney(m.price)}</div>
              </button>
            ))}
          </div>

          <h3 style={{ marginTop: 24 }}>Open orders</h3>
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Table</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {open.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setActive(o)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{o.id}</td>
                  <td>
                    {boot?.tables.find((t) => t.id === o.tableId)?.label ?? "—"}
                  </td>
                  <td>
                    <span className="badge badge-accent">{o.status}</span>
                  </td>
                  <td>{formatMoney(o.total)}</td>
                </tr>
              ))}
              {open.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: "var(--muted)" }}>
                    No open orders.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>
            {active ? `Ticket ${active.id}` : "No order selected"}
          </h3>
          {active && (
            <>
              <div style={{ marginBottom: 12 }}>
                <span className="badge badge-accent">{active.status}</span>
              </div>
              {active.lines.length === 0 && (
                <p style={{ color: "var(--muted)" }}>Empty — tap menu items.</p>
              )}
              {active.lines.map((l, i) => (
                <div className="ticket-line" key={`${l.menuItemId}-${i}`}>
                  <span>
                    {l.quantity}× {l.name}
                  </span>
                  <span>
                    {formatMoney({
                      amountMinor: l.unitPrice.amountMinor * l.quantity,
                      currency: l.unitPrice.currency,
                    })}
                    {active.status === "open" && (
                      <button
                        style={{ marginLeft: 8, padding: "2px 6px" }}
                        onClick={() => removeLine(i)}
                        disabled={busy}
                      >
                        ✕
                      </button>
                    )}
                  </span>
                </div>
              ))}
              <div
                className="ticket-line"
                style={{ fontWeight: 700, borderBottom: "none" }}
              >
                <span>Total</span>
                <span>{formatMoney(active.total)}</span>
              </div>

              <div className="row" style={{ marginTop: 16 }}>
                {active.status === "open" && (
                  <button onClick={send} disabled={busy || active.lines.length === 0}>
                    Send to kitchen
                  </button>
                )}
                {(active.status === "open" ||
                  active.status === "sent_to_kitchen" ||
                  active.status === "ready") && (
                  <>
                    <button
                      className="btn-primary"
                      onClick={() => checkout("cash")}
                      disabled={busy || active.lines.length === 0}
                    >
                      Pay cash
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => checkout("card")}
                      disabled={busy || active.lines.length === 0}
                    >
                      Pay card
                    </button>
                  </>
                )}
                {active.status === "paid" && (
                  <span className="badge badge-green">Paid ✓</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {cardFlow && boot?.integrations.stripePublishableKey && (
        <CardPaymentModal
          orderId={cardFlow.orderId}
          clientSecret={cardFlow.clientSecret}
          paymentIntentId={cardFlow.paymentIntentId}
          publishableKey={boot.integrations.stripePublishableKey}
          onPaid={onCardPaid}
          onCancel={() => setCardFlow(null)}
        />
      )}
    </>
  );
}
