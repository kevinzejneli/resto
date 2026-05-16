import type { ID, ISODateTime } from "./types.js";
import type { Order, OrderLine } from "./pos.js";

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

export interface OrderingService {
  handleInbound(locationId: ID, message: InboundMessage): Promise<OrderingSession>;
  confirmOrder(sessionId: ID): Promise<Order>;
}
