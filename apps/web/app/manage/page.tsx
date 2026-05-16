"use client";

import { useCallback, useEffect, useState } from "react";
import { formatMoney } from "@resto/core";
import type { MenuCategory, MenuItem, Table } from "@resto/core";
import { api } from "../../lib/api";

export default function ManagePage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [catName, setCatName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemCat, setItemCat] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [tblLabel, setTblLabel] = useState("");
  const [tblSeats, setTblSeats] = useState("2");

  const load = useCallback(async () => {
    try {
      const [c, i, t] = await Promise.all([
        api.listCategories(),
        api.listMenuItems(),
        api.listTables(),
      ]);
      setCategories(c);
      setItems(i);
      setTables(t);
      if (!itemCat && c[0]) setItemCat(c[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [itemCat]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act<T>(fn: () => Promise<T>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Manage</h1>
      <p className="sub">Menu, pricing, and tables for this location.</p>
      {error && <p className="error">{error}</p>}

      <div className="cols">
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Menu items</h3>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>
                      {categories.find((c) => c.id === m.categoryId)?.name ?? "—"}
                    </td>
                    <td>{formatMoney(m.price)}</td>
                    <td>
                      <div className="row">
                        <button
                          disabled={busy}
                          onClick={() =>
                            act(() =>
                              api.updateMenuItem(m.id, { available: !m.available }),
                            )
                          }
                        >
                          {m.available ? "Disable" : "Enable"}
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => act(() => api.deleteMenuItem(m.id))}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ color: "var(--muted)" }}>
                      No items.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Add item</h3>
            <div className="row">
              <input
                placeholder="Name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
              <select value={itemCat} onChange={(e) => setItemCat(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                placeholder="Price (e.g. 7.50)"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                style={{ width: 120 }}
              />
              <button
                className="btn-primary"
                disabled={busy || !itemName || !itemCat || !itemPrice}
                onClick={() =>
                  act(async () => {
                    await api.createMenuItem({
                      categoryId: itemCat,
                      name: itemName,
                      priceMinor: Math.round(Number(itemPrice) * 100),
                    });
                    setItemName("");
                    setItemPrice("");
                  })
                }
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Categories</h3>
            {categories.map((c) => (
              <div key={c.id} className="ticket-line">
                <span>{c.name}</span>
              </div>
            ))}
            <div className="row" style={{ marginTop: 12 }}>
              <input
                placeholder="New category"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
              />
              <button
                disabled={busy || !catName}
                onClick={() =>
                  act(async () => {
                    await api.createCategory({ name: catName });
                    setCatName("");
                  })
                }
              >
                Add
              </button>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Tables</h3>
            {tables.map((t) => (
              <div key={t.id} className="ticket-line">
                <span>
                  {t.label} · {t.seats} seats
                </span>
                <button
                  disabled={busy}
                  onClick={() => act(() => api.deleteTable(t.id))}
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="row" style={{ marginTop: 12 }}>
              <input
                placeholder="Label"
                value={tblLabel}
                onChange={(e) => setTblLabel(e.target.value)}
                style={{ width: 100 }}
              />
              <input
                placeholder="Seats"
                value={tblSeats}
                onChange={(e) => setTblSeats(e.target.value)}
                style={{ width: 70 }}
              />
              <button
                disabled={busy || !tblLabel}
                onClick={() =>
                  act(async () => {
                    await api.createTable({
                      label: tblLabel,
                      seats: Number(tblSeats) || 1,
                    });
                    setTblLabel("");
                  })
                }
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
