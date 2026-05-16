import { backend, LOCATION_ID } from "../../../../lib/backend";
import { route } from "../../../../lib/http";

export const dynamic = "force-dynamic";

export function GET() {
  const { services } = backend();
  return route(async () => services.ordering.listSessions(LOCATION_ID));
}
