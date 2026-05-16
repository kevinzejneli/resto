import type { InboundMessage } from "@resto/core";

/**
 * WhatsApp Business Cloud API boundary. Stub for now — real implementation
 * calls graph.facebook.com. Webhook verification follows Meta's hub.challenge
 * handshake; signature check uses the app secret (X-Hub-Signature-256).
 */

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  appSecret: string;
}

export interface WhatsAppClient {
  sendText(to: string, body: string): Promise<void>;
  /** Meta GET webhook verification handshake. Returns the challenge to echo, or null. */
  verifySubscription(params: {
    mode: string;
    token: string;
    challenge: string;
  }): string | null;
  /** Parse a POST webhook body into normalized inbound messages. */
  parseInbound(body: unknown): InboundMessage[];
}

export function createWhatsAppClient(config: WhatsAppConfig): WhatsAppClient {
  return {
    async sendText() {
      throw new Error("WhatsAppClient.sendText not implemented yet");
    },
    verifySubscription({ mode, token, challenge }) {
      return mode === "subscribe" && token === config.verifyToken
        ? challenge
        : null;
    },
    parseInbound() {
      throw new Error("WhatsAppClient.parseInbound not implemented yet");
    },
  };
}
