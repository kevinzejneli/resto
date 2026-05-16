import { createHmac, timingSafeEqual } from "node:crypto";
import type { InboundMessage } from "@resto/core";

/**
 * WhatsApp Business Cloud API boundary. Falls back to "simulated" mode (no
 * outbound HTTP) when credentials are absent, so the ordering flow can be
 * exercised locally via the simulate endpoint / webhook.
 */

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  appSecret: string;
}

export interface WhatsAppClient {
  readonly simulated: boolean;
  sendText(to: string, body: string): Promise<void>;
  verifySubscription(params: { mode: string; token: string; challenge: string }): string | null;
  verifySignature(rawBody: string, signatureHeader: string | null): boolean;
  parseInbound(body: unknown): InboundMessage[];
}

export function whatsappConfigFromEnv(env: NodeJS.ProcessEnv = process.env): WhatsAppConfig {
  return {
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    accessToken: env.WHATSAPP_ACCESS_TOKEN ?? "",
    verifyToken: env.WHATSAPP_VERIFY_TOKEN ?? "changeme",
    appSecret: env.WHATSAPP_APP_SECRET ?? "",
  };
}

export function createWhatsAppClient(config: WhatsAppConfig): WhatsAppClient {
  const configured = Boolean(config.phoneNumberId && config.accessToken);

  return {
    simulated: !configured,

    async sendText(to, body) {
      if (!configured) {
        console.log(`[whatsapp:simulated] -> ${to}: ${body}`);
        return;
      }
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body },
          }),
        },
      );
      if (!res.ok) {
        throw new Error(`WhatsApp send failed: ${res.status} ${await res.text()}`);
      }
    },

    verifySubscription({ mode, token, challenge }) {
      return mode === "subscribe" && token === config.verifyToken ? challenge : null;
    },

    verifySignature(rawBody, signatureHeader) {
      if (!config.appSecret) return true; // unconfigured: don't block local testing
      if (!signatureHeader?.startsWith("sha256=")) return false;
      const expected = createHmac("sha256", config.appSecret)
        .update(rawBody)
        .digest("hex");
      const got = signatureHeader.slice("sha256=".length);
      const a = Buffer.from(expected);
      const b = Buffer.from(got);
      return a.length === b.length && timingSafeEqual(a, b);
    },

    parseInbound(body) {
      const messages: InboundMessage[] = [];
      const entries = (body as { entry?: unknown[] })?.entry ?? [];
      for (const entry of entries) {
        const changes = (entry as { changes?: unknown[] })?.changes ?? [];
        for (const change of changes) {
          const value = (change as { value?: { messages?: unknown[] } })?.value;
          for (const msg of value?.messages ?? []) {
            const m = msg as {
              from?: string;
              text?: { body?: string };
              timestamp?: string;
            };
            if (m.from && m.text?.body) {
              messages.push({
                from: m.from,
                text: m.text.body,
                receivedAt: m.timestamp
                  ? new Date(Number(m.timestamp) * 1000).toISOString()
                  : new Date().toISOString(),
              });
            }
          }
        }
      }
      return messages;
    },
  };
}
