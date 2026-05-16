import { backend, LOCATION_ID } from "../../../lib/backend";
import { route } from "../../../lib/http";

export const dynamic = "force-dynamic";

export function GET() {
  const { services, store, stripe, whatsapp } = backend();
  return route(async () => ({
    location: store.location,
    tables: store.tables,
    categories: await services.menu.listCategories(LOCATION_ID),
    menuItems: await services.menu.listItems(LOCATION_ID),
    integrations: { stripeSimulated: stripe.simulated, whatsappSimulated: whatsapp.simulated },
  }));
}
