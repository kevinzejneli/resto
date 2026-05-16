import { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import type { OrderingSession } from "@resto/core";
import { api } from "../lib/api";

export default function OrdersScreen() {
  const [sessions, setSessions] = useState<OrderingSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSessions(await api.listSessions());
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

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        ListEmptyComponent={
          <Text style={styles.muted}>
            No WhatsApp sessions yet. Use the web app to simulate one.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.customer.phone}</Text>
              <Text style={styles.muted}>
                {item.cart.length === 0
                  ? "Empty cart"
                  : item.cart
                      .map((l) => `${l.quantity}× ${l.name}`)
                      .join(", ")}
              </Text>
            </View>
            <Text style={styles.badge}>{item.state}</Text>
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
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e7e3dd",
  },
  title: { fontSize: 15, fontWeight: "600" },
  muted: { color: "#8a8a8a", marginTop: 2 },
  badge: { color: "#c2772f", fontSize: 12, marginLeft: 8 },
  error: { color: "#c0392b", marginBottom: 8 },
});
