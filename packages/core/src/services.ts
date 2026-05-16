import type { Store } from "./store";
import { newId } from "./ids";
import { addMoney, money, scaleMoney, type ID, type Location } from "./types";
import type {
  CreateCategoryInput,
  CreateItemInput,
  MenuCategory,
  MenuItem,
  MenuService,
  UpdateItemInput,
} from "./menu";
import type { InventoryItem, InventoryService } from "./inventory";
import type {
  AddLineInput,
  CheckoutOptions,
  CreateTableInput,
  Order,
  OrderLine,
  PaymentResult,
  PosService,
  Table,
  TableService,
} from "./pos";
import type {
  InboundMessage,
  OrderingReply,
  OrderingService,
  OrderingSession,
} from "./ordering";
import type { ReportRange, ReportService, SalesReport } from "./reports";

export interface Services {
  menu: MenuService;
  inventory: InventoryService;
  pos: PosService;
  ordering: OrderingService;
  tables: TableService;
  reports: ReportService;
}

export function createServices(store: Store): Services {
  const menu = createMenuService(store);
  const inventory = createInventoryService(store);
  const pos = createPosService(store, menu);
  const ordering = createOrderingService(store, menu, pos);
  const tables = createTableService(store);
  const reports = createReportService(store);
  return { menu, inventory, pos, ordering, tables, reports };
}

function recomputeTotal(order: Order): void {
  order.total = order.lines.reduce(
    (acc, l) => addMoney(acc, scaleMoney(l.unitPrice, l.quantity)),
    money(0, order.total.currency),
  );
}

/** Decrement inventory for everything in an order. Idempotency is the caller's job. */
function depleteForOrder(store: Store, order: Order): void {
  for (const line of order.lines) {
    const item = store.menuItems.find((m) => m.id === line.menuItemId);
    if (!item) continue;
    for (const r of item.recipe) {
      const inv = store.inventory.find((i) => i.id === r.inventoryItemId);
      if (!inv) continue;
      inv.quantityOnHand = Math.max(
        0,
        round3(inv.quantityOnHand - r.quantity * line.quantity),
      );
      store.stockMovements.push({
        id: newId("mov"),
        inventoryItemId: inv.id,
        delta: -round3(r.quantity * line.quantity),
        reason: "sale_depletion",
        at: new Date().toISOString(),
      });
    }
  }
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function getLocation(store: Store, locationId: ID): Location {
  const loc = store.locations.find((l) => l.id === locationId);
  if (!loc) throw new Error(`Location not found: ${locationId}`);
  return loc;
}

function createMenuService(store: Store): MenuService {
  return {
    async listCategories(locationId: ID) {
      return store.categories
        .filter((c) => c.locationId === locationId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    },
    async listItems(locationId: ID) {
      return store.menuItems.filter((m) => m.locationId === locationId);
    },
    async getItem(itemId: ID) {
      return store.menuItems.find((m) => m.id === itemId) ?? null;
    },
    async setAvailability(itemId: ID, available: boolean) {
      const item = store.menuItems.find((m) => m.id === itemId);
      if (!item) throw new Error(`Menu item not found: ${itemId}`);
      item.available = available;
      return item;
    },
    async createCategory(input: CreateCategoryInput) {
      getLocation(store, input.locationId);
      const existing = store.categories.filter(
        (c) => c.locationId === input.locationId,
      );
      const category: MenuCategory = {
        id: newId("cat"),
        locationId: input.locationId,
        name: input.name,
        sortOrder: input.sortOrder ?? existing.length + 1,
      };
      store.categories.push(category);
      return category;
    },
    async createItem(input: CreateItemInput) {
      const loc = getLocation(store, input.locationId);
      const category = store.categories.find(
        (c) => c.id === input.categoryId && c.locationId === input.locationId,
      );
      if (!category) throw new Error(`Category not found: ${input.categoryId}`);
      const item: MenuItem = {
        id: newId("mi"),
        locationId: input.locationId,
        categoryId: input.categoryId,
        name: input.name,
        ...(input.description ? { description: input.description } : {}),
        price: money(input.priceMinor, loc.currency),
        recipe: input.recipe ?? [],
        available: true,
      };
      store.menuItems.push(item);
      return item;
    },
    async updateItem(itemId: ID, patch: UpdateItemInput) {
      const item = store.menuItems.find((m) => m.id === itemId);
      if (!item) throw new Error(`Menu item not found: ${itemId}`);
      if (patch.name !== undefined) item.name = patch.name;
      if (patch.description !== undefined) item.description = patch.description;
      if (patch.categoryId !== undefined) {
        const cat = store.categories.find(
          (c) => c.id === patch.categoryId && c.locationId === item.locationId,
        );
        if (!cat) throw new Error(`Category not found: ${patch.categoryId}`);
        item.categoryId = patch.categoryId;
      }
      if (patch.priceMinor !== undefined) {
        item.price = money(patch.priceMinor, item.price.currency);
      }
      if (patch.recipe !== undefined) item.recipe = patch.recipe;
      if (patch.available !== undefined) item.available = patch.available;
      return item;
    },
    async deleteItem(itemId: ID) {
      const idx = store.menuItems.findIndex((m) => m.id === itemId);
      if (idx === -1) throw new Error(`Menu item not found: ${itemId}`);
      store.menuItems.splice(idx, 1);
    },
  };
}

function createInventoryService(store: Store): InventoryService {
  return {
    async list(locationId: ID) {
      return store.inventory.filter((i) => i.locationId === locationId);
    },
    async get(id: ID) {
      return store.inventory.find((i) => i.id === id) ?? null;
    },
    async recordMovement({ inventoryItemId, delta, reason }) {
      const inv = store.inventory.find((i) => i.id === inventoryItemId);
      if (!inv) throw new Error(`Inventory item not found: ${inventoryItemId}`);
      inv.quantityOnHand = Math.max(0, round3(inv.quantityOnHand + delta));
      store.stockMovements.push({
        id: newId("mov"),
        inventoryItemId,
        delta,
        reason,
        at: new Date().toISOString(),
      });
      return inv;
    },
    async lowStock(locationId: ID) {
      return store.inventory.filter(
        (i) => i.locationId === locationId && i.quantityOnHand <= i.reorderThreshold,
      );
    },
  };
}

function createPosService(store: Store, menu: MenuService): PosService {
  function requireOrder(orderId: ID): Order {
    const order = store.orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order not found: ${orderId}`);
    return order;
  }

  return {
    async openOrder({ locationId, channel, tableId }) {
      const loc = getLocation(store, locationId);
      const order: Order = {
        id: newId("ord"),
        locationId,
        channel,
        status: "open",
        tableId: tableId ?? null,
        lines: [],
        total: money(0, loc.currency),
        createdAt: new Date().toISOString(),
      };
      store.orders.push(order);
      return order;
    },

    async getOrder(orderId: ID) {
      return store.orders.find((o) => o.id === orderId) ?? null;
    },

    async addLine(orderId: ID, input: AddLineInput) {
      const order = requireOrder(orderId);
      if (order.status !== "open") {
        throw new Error(`Cannot modify order in status ${order.status}`);
      }
      const item = await menu.getItem(input.menuItemId);
      if (!item) throw new Error(`Menu item not found: ${input.menuItemId}`);
      if (!item.available) throw new Error(`${item.name} is unavailable`);

      const existing = order.lines.find(
        (l) => l.menuItemId === item.id && (l.notes ?? "") === (input.notes ?? ""),
      );
      if (existing) {
        existing.quantity += input.quantity;
      } else {
        const line: OrderLine = {
          menuItemId: item.id,
          name: item.name,
          quantity: input.quantity,
          unitPrice: item.price,
          ...(input.notes ? { notes: input.notes } : {}),
        };
        order.lines.push(line);
      }
      recomputeTotal(order);
      return order;
    },

    async removeLine(orderId: ID, index: number) {
      const order = requireOrder(orderId);
      if (order.status !== "open") {
        throw new Error(`Cannot modify order in status ${order.status}`);
      }
      if (index < 0 || index >= order.lines.length) {
        throw new Error(`Line index out of range: ${index}`);
      }
      order.lines.splice(index, 1);
      recomputeTotal(order);
      return order;
    },

    async sendToKitchen(orderId: ID) {
      const order = requireOrder(orderId);
      if (order.status !== "open") {
        throw new Error(`Cannot send order in status ${order.status}`);
      }
      if (order.lines.length === 0) {
        throw new Error("Cannot send an empty order");
      }
      order.status = "sent_to_kitchen";
      return order;
    },

    async checkout(orderId: ID, options: CheckoutOptions): Promise<PaymentResult> {
      const order = requireOrder(orderId);
      if (order.status === "paid") {
        throw new Error("Order already paid");
      }
      if (order.status === "cancelled") {
        throw new Error("Order is cancelled");
      }
      if (order.lines.length === 0) {
        throw new Error("Cannot check out an empty order");
      }
      depleteForOrder(store, order);
      order.status = "paid";
      order.paidAt = new Date().toISOString();
      return {
        orderId: order.id,
        paid: true,
        method: options.method,
        ...(options.providerRef ? { providerRef: options.providerRef } : {}),
      };
    },

    async cancelOrder(orderId: ID) {
      const order = requireOrder(orderId);
      if (order.status === "paid") {
        throw new Error("Cannot cancel a paid order");
      }
      order.status = "cancelled";
      return order;
    },

    async listOrders(locationId: ID) {
      return store.orders
        .filter((o) => o.locationId === locationId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async listOpenOrders(locationId: ID) {
      return store.orders.filter(
        (o) =>
          o.locationId === locationId &&
          (o.status === "open" || o.status === "sent_to_kitchen" || o.status === "ready"),
      );
    },
  };
}

function createOrderingService(
  store: Store,
  menu: MenuService,
  pos: PosService,
): OrderingService {
  function sessionFor(locationId: ID, phone: string): OrderingSession {
    let session = store.sessions.find(
      (s) => s.locationId === locationId && s.customer.phone === phone && s.state !== "completed",
    );
    if (!session) {
      session = {
        id: newId("sess"),
        locationId,
        customer: { id: newId("cust"), phone },
        state: "greeting",
        cart: [],
        updatedAt: new Date().toISOString(),
      };
      store.sessions.push(session);
    }
    return session;
  }

  async function orderableItems(locationId: ID): Promise<MenuItem[]> {
    return (await menu.listItems(locationId)).filter((m) => m.available);
  }

  function renderMenu(items: MenuItem[]): string {
    return items
      .map((m, i) => `${i + 1}. ${m.name} — ${(m.price.amountMinor / 100).toFixed(2)} ${m.price.currency}`)
      .join("\n");
  }

  function cartSummary(session: OrderingSession): string {
    if (session.cart.length === 0) return "(empty)";
    return session.cart
      .map((l) => `• ${l.quantity}× ${l.name}`)
      .join("\n");
  }

  return {
    async handleInbound(locationId: ID, message: InboundMessage): Promise<OrderingReply> {
      const session = sessionFor(locationId, message.from);
      const text = message.text.trim().toLowerCase();
      const items = await orderableItems(locationId);
      let reply: string;

      if (text === "yes" && session.state === "awaiting_confirmation") {
        const order = await this.confirmOrder(session.id);
        reply =
          `✅ Order confirmed! Total ${(order.total.amountMinor / 100).toFixed(2)} ` +
          `${order.total.currency}. We'll have it ready shortly.`;
      } else if (text === "done") {
        if (session.cart.length === 0) {
          reply = "Your cart is empty. Send an item number first.";
        } else {
          session.state = "awaiting_confirmation";
          reply = `Your order:\n${cartSummary(session)}\n\nReply *yes* to confirm.`;
        }
      } else if (/^\d+$/.test(text)) {
        const idx = Number.parseInt(text, 10) - 1;
        const item = items[idx];
        if (!item) {
          reply = `No item ${text}. Choose:\n${renderMenu(items)}`;
        } else {
          const existing = session.cart.find((l) => l.menuItemId === item.id);
          if (existing) existing.quantity += 1;
          else
            session.cart.push({
              menuItemId: item.id,
              name: item.name,
              quantity: 1,
              unitPrice: item.price,
            });
          session.state = "building_cart";
          reply = `Added ${item.name}. Send another number, or *done* to finish.`;
        }
      } else {
        session.state = "browsing_menu";
        reply = `Welcome to ${getLocation(store, locationId).name}! Menu:\n${renderMenu(items)}\n\nReply with a number to add it.`;
      }

      session.updatedAt = new Date().toISOString();
      return { session, reply };
    },

    async listSessions(locationId: ID) {
      return store.sessions
        .filter((s) => s.locationId === locationId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    async getSession(sessionId: ID) {
      return store.sessions.find((s) => s.id === sessionId) ?? null;
    },

    async confirmOrder(sessionId: ID): Promise<Order> {
      const session = store.sessions.find((s) => s.id === sessionId);
      if (!session) throw new Error(`Session not found: ${sessionId}`);
      if (session.cart.length === 0) throw new Error("Cannot confirm an empty cart");

      const order = await pos.openOrder({
        locationId: session.locationId,
        channel: "whatsapp",
      });
      for (const line of session.cart) {
        await pos.addLine(order.id, {
          menuItemId: line.menuItemId,
          quantity: line.quantity,
        });
      }
      const sent = await pos.sendToKitchen(order.id);
      session.state = "completed";
      session.updatedAt = new Date().toISOString();
      return sent;
    },
  };
}

function createTableService(store: Store): TableService {
  return {
    async list(locationId: ID) {
      return store.tables.filter((t) => t.locationId === locationId);
    },
    async create(input: CreateTableInput) {
      getLocation(store, input.locationId);
      const table: Table = {
        id: newId("tbl"),
        locationId: input.locationId,
        label: input.label,
        seats: input.seats,
      };
      store.tables.push(table);
      return table;
    },
    async remove(tableId: ID) {
      const idx = store.tables.findIndex((t) => t.id === tableId);
      if (idx === -1) throw new Error(`Table not found: ${tableId}`);
      store.tables.splice(idx, 1);
    },
  };
}

function createReportService(store: Store): ReportService {
  return {
    async sales(locationId: ID, range?: ReportRange): Promise<SalesReport> {
      const loc = getLocation(store, locationId);
      const today = new Date().toISOString().slice(0, 10);
      const toDate = range?.toDate ?? today;
      const fromDate =
        range?.fromDate ??
        new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);

      const paid = store.orders.filter((o) => {
        if (o.locationId !== locationId || o.status !== "paid") return false;
        const d = (o.paidAt ?? o.createdAt).slice(0, 10);
        return d >= fromDate && d <= toDate;
      });

      const byDayMap = new Map<string, { revenueMinor: number; count: number }>();
      const itemMap = new Map<
        string,
        { name: string; quantity: number; revenueMinor: number }
      >();
      const channelMap = new Map<
        string,
        { revenueMinor: number; count: number }
      >();
      let totalMinor = 0;

      for (const o of paid) {
        totalMinor += o.total.amountMinor;
        const day = (o.paidAt ?? o.createdAt).slice(0, 10);
        const db = byDayMap.get(day) ?? { revenueMinor: 0, count: 0 };
        db.revenueMinor += o.total.amountMinor;
        db.count += 1;
        byDayMap.set(day, db);

        const cb = channelMap.get(o.channel) ?? { revenueMinor: 0, count: 0 };
        cb.revenueMinor += o.total.amountMinor;
        cb.count += 1;
        channelMap.set(o.channel, cb);

        for (const line of o.lines) {
          const it = itemMap.get(line.menuItemId) ?? {
            name: line.name,
            quantity: 0,
            revenueMinor: 0,
          };
          it.quantity += line.quantity;
          it.revenueMinor += line.unitPrice.amountMinor * line.quantity;
          itemMap.set(line.menuItemId, it);
        }
      }

      const byDay = [...byDayMap.entries()]
        .map(([date, v]) => ({ date, ...v }))
        .sort((a, b) => a.date.localeCompare(b.date));
      const topItems = [...itemMap.entries()]
        .map(([menuItemId, v]) => ({ menuItemId, ...v }))
        .sort((a, b) => b.revenueMinor - a.revenueMinor)
        .slice(0, 10);
      const byChannel = [...channelMap.entries()].map(([channel, v]) => ({
        channel: channel as SalesReport["byChannel"][number]["channel"],
        ...v,
      }));

      return {
        currency: loc.currency,
        totalRevenue: { amountMinor: totalMinor, currency: loc.currency },
        orderCount: paid.length,
        avgOrder: {
          amountMinor: paid.length ? Math.round(totalMinor / paid.length) : 0,
          currency: loc.currency,
        },
        byDay,
        topItems,
        byChannel,
      };
    },
  };
}
