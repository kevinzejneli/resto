import { authed } from "../../../../lib/api-handler";

export const dynamic = "force-dynamic";

/** Drive the WhatsApp ordering bot without a real Meta account. */
export function POST(request: Request) {
  return authed(request, async ({ b, locationId }) => {
    const body = (await request.json()) as { from: string; text: string };
    const result = await b.services.ordering.handleInbound(locationId, {
      from: body.from,
      text: body.text,
      receivedAt: new Date().toISOString(),
    });
    await b.whatsapp.sendText(body.from, result.reply);
    return result;
  });
}
