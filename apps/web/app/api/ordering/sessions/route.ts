import { authed } from "../../../../lib/api-handler";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return authed(request, ({ b, locationId }) =>
    b.services.ordering.listSessions(locationId),
  );
}
