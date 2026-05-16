import { authed, requireRole } from "../../../lib/api-handler";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return authed(request, ({ b, locationId }) => b.services.tables.list(locationId));
}

export function POST(request: Request) {
  return authed(request, async (c) => {
    requireRole(c, "owner", "manager");
    const body = (await request.json()) as { label: string; seats: number };
    return c.b.services.tables.create({
      locationId: c.locationId,
      label: body.label,
      seats: body.seats,
    });
  });
}
