import type { OrderChannel } from "@resto/core";
import { authed } from "../../../lib/api-handler";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const open = new URL(request.url).searchParams.get("open") === "true";
  return authed(request, ({ b, locationId }) =>
    open
      ? b.services.pos.listOpenOrders(locationId)
      : b.services.pos.listOrders(locationId),
  );
}

export function POST(request: Request) {
  return authed(request, async ({ b, locationId }) => {
    const body = (await request.json()) as { channel?: OrderChannel; tableId?: string };
    return b.services.pos.openOrder({
      locationId,
      channel: body.channel ?? "pos",
      ...(body.tableId ? { tableId: body.tableId } : {}),
    });
  });
}
