import { NextResponse } from "next/server";
import type { ID, Order, Role } from "@resto/core";
import { backend, type Backend } from "./backend";
import { getSession, type Session } from "./auth";

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export interface Ctx {
  b: Backend;
  session: Session;
  /** Location resolved from the x-location-id header, validated for this org. */
  locationId: ID;
}

function resolveLocationId(request: Request, b: Backend, session: Session): ID {
  const orgLocations = b.store.locations.filter((l) => l.orgId === session.orgId);
  if (orgLocations.length === 0) throw new HttpError("No locations for org", 403);
  const requested = request.headers.get("x-location-id");
  if (!requested) return orgLocations[0]!.id;
  const match = orgLocations.find((l) => l.id === requested);
  if (!match) throw new HttpError("Location not in your organization", 403);
  return match.id;
}

/** Guard a by-id entity: its location must belong to the caller's org. */
export function assertOrgLocation(ctx: Ctx, locationId: ID): void {
  const ok = ctx.b.store.locations.some(
    (l) => l.id === locationId && l.orgId === ctx.session.orgId,
  );
  if (!ok) throw new HttpError("Not found", 404);
}

/** Require the caller to hold one of the given roles. */
export function requireRole(ctx: Ctx, ...roles: Role[]): void {
  if (!roles.includes(ctx.session.user.role)) {
    throw new HttpError("Insufficient permissions", 403);
  }
}

/** Fetch an order and assert it belongs to the caller's org. */
export async function requireOrgOrder(ctx: Ctx, orderId: ID): Promise<Order> {
  const order = await ctx.b.services.pos.getOrder(orderId);
  if (!order) throw new HttpError("Order not found", 404);
  assertOrgLocation(ctx, order.locationId);
  return order;
}

/** Wrap an authenticated, location-scoped handler. Persists after writes. */
export async function authed<T>(
  request: Request,
  fn: (ctx: Ctx) => Promise<T>,
): Promise<NextResponse> {
  try {
    const b = backend();
    const session = getSession(request, b.store);
    if (!session) throw new HttpError("Unauthorized", 401);
    const locationId = resolveLocationId(request, b, session);
    const data = await fn({ b, session, locationId });
    if (request.method !== "GET") b.persist();
    return NextResponse.json(data);
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 400;
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status });
  }
}
