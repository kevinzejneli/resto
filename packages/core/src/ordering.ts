import type { ID, ISODateTime } from "./types";
import type { Order, OrderLine } from "./pos";

/** WhatsApp ordering slice: customer conversations turn into POS orders. */

export interface Customer {
  id: ID;
  /** E.164, e.g. +355691234567. */
  phone: string;
  displayName?: string;
}

export type ConversationState =
  | "greeting"
  | "browsing_menu"
  | "building_cart"
  | "awaiting_confirmation"
  | "completed";

export interface OrderingSession {
  id: ID;
  locationId: ID;
  customer: Customer;
  state: ConversationState;
  cart: OrderLine[];
  updatedAt: ISODateTime;
}

/** Normalized inbound message, provider-agnostic above the WhatsApp client. */
export interface InboundMessage {
  from: string;
  text: string;
  receivedAt: ISODateTime;
}

/** Reply the bot should send back to the customer over WhatsApp. */
export interface OrderingReply {
  session: OrderingSession;
  reply: string;
}

export interface OrderingService {
  handleInbound(locationId: ID, message: InboundMessage): Promise<OrderingReply>;
  listSessions(locationId: ID): Promise<OrderingSession[]>;
  getSession(sessionId: ID): Promise<OrderingSession | null>;
  confirmOrder(sessionId: ID): Promise<Order>;
}
