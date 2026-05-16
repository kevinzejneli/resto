import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: number) {
  return NextResponse.json(data, { status: init ?? 200 });
}

export function fail(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status });
}

/** Wrap a handler so thrown domain errors become clean 400s. */
export function route<T>(fn: () => Promise<T>) {
  return fn().then(ok).catch((e) => fail(e));
}
