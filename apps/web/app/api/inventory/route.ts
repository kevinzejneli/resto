import { backend, LOCATION_ID } from "../../../lib/backend";
import { route } from "../../../lib/http";

export const dynamic = "force-dynamic";

export function GET() {
  const { services } = backend();
  return route(async () => {
    const items = await services.inventory.list(LOCATION_ID);
    return items.map((i) => ({ ...i, low: i.quantityOnHand <= i.reorderThreshold }));
  });
}
