"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Bootstrap } from "@resto/api-client";
import { api, clearAuth, isAuthed, setActiveLocation } from "../lib/api";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/pos", label: "POS" },
  { href: "/inventory", label: "Inventory" },
  { href: "/orders", label: "WhatsApp Orders" },
];

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [boot, setBoot] = useState<Bootstrap | null>(null);
  const [ready, setReady] = useState(false);

  const isLogin = pathname === "/login";

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }
    if (!isAuthed()) {
      router.replace("/login");
      return;
    }
    api
      .bootstrap()
      .then((b) => {
        setBoot(b);
        setReady(true);
      })
      .catch(() => {
        clearAuth();
        router.replace("/login");
      });
  }, [isLogin, pathname, router]);

  if (isLogin) return <>{children}</>;
  if (!ready) return null;

  function onLocationChange(id: string) {
    setActiveLocation(id);
    window.location.reload();
  }

  function logout() {
    clearAuth();
    router.replace("/login");
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">RestoMaster</div>
        {boot?.org && (
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
            {boot.org.name}
          </div>
        )}
        {boot && boot.locations.length > 0 && (
          <select
            value={boot.currentLocation?.id ?? ""}
            onChange={(e) => onLocationChange(e.target.value)}
            style={{ width: "100%", marginBottom: 16 }}
          >
            {boot.locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        )}
        <nav>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {boot?.user.name} · {boot?.user.role}
          </div>
          <button onClick={logout} style={{ marginTop: 8, width: "100%" }}>
            Log out
          </button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
