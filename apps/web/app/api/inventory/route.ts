import { authed } from "../../../lib/api-handler";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return authed(request, async ({ b, locationId }) => {
    const items = await b.services.inventory.list(locationId);
    return items.map((i) => ({ ...i, low: i.quantityOnHand <= i.reorderThreshold }));
  });
}
