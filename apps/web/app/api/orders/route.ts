import { backend, LOCATION_ID } from "../../../lib/backend";
import { route } from "../../../lib/http";
import type { OrderChannel } from "@resto/core";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const { services } = backend();
  const open = new URL(request.url).searchParams.get("open") === "true";
  return route(async () =>
    open
      ? services.pos.listOpenOrders(LOCATION_ID)
      : services.pos.listOrders(LOCATION_ID),
  );
}

export function POST(request: Request) {
  const { services } = backend();
  return route(async () => {
    const body = (await request.json()) as { channel?: OrderChannel; tableId?: string };
    return services.pos.openOrder({
      locationId: LOCATION_ID,
      channel: body.channel ?? "pos",
      ...(body.tableId ? { tableId: body.tableId } : {}),
    });
  });
}
