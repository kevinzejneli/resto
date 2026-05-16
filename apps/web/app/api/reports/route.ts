import { authed } from "../../../lib/api-handler";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const days = Math.min(
    365,
    Math.max(1, Number(new URL(request.url).searchParams.get("days") ?? 30)),
  );
  const fromDate = new Date(Date.now() - (days - 1) * 86400000)
    .toISOString()
    .slice(0, 10);
  return authed(request, ({ b, locationId }) =>
    b.services.reports.sales(locationId, { fromDate }),
  );
}
