"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, saveAuthToken } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@demo.test");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { token } = await api.login(email, password);
      saveAuthToken(token);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <form onSubmit={submit} className="card" style={{ width: 360 }}>
        <div className="brand" style={{ marginBottom: 4 }}>
          RestoMaster
        </div>
        <p className="sub" style={{ marginBottom: 20 }}>
          Sign in to your restaurant.
        </p>
        <label style={{ fontSize: 13 }}>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          style={{ width: "100%", margin: "6px 0 14px" }}
        />
        <label style={{ fontSize: 13 }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          style={{ width: "100%", margin: "6px 0 18px" }}
        />
        {error && <p className="error">{error}</p>}
        <button
          type="submit"
          className="btn-primary"
          disabled={busy}
          style={{ width: "100%" }}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 14 }}>
          Demo: owner@demo.test / demo1234
        </p>
      </form>
    </div>
  );
}
