import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Persistence, StoreSnapshot } from "@resto/core";

/**
 * Durable JSON-file persistence. Atomic writes (temp + rename) so a crash
 * mid-write can't corrupt the store. The {@link Persistence} seam means
 * swapping this for Postgres/SQLite is a localized change.
 */
export function createFilePersistence(filePath: string): Persistence {
  return {
    load() {
      try {
        const raw = readFileSync(filePath, "utf8");
        return JSON.parse(raw) as StoreSnapshot;
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw e;
      }
    },
    save(snapshot) {
      mkdirSync(dirname(filePath), { recursive: true });
      const tmp = `${filePath}.${process.pid}.tmp`;
      writeFileSync(tmp, JSON.stringify(snapshot), "utf8");
      renameSync(tmp, filePath);
    },
  };
}

export const DATA_FILE = process.env.RESTO_DATA_FILE ?? ".data/store.json";
