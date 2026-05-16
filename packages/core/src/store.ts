import type { Location } from "./types";
import type { MenuCategory, MenuItem } from "./menu";
import type { InventoryItem, StockMovement } from "./inventory";
import type { Order, Table } from "./pos";
import type { OrderingSession } from "./ordering";
import { money } from "./types";

/**
 * Single-process in-memory data store. Good enough for a functional
 * single-location demo; swap for a real DB by reimplementing this module
 * behind the same shape.
 */
export interface Store {
  location: Location;
  tables: Table[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  orders: Order[];
  sessions: OrderingSession[];
}

export function createStore(): Store {
  const location: Location = {
    id: "loc_tirana",
    name: "Te Komiteti — Tirana",
    countryCode: "AL",
    timezone: "Europe/Tirane",
  };

  const tables: Table[] = [
    { id: "tbl_1", locationId: location.id, label: "T1", seats: 2 },
    { id: "tbl_2", locationId: location.id, label: "T2", seats: 4 },
    { id: "tbl_3", locationId: location.id, label: "T3", seats: 4 },
    { id: "tbl_4", locationId: location.id, label: "Terrace", seats: 6 },
  ];

  const categories: MenuCategory[] = [
    { id: "cat_starters", name: "Starters", sortOrder: 1 },
    { id: "cat_mains", name: "Mains", sortOrder: 2 },
    { id: "cat_drinks", name: "Drinks", sortOrder: 3 },
  ];

  const inventory: InventoryItem[] = [
    inv("inv_flour", location.id, "Flour", "kg", 20, 5),
    inv("inv_yogurt", location.id, "Yogurt", "kg", 8, 3),
    inv("inv_lamb", location.id, "Lamb", "kg", 12, 4),
    inv("inv_beef", location.id, "Beef mince", "kg", 10, 4),
    inv("inv_coffee", location.id, "Coffee beans", "kg", 6, 2),
    inv("inv_water", location.id, "Bottled water", "unit", 60, 24),
  ];

  const menuItems: MenuItem[] = [
    {
      id: "mi_byrek",
      categoryId: "cat_starters",
      name: "Byrek me spinaq",
      description: "Spinach filo pie",
      price: money(250),
      recipe: [{ inventoryItemId: "inv_flour", quantity: 0.15 }],
      available: true,
    },
    {
      id: "mi_tavekosi",
      categoryId: "cat_mains",
      name: "Tavë Kosi",
      description: "Baked lamb with yogurt",
      price: money(750),
      recipe: [
        { inventoryItemId: "inv_lamb", quantity: 0.25 },
        { inventoryItemId: "inv_yogurt", quantity: 0.2 },
      ],
      available: true,
    },
    {
      id: "mi_qofte",
      categoryId: "cat_mains",
      name: "Qofte të fërguara",
      description: "Fried meatballs",
      price: money(600),
      recipe: [{ inventoryItemId: "inv_beef", quantity: 0.2 }],
      available: true,
    },
    {
      id: "mi_coffee",
      categoryId: "cat_drinks",
      name: "Espresso",
      price: money(120),
      recipe: [{ inventoryItemId: "inv_coffee", quantity: 0.012 }],
      available: true,
    },
    {
      id: "mi_water",
      categoryId: "cat_drinks",
      name: "Water 0.5L",
      price: money(100),
      recipe: [{ inventoryItemId: "inv_water", quantity: 1 }],
      available: true,
    },
  ];

  return {
    location,
    tables,
    categories,
    menuItems,
    inventory,
    stockMovements: [],
    orders: [],
    sessions: [],
  };
}

function inv(
  id: string,
  locationId: string,
  name: string,
  unit: InventoryItem["unit"],
  qty: number,
  threshold: number,
): InventoryItem {
  return {
    id,
    locationId,
    name,
    unit,
    quantityOnHand: qty,
    reorderThreshold: threshold,
  };
}
