import type { ID, ISODateTime, Money } from "./types";

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

export type PaymentMethod = "cash" | "card";

export interface PaymentResult {
  orderId: ID;
  paid: boolean;
  method: PaymentMethod;
  /** Stripe PaymentIntent id when paid by card. */
  providerRef?: string;
}

export interface CheckoutOptions {
  method: PaymentMethod;
  providerRef?: string;
}

export interface AddLineInput {
  menuItemId: ID;
  quantity: number;
  notes?: string;
}

export interface PosService {
  openOrder(input: {
    locationId: ID;
    channel: OrderChannel;
    tableId?: ID;
  }): Promise<Order>;
  getOrder(orderId: ID): Promise<Order | null>;
  addLine(orderId: ID, line: AddLineInput): Promise<Order>;
  removeLine(orderId: ID, index: number): Promise<Order>;
  sendToKitchen(orderId: ID): Promise<Order>;
  checkout(orderId: ID, options: CheckoutOptions): Promise<PaymentResult>;
  cancelOrder(orderId: ID): Promise<Order>;
  listOrders(locationId: ID): Promise<Order[]>;
  listOpenOrders(locationId: ID): Promise<Order[]>;
}
