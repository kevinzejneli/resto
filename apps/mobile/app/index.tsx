import { StyleSheet, Text, View } from "react-native";

export default function PosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>POS</Text>
      <Text style={styles.body}>
        Order-taking on the floor. Domain types: @resto/core PosService.
        Scaffold only.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  body: { color: "#8a8a8a", textAlign: "center" },
});
