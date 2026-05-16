import type { ID, ISODateTime, Money } from "./types.js";

/** POS / order-taking slice: tickets, tables, checkout. */

export type OrderChannel = "pos" | "whatsapp" | "delivery";

export type OrderStatus =
  | "open"
  | "sent_to_kitchen"
  | "ready"
  | "paid"
  | "cancelled";

export interface OrderLine {
  menuItemId: ID;
  name: string;
  quantity: number;
  unitPrice: Money;
  notes?: string;
}

export interface Order {
  id: ID;
  locationId: ID;
  channel: OrderChannel;
  status: OrderStatus;
  /** Set for dine-in POS orders, null for takeaway/WhatsApp. */
  tableId: ID | null;
  lines: OrderLine[];
  total: Money;
  createdAt: ISODateTime;
}

export interface Table {
  id: ID;
  locationId: ID;
  label: string;
  seats: number;
}

export interface PaymentResult {
  orderId: ID;
  paid: boolean;
  /** Stripe PaymentIntent id when paid by card. */
  providerRef?: string;
}

export interface PosService {
  openOrder(input: {
    locationId: ID;
    channel: OrderChannel;
    tableId?: ID;
  }): Promise<Order>;
  addLine(orderId: ID, line: OrderLine): Promise<Order>;
  sendToKitchen(orderId: ID): Promise<Order>;
  checkout(orderId: ID): Promise<PaymentResult>;
  listOpenOrders(locationId: ID): Promise<Order[]>;
}
