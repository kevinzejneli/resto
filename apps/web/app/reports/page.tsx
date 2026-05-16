"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@resto/core";
import type { SalesReport } from "@resto/core";
import { api } from "../../lib/api";

const RANGES = [7, 30, 90];

export default function ReportsPage() {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getReport(days)
      .then(setReport)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [days]);

  const maxDay = Math.max(1, ...(report?.byDay.map((d) => d.revenueMinor) ?? [1]));

  return (
    <>
      <h1>Reports</h1>
      <p className="sub">Sales history for this location.</p>
      {error && <p className="error">{error}</p>}

      <div className="row" style={{ marginBottom: 16 }}>
        {RANGES.map((r) => (
          <button
            key={r}
            className={r === days ? "btn-primary" : ""}
            onClick={() => setDays(r)}
          >
            Last {r} days
          </button>
        ))}
      </div>

      {report && (
        <>
          <div className="grid cards" style={{ marginBottom: 24 }}>
            <div className="card">
              <div className="stat-label">Revenue</div>
              <div className="stat">{formatMoney(report.totalRevenue)}</div>
            </div>
            <div className="card">
              <div className="stat-label">Orders</div>
              <div className="stat">{report.orderCount}</div>
            </div>
            <div className="card">
              <div className="stat-label">Avg order</div>
              <div className="stat">{formatMoney(report.avgOrder)}</div>
            </div>
          </div>

          <div className="cols">
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Revenue by day</h3>
              {report.byDay.length === 0 && (
                <p style={{ color: "var(--muted)" }}>No paid orders yet.</p>
              )}
              {report.byDay.map((d) => (
                <div key={d.date} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "var(--muted)",
                    }}
                  >
                    <span>{d.date}</span>
                    <span>
                      {formatMoney({
                        amountMinor: d.revenueMinor,
                        currency: report.currency,
                      })}{" "}
                      · {d.count}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 4,
                      background: "var(--accent)",
                      width: `${Math.max(2, (d.revenueMinor / maxDay) * 100)}%`,
                    }}
                  />
                </div>
              ))}
            </div>

            <div>
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ marginTop: 0 }}>Top items</h3>
                <table>
                  <tbody>
                    {report.topItems.map((t) => (
                      <tr key={t.menuItemId}>
                        <td>{t.name}</td>
                        <td>{t.quantity}×</td>
                        <td>
                          {formatMoney({
                            amountMinor: t.revenueMinor,
                            currency: report.currency,
                          })}
                        </td>
                      </tr>
                    ))}
                    {report.topItems.length === 0 && (
                      <tr>
                        <td style={{ color: "var(--muted)" }}>No data.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="card">
                <h3 style={{ marginTop: 0 }}>By channel</h3>
                {report.byChannel.map((c) => (
                  <div key={c.channel} className="ticket-line">
                    <span>{c.channel}</span>
                    <span>
                      {formatMoney({
                        amountMinor: c.revenueMinor,
                        currency: report.currency,
                      })}{" "}
                      · {c.count}
                    </span>
                  </div>
                ))}
                {report.byChannel.length === 0 && (
                  <p style={{ color: "var(--muted)" }}>No data.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
