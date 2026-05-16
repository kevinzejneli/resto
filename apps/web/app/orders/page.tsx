"use client";

import { useEffect, useRef, useState } from "react";
import type { OrderingSession } from "@resto/core";
import { api } from "../../lib/api";

interface ChatLine {
  dir: "in" | "out";
  text: string;
}

export default function OrdersPage() {
  const [phone, setPhone] = useState("+355691112233");
  const [text, setText] = useState("hi");
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [sessions, setSessions] = useState<OrderingSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function loadSessions() {
    try {
      setSessions(await api.listSessions());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  useEffect(() => {
    void loadSessions();
    const t = setInterval(loadSessions, 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  async function send() {
    if (!text.trim()) return;
    const outgoing = text;
    setChat((c) => [...c, { dir: "out", text: outgoing }]);
    setText("");
    setBusy(true);
    setError(null);
    try {
      const res = await api.simulateInbound({ from: phone, text: outgoing });
      setChat((c) => [...c, { dir: "in", text: res.reply }]);
      await loadSessions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>WhatsApp Orders</h1>
      <p className="sub">
        Simulate a customer chatting with the ordering bot. Try: <code>hi</code>{" "}
        → a number → <code>done</code> → <code>yes</code>. Confirmed orders flow
        into POS &amp; deplete inventory.
      </p>
      {error && <p className="error">{error}</p>}

      <div className="cols">
        <div className="card">
          <div className="row" style={{ marginBottom: 12 }}>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: 180 }}
            />
            <span className="badge">customer</span>
          </div>
          <div className="chat">
            {chat.length === 0 && (
              <p style={{ color: "var(--muted)" }}>Say hi to start.</p>
            )}
            {chat.map((c, i) => (
              <div
                key={i}
                className={`bubble ${c.dir === "out" ? "bubble-out" : "bubble-in"}`}
              >
                {c.text}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Message…"
              style={{ flex: 1 }}
            />
            <button className="btn-primary" onClick={send} disabled={busy}>
              Send
            </button>
          </div>
        </div>

        <div>
          <h3 style={{ marginTop: 0 }}>Sessions</h3>
          {sessions.length === 0 && (
            <p style={{ color: "var(--muted)" }}>No sessions yet.</p>
          )}
          {sessions.map((s) => (
            <div className="card" key={s.id} style={{ marginBottom: 12 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>{s.customer.phone}</strong>
                <span className="badge badge-accent">{s.state}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
                {s.cart.length === 0
                  ? "Empty cart"
                  : s.cart.map((l) => `${l.quantity}× ${l.name}`).join(", ")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
