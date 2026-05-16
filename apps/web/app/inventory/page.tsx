"use client";

import { useEffect, useState } from "react";
import type { InventoryRow } from "@resto/api-client";
import { api } from "../../lib/api";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setItems(await api.listInventory());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  useEffect(() => {
    void load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  async function adjust(id: string, delta: number) {
    setBusy(true);
    setError(null);
    try {
      await api.adjustInventory(id, { delta, reason: "manual_adjustment" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Inventory</h1>
      <p className="sub">
        Stock depletes automatically when orders are paid. Low items are
        highlighted.
      </p>
      {error && <p className="error">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>On hand</th>
            <th>Reorder at</th>
            <th>Status</th>
            <th>Adjust</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} className={i.low ? "row-low" : ""}>
              <td>{i.name}</td>
              <td>
                {i.quantityOnHand} {i.unit}
              </td>
              <td>
                {i.reorderThreshold} {i.unit}
              </td>
              <td>
                {i.low ? (
                  <span className="badge badge-red">Low</span>
                ) : (
                  <span className="badge badge-green">OK</span>
                )}
              </td>
              <td>
                <div className="row">
                  <button onClick={() => adjust(i.id, -1)} disabled={busy}>
                    −1
                  </button>
                  <button onClick={() => adjust(i.id, 1)} disabled={busy}>
                    +1
                  </button>
                  <button onClick={() => adjust(i.id, 10)} disabled={busy}>
                    +10
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
