import type {
  InventoryItem,
  Location,
  MenuCategory,
  MenuItem,
  Order,
  OrderChannel,
  OrderingReply,
  OrderingSession,
  Org,
  PaymentMethod,
  PaymentResult,
  PublicUser,
  RecipeLine,
  SalesReport,
  StockMovementReason,
  Table,
} from "@resto/core";

export interface Bootstrap {
  user: PublicUser;
  org: Org | null;
  locations: Location[];
  currentLocation: Location | null;
  tables: Table[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  integrations: {
    stripeSimulated: boolean;
    whatsappSimulated: boolean;
    stripePublishableKey: string | null;
  };
}

export interface UpdateMenuItemInput {
  name?: string;
  description?: string;
  priceMinor?: number;
  categoryId?: string;
  recipe?: RecipeLine[];
  available?: boolean;
}

export type InventoryRow = InventoryItem & { low: boolean };

export interface CheckoutResponse {
  payment?: PaymentResult;
  order?: Order | null;
  simulated?: boolean;
  requiresAction?: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
}

export interface LoginResponse {
  token: string;
  user: PublicUser;
}

export interface ApiClientOptions {
  /** "" for same-origin (web); a full URL for mobile. */
  baseUrl: string;
  token?: string;
  locationId?: string;
}

export interface ApiClient {
  setToken(token: string | null): void;
  getToken(): string | null;
  setLocationId(locationId: string | null): void;
  getLocationId(): string | null;

  login(email: string, password: string): Promise<LoginResponse>;
  me(): Promise<{ user: PublicUser; org: Org | null }>;

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
  settleCard(id: string, paymentIntentId: string): Promise<CheckoutResponse>;
  cancelOrder(id: string): Promise<Order>;
  listInventory(): Promise<InventoryRow[]>;
  adjustInventory(
    id: string,
    input: { delta: number; reason?: StockMovementReason },
  ): Promise<InventoryItem>;
  listSessions(): Promise<OrderingSession[]>;
  simulateInbound(input: { from: string; text: string }): Promise<OrderingReply>;

  listMenuItems(): Promise<MenuItem[]>;
  listCategories(): Promise<MenuCategory[]>;
  createCategory(input: { name: string; sortOrder?: number }): Promise<MenuCategory>;
  createMenuItem(input: {
    categoryId: string;
    name: string;
    description?: string;
    priceMinor: number;
    recipe?: RecipeLine[];
  }): Promise<MenuItem>;
  updateMenuItem(id: string, patch: UpdateMenuItemInput): Promise<MenuItem>;
  deleteMenuItem(id: string): Promise<{ ok: true }>;

  listTables(): Promise<Table[]>;
  createTable(input: { label: string; seats: number }): Promise<Table>;
  deleteTable(id: string): Promise<{ ok: true }>;

  getReport(days?: number): Promise<SalesReport>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function createApiClient(opts: ApiClientOptions): ApiClient {
  const { baseUrl } = opts;
  let token: string | null = opts.token ?? null;
  let locationId: string | null = opts.locationId ?? null;

  async function req<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((init?.headers as Record<string, string>) ?? {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (locationId) headers["x-location-id"] = locationId;

    const res = await fetch(`${baseUrl}${path}`, { ...init, headers });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      throw new ApiError(
        (data && data.error) || `Request failed: ${res.status}`,
        res.status,
      );
    }
    return data as T;
  }

  const post = (body?: unknown): RequestInit => ({
    method: "POST",
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  return {
    setToken: (t) => {
      token = t;
    },
    getToken: () => token,
    setLocationId: (l) => {
      locationId = l;
    },
    getLocationId: () => locationId,

    async login(email, password) {
      const res = await req<LoginResponse>(
        "/api/auth/login",
        post({ email, password }),
      );
      token = res.token;
      return res;
    },
    me: () => req("/api/auth/me"),

    bootstrap: () => req<Bootstrap>("/api/bootstrap"),
    listOrders: (open) => req<Order[]>(`/api/orders${open ? "?open=true" : ""}`),
    getOrder: (id) => req<Order>(`/api/orders/${id}`),
    openOrder: (input) => req<Order>("/api/orders", post(input)),
    addLine: (id, input) => req<Order>(`/api/orders/${id}/lines`, post(input)),
    removeLine: (id, index) =>
      req<Order>(`/api/orders/${id}/lines?index=${index}`, { method: "DELETE" }),
    sendToKitchen: (id) => req<Order>(`/api/orders/${id}/send`, post()),
    checkout: (id, method) =>
      req<CheckoutResponse>(`/api/orders/${id}/checkout`, post({ method })),
    settleCard: (id, paymentIntentId) =>
      req<CheckoutResponse>(
        `/api/orders/${id}/settle`,
        post({ paymentIntentId }),
      ),
    cancelOrder: (id) => req<Order>(`/api/orders/${id}/cancel`, post()),
    listInventory: () => req<InventoryRow[]>("/api/inventory"),
    adjustInventory: (id, input) =>
      req<InventoryItem>(`/api/inventory/${id}/adjust`, post(input)),
    listSessions: () => req<OrderingSession[]>("/api/ordering/sessions"),
    simulateInbound: (input) =>
      req<OrderingReply>("/api/ordering/simulate", post(input)),

    listMenuItems: () => req<MenuItem[]>("/api/menu/items"),
    listCategories: () => req<MenuCategory[]>("/api/menu/categories"),
    createCategory: (input) =>
      req<MenuCategory>("/api/menu/categories", post(input)),
    createMenuItem: (input) => req<MenuItem>("/api/menu/items", post(input)),
    updateMenuItem: (id, patch) =>
      req<MenuItem>(`/api/menu/items/${id}`, { ...post(patch), method: "PATCH" }),
    deleteMenuItem: (id) =>
      req<{ ok: true }>(`/api/menu/items/${id}`, { method: "DELETE" }),

    listTables: () => req<Table[]>("/api/tables"),
    createTable: (input) => req<Table>("/api/tables", post(input)),
    deleteTable: (id) =>
      req<{ ok: true }>(`/api/tables/${id}`, { method: "DELETE" }),

    getReport: (days) =>
      req<SalesReport>(`/api/reports${days ? `?days=${days}` : ""}`),
  };
}
