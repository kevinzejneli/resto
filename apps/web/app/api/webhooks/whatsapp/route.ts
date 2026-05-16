import { backend, LOCATION_ID } from "../../../../lib/backend";

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
  const { whatsapp, services } = backend();
  const raw = await request.text();

  if (!whatsapp.verifySignature(raw, request.headers.get("x-hub-signature-256"))) {
    return new Response("invalid signature", { status: 401 });
  }

  const messages = whatsapp.parseInbound(JSON.parse(raw));
  for (const message of messages) {
    const { reply } = await services.ordering.handleInbound(LOCATION_ID, message);
    await whatsapp.sendText(message.from, reply);
  }
  return Response.json({ received: true, handled: messages.length });
}
