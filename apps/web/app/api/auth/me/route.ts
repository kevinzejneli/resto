import { toPublicUser } from "@resto/core";
import { authed } from "../../../../lib/api-handler";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return authed(request, async ({ b, session }) => ({
    user: toPublicUser(session.user),
    org: b.store.orgs.find((o) => o.id === session.orgId) ?? null,
  }));
}
