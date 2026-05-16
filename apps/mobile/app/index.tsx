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
import { formatMoney, type Order } from "@resto/core";
import { api } from "../lib/api";

export default function PosScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await api.listOrders(true));
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

  async function newOrder() {
    try {
      await api.openOrder({ channel: "pos" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.primary} onPress={newOrder}>
        <Text style={styles.primaryText}>+ New takeaway order</Text>
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        ListEmptyComponent={<Text style={styles.muted}>No open orders.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.title}>{item.id}</Text>
              <Text style={styles.muted}>
                {item.channel} · {item.status}
              </Text>
            </View>
            <Text style={styles.title}>{formatMoney(item.total)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  primary: {
    backgroundColor: "#e0904a",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "700" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e7e3dd",
  },
  title: { fontSize: 15, fontWeight: "600" },
  muted: { color: "#8a8a8a", marginTop: 2 },
  error: { color: "#c0392b" },
});
