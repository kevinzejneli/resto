import { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import type { InventoryRow } from "@resto/api-client";
import { api } from "../lib/api";

export default function InventoryScreen() {
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api.listInventory());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function adjust(id: string, delta: number) {
    try {
      await api.adjustInventory(id, { delta, reason: "manual_adjustment" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        renderItem={({ item }) => (
          <View style={[styles.row, item.low && styles.rowLow]}>
            <View>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.muted}>
                {item.quantityOnHand} {item.unit}
                {item.low ? "  · LOW" : ""}
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => adjust(item.id, -1)}
              >
                <Text>−1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => adjust(item.id, 1)}
              >
                <Text>+1</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e7e3dd",
  },
  rowLow: { backgroundColor: "#fdf1ee" },
  title: { fontSize: 15, fontWeight: "600" },
  muted: { color: "#8a8a8a", marginTop: 2 },
  actions: { flexDirection: "row", gap: 8 },
  btn: {
    borderWidth: 1,
    borderColor: "#e7e3dd",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  error: { color: "#c0392b", marginBottom: 8 },
});
