import type { ID, Money } from "./types";

/** Shared by POS and WhatsApp ordering — a single source of truth for what can be sold. */

export interface MenuCategory {
  id: ID;
  name: string;
  sortOrder: number;
}

export interface MenuItem {
  id: ID;
  categoryId: ID;
  name: string;
  description?: string;
  price: Money;
  /** Links to inventory units consumed when this item is sold. */
  recipe: RecipeLine[];
  available: boolean;
}

export interface RecipeLine {
  inventoryItemId: ID;
  quantity: number;
}

export interface MenuService {
  listCategories(locationId: ID): Promise<MenuCategory[]>;
  listItems(locationId: ID): Promise<MenuItem[]>;
  getItem(itemId: ID): Promise<MenuItem | null>;
  setAvailability(itemId: ID, available: boolean): Promise<MenuItem>;
}
