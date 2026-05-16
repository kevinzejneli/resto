import type { Location, Org, User } from "./types";
import type { MenuCategory, MenuItem } from "./menu";
import type { InventoryItem, StockMovement } from "./inventory";
import type { Order, Table } from "./pos";
import type { OrderingSession } from "./ordering";
import { money } from "./types";

/**
 * Working set. All collections are flat with foreign keys (orgId/locationId)
 * so a real database is a drop-in: implement {@link Persistence} against
 * Postgres/SQLite and the service layer is unchanged.
 */
export interface Store {
  orgs: Org[];
  users: User[];
  locations: Location[];
  tables: Table[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  orders: Order[];
  sessions: OrderingSession[];
}

/** JSON-serializable snapshot of the whole store. */
export type StoreSnapshot = Store;

/** Durable backing store. Injected by the host (web) so core stays portable. */
export interface Persistence {
  load(): StoreSnapshot | null;
  save(snapshot: StoreSnapshot): void;
}

export function snapshot(store: Store): StoreSnapshot {
  return store;
}

export function createStore(opts: { persistence?: Persistence } = {}): Store {
  const loaded = opts.persistence?.load() ?? null;
  const store: Store = loaded ?? seed();
  opts.persistence?.save(store);
  return store;
}

function seed(): Store {
  const org: Org = { id: "org_demo", name: "Demo Restaurant Group" };

  const tirana: Location = {
    id: "loc_tirana",
    orgId: org.id,
    name: "Te Komiteti — Tirana",
    countryCode: "AL",
    timezone: "Europe/Tirane",
    currency: "EUR",
  };
  const skopje: Location = {
    id: "loc_skopje",
    orgId: org.id,
    name: "Kaj Pero — Skopje",
    countryCode: "MK",
    timezone: "Europe/Skopje",
    currency: "MKD",
  };

  const store: Store = {
    orgs: [org],
    users: [],
    locations: [tirana, skopje],
    tables: [],
    categories: [],
    menuItems: [],
    inventory: [],
    stockMovements: [],
    orders: [],
    sessions: [],
  };

  seedLocation(store, tirana, 1);
  seedLocation(store, skopje, 30); // ~30x EUR→MKD so prices read realistically
  return store;
}

function seedLocation(store: Store, loc: Location, fx: number): void {
  const cur = loc.currency;
  const p = (eurMinor: number) => money(eurMinor * fx, cur);
  const L = loc.id;

  store.tables.push(
    { id: `${L}_t1`, locationId: L, label: "T1", seats: 2 },
    { id: `${L}_t2`, locationId: L, label: "T2", seats: 4 },
    { id: `${L}_t3`, locationId: L, label: "T3", seats: 4 },
    { id: `${L}_terrace`, locationId: L, label: "Terrace", seats: 6 },
  );

  store.categories.push(
    { id: `${L}_c_starters`, locationId: L, name: "Starters", sortOrder: 1 },
    { id: `${L}_c_mains`, locationId: L, name: "Mains", sortOrder: 2 },
    { id: `${L}_c_drinks`, locationId: L, name: "Drinks", sortOrder: 3 },
  );

  store.inventory.push(
    inv(`${L}_i_flour`, L, "Flour", "kg", 20, 5),
    inv(`${L}_i_yogurt`, L, "Yogurt", "kg", 8, 3),
    inv(`${L}_i_lamb`, L, "Lamb", "kg", 12, 4),
    inv(`${L}_i_beef`, L, "Beef mince", "kg", 10, 4),
    inv(`${L}_i_coffee`, L, "Coffee beans", "kg", 6, 2),
    inv(`${L}_i_water`, L, "Bottled water", "unit", 60, 24),
  );

  store.menuItems.push(
    {
      id: `${L}_m_byrek`,
      locationId: L,
      categoryId: `${L}_c_starters`,
      name: "Byrek me spinaq",
      description: "Spinach filo pie",
      price: p(250),
      recipe: [{ inventoryItemId: `${L}_i_flour`, quantity: 0.15 }],
      available: true,
    },
    {
      id: `${L}_m_tavekosi`,
      locationId: L,
      categoryId: `${L}_c_mains`,
      name: "Tavë Kosi",
      description: "Baked lamb with yogurt",
      price: p(750),
      recipe: [
        { inventoryItemId: `${L}_i_lamb`, quantity: 0.25 },
        { inventoryItemId: `${L}_i_yogurt`, quantity: 0.2 },
      ],
      available: true,
    },
    {
      id: `${L}_m_qofte`,
      locationId: L,
      categoryId: `${L}_c_mains`,
      name: "Qofte të fërguara",
      description: "Fried meatballs",
      price: p(600),
      recipe: [{ inventoryItemId: `${L}_i_beef`, quantity: 0.2 }],
      available: true,
    },
    {
      id: `${L}_m_coffee`,
      locationId: L,
      categoryId: `${L}_c_drinks`,
      name: "Espresso",
      price: p(120),
      recipe: [{ inventoryItemId: `${L}_i_coffee`, quantity: 0.012 }],
      available: true,
    },
    {
      id: `${L}_m_water`,
      locationId: L,
      categoryId: `${L}_c_drinks`,
      name: "Water 0.5L",
      price: p(100),
      recipe: [{ inventoryItemId: `${L}_i_water`, quantity: 1 }],
      available: true,
    },
  );
}

function inv(
  id: string,
  locationId: string,
  name: string,
  unit: InventoryItem["unit"],
  qty: number,
  threshold: number,
): InventoryItem {
  return { id, locationId, name, unit, quantityOnHand: qty, reorderThreshold: threshold };
}
