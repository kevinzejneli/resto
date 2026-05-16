import type {
  InventoryItem,
  Location,
  MenuCategory,
  MenuItem,
  Order,
  OrderChannel,
  OrderingReply,
  OrderingSession,
  PaymentMethod,
  PaymentResult,
  StockMovementReason,
  Table,
} from "@resto/core";

export interface Bootstrap {
  location: Location;
  tables: Table[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  integrations: { stripeSimulated: boolean; whatsappSimulated: boolean };
}

export type InventoryRow = InventoryItem & { low: boolean };

export interface CheckoutResponse {
  payment?: PaymentResult;
  order?: Order | null;
  simulated?: boolean;
  requiresAction?: boolean;
  clientSecret?: string;
}

export interface ApiClientOptions {
  /** "" for same-origin (web); a full URL for mobile. */
  baseUrl: string;
}

export interface ApiClient {
  bootstrap(): Promise<Bootstrap>;
  listOrders(open?: boolean): Promise<Order[]>;
  getOrder(id: string): Promise<Order>;
  openOrder(input: { channel?: OrderChannel; tableId?: string }): Promise<Order>;
  addLine(
    id: string,
    input: { menuItemId: string; quantity?: number; notes?: string },
  ): Promise<Order>;
  removeLine(id: string, index: number): Promise<Order>;
  sendToKitchen(id: string): Promise<Order>;
  checkout(id: string, method: PaymentMethod): Promise<CheckoutResponse>;
  cancelOrder(id: string): Promise<Order>;
  listInventory(): Promise<InventoryRow[]>;
  adjustInventory(
    id: string,
    input: { delta: number; reason?: StockMovementReason },
  ): Promise<InventoryItem>;
  listSessions(): Promise<OrderingSession[]>;
  simulateInbound(input: { from: string; text: string }): Promise<OrderingReply>;
}

export function createApiClient({ baseUrl }: ApiClientOptions): ApiClient {
  async function req<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      throw new Error((data && data.error) || `Request failed: ${res.status}`);
    }
    return data as T;
  }

  const post = (path: string, body?: unknown) =>
    ({ method: "POST", ...(body !== undefined ? { body: JSON.stringify(body) } : {}) }) as RequestInit;

  return {
    bootstrap: () => req<Bootstrap>("/api/bootstrap"),
    listOrders: (open) => req<Order[]>(`/api/orders${open ? "?open=true" : ""}`),
    getOrder: (id) => req<Order>(`/api/orders/${id}`),
    openOrder: (input) => req<Order>("/api/orders", post("/api/orders", input)),
    addLine: (id, input) => req<Order>(`/api/orders/${id}/lines`, post("", input)),
    removeLine: (id, index) =>
      req<Order>(`/api/orders/${id}/lines?index=${index}`, { method: "DELETE" }),
    sendToKitchen: (id) => req<Order>(`/api/orders/${id}/send`, post("")),
    checkout: (id, method) =>
      req<CheckoutResponse>(`/api/orders/${id}/checkout`, post("", { method })),
    cancelOrder: (id) => req<Order>(`/api/orders/${id}/cancel`, post("")),
    listInventory: () => req<InventoryRow[]>("/api/inventory"),
    adjustInventory: (id, input) =>
      req<InventoryItem>(`/api/inventory/${id}/adjust`, post("", input)),
    listSessions: () => req<OrderingSession[]>("/api/ordering/sessions"),
    simulateInbound: (input) =>
      req<OrderingReply>("/api/ordering/simulate", post("", input)),
  };
}
