import { backend } from "../../../../lib/backend";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const { whatsapp } = backend();
  const url = new URL(request.url);
  const challenge = whatsapp.verifySubscription({
    mode: url.searchParams.get("hub.mode") ?? "",
    token: url.searchParams.get("hub.verify_token") ?? "",
    challenge: url.searchParams.get("hub.challenge") ?? "",
  });
  return challenge
    ? new Response(challenge, { status: 200 })
    : new Response("forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const b = backend();
  const raw = await request.text();

  if (!b.whatsapp.verifySignature(raw, request.headers.get("x-hub-signature-256"))) {
    return new Response("invalid signature", { status: 401 });
  }

  // Real deployments map the WhatsApp phone-number-id to a location; for the
  // demo, route to a configured or first location.
  const locationId =
    process.env.RESTO_WHATSAPP_LOCATION_ID ?? b.store.locations[0]?.id;
  if (!locationId) return new Response("no location", { status: 503 });

  const messages = b.whatsapp.parseInbound(JSON.parse(raw));
  for (const message of messages) {
    const { reply } = await b.services.ordering.handleInbound(locationId, message);
    await b.whatsapp.sendText(message.from, reply);
  }
  if (messages.length > 0) b.persist();
  return Response.json({ received: true, handled: messages.length });
}
