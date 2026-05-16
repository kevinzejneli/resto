"use client";

import { useEffect, useState } from "react";
import { formatMoney, money, type Order } from "@resto/core";
import type { Bootstrap, InventoryRow } from "@resto/api-client";
import { api } from "../lib/api";

export default function DashboardPage() {
  const [boot, setBoot] = useState<Bootstrap | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [b, o, i] = await Promise.all([
        api.bootstrap(),
        api.listOrders(),
        api.listInventory(),
      ]);
      setBoot(b);
      setOrders(o);
      setInventory(i);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }

  useEffect(() => {
    void load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const paidToday = orders.filter(
    (o) => o.status === "paid" && o.createdAt.slice(0, 10) === today,
  );
  const revenue = paidToday.reduce((acc, o) => acc + o.total.amountMinor, 0);
  const currency = boot?.currentLocation?.currency ?? "EUR";
  const openCount = orders.filter(
    (o) => o.status === "open" || o.status === "sent_to_kitchen" || o.status === "ready",
  ).length;
  const lowCount = inventory.filter((i) => i.low).length;

  return (
    <>
      <h1>Dashboard</h1>
      <p className="sub">{boot?.currentLocation?.name ?? "Loading…"}</p>

      {boot && (boot.integrations.stripeSimulated || boot.integrations.whatsappSimulated) && (
        <div className="notice">
          Running in demo mode
          {boot.integrations.stripeSimulated ? " · Stripe simulated" : ""}
          {boot.integrations.whatsappSimulated ? " · WhatsApp simulated" : ""}.
          Add keys to <code>.env</code> to go live.
        </div>
      )}
      {error && <p className="error">{error}</p>}

      <div className="grid cards">
        <div className="card">
          <div className="stat-label">Revenue today</div>
          <div className="stat">{formatMoney(money(revenue, currency))}</div>
        </div>
        <div className="card">
          <div className="stat-label">Open orders</div>
          <div className="stat">{openCount}</div>
        </div>
        <div className="card">
          <div className="stat-label">Paid orders today</div>
          <div className="stat">{paidToday.length}</div>
        </div>
        <div className="card">
          <div className="stat-label">Low stock items</div>
          <div className="stat">{lowCount}</div>
        </div>
      </div>
    </>
  );
}
