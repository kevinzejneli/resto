import { NextResponse } from "next/server";

/**
 * WhatsApp Cloud API webhook.
 * - GET: Meta subscription handshake (echo hub.challenge).
 * - POST: inbound messages -> OrderingService (stubbed).
 */
export function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode") ?? "";
  const token = url.searchParams.get("hub.verify_token") ?? "";
  const challenge = url.searchParams.get("hub.challenge") ?? "";

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

export async function POST(_request: Request) {
  // TODO: verify X-Hub-Signature-256, parse inbound, hand to OrderingService.
  return NextResponse.json({ received: true });
}
