import { toPublicUser } from "@resto/core";
import { authed } from "../../../lib/api-handler";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return authed(request, async ({ b, session, locationId }) => {
    const locations = b.store.locations.filter((l) => l.orgId === session.orgId);
    const org = b.store.orgs.find((o) => o.id === session.orgId) ?? null;
    return {
      user: toPublicUser(session.user),
      org,
      locations,
      currentLocation: locations.find((l) => l.id === locationId) ?? null,
      tables: b.store.tables.filter((t) => t.locationId === locationId),
      categories: await b.services.menu.listCategories(locationId),
      menuItems: await b.services.menu.listItems(locationId),
      integrations: {
        stripeSimulated: b.stripe.simulated,
        whatsappSimulated: b.whatsapp.simulated,
        stripePublishableKey: b.stripe.publishableKey,
      },
    };
  });
}
