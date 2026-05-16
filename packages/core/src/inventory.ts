import type { ID, ISODateTime } from "./types";

/** Inventory slice: stock tracking, depletion on sale, low-stock alerts. */

export type UnitOfMeasure = "g" | "kg" | "ml" | "l" | "unit";

export interface InventoryItem {
  id: ID;
  locationId: ID;
  name: string;
  unit: UnitOfMeasure;
  quantityOnHand: number;
  reorderThreshold: number;
}

export type StockMovementReason =
  | "purchase"
  | "sale_depletion"
  | "waste"
  | "manual_adjustment";

export interface StockMovement {
  id: ID;
  inventoryItemId: ID;
  delta: number;
  reason: StockMovementReason;
  at: ISODateTime;
}

export interface InventoryService {
  list(locationId: ID): Promise<InventoryItem[]>;
  get(inventoryItemId: ID): Promise<InventoryItem | null>;
  recordMovement(input: {
    inventoryItemId: ID;
    delta: number;
    reason: StockMovementReason;
  }): Promise<InventoryItem>;
  lowStock(locationId: ID): Promise<InventoryItem[]>;
}
