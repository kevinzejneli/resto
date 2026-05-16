import { authed, requireRole } from "../../../../lib/api-handler";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return authed(request, ({ b, locationId }) =>
    b.services.menu.listCategories(locationId),
  );
}

export function POST(request: Request) {
  return authed(request, async (c) => {
    requireRole(c, "owner", "manager");
    const body = (await request.json()) as { name: string; sortOrder?: number };
    return c.b.services.menu.createCategory({
      locationId: c.locationId,
      name: body.name,
      ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
    });
  });
}
