import { backend, LOCATION_ID } from "../../../../lib/backend";
import { route } from "../../../../lib/http";

export const dynamic = "force-dynamic";

/** Drive the WhatsApp ordering bot without a real Meta account. */
export function POST(request: Request) {
  const { services, whatsapp } = backend();
  return route(async () => {
    const body = (await request.json()) as { from: string; text: string };
    const result = await services.ordering.handleInbound(LOCATION_ID, {
      from: body.from,
      text: body.text,
      receivedAt: new Date().toISOString(),
    });
    await whatsapp.sendText(body.from, result.reply);
    return result;
  });
}
