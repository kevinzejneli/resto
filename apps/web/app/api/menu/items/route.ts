import type { RecipeLine } from "@resto/core";
import { authed, requireRole } from "../../../../lib/api-handler";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return authed(request, ({ b, locationId }) =>
    b.services.menu.listItems(locationId),
  );
}

export function POST(request: Request) {
  return authed(request, async (c) => {
    requireRole(c, "owner", "manager");
    const body = (await request.json()) as {
      categoryId: string;
      name: string;
      description?: string;
      priceMinor: number;
      recipe?: RecipeLine[];
    };
    return c.b.services.menu.createItem({
      locationId: c.locationId,
      categoryId: body.categoryId,
      name: body.name,
      ...(body.description ? { description: body.description } : {}),
      priceMinor: body.priceMinor,
      ...(body.recipe ? { recipe: body.recipe } : {}),
    });
  });
}
