import { Tabs } from "expo-router";
import { AuthProvider, useAuth } from "../lib/auth";
import { LoginScreen } from "../components/LoginScreen";

function Gate() {
  const { authed } = useAuth();
  if (!authed) return <LoginScreen />;
  return (
    <Tabs screenOptions={{ headerTitleAlign: "center" }}>
      <Tabs.Screen name="index" options={{ title: "POS" }} />
      <Tabs.Screen name="inventory" options={{ title: "Inventory" }} />
      <Tabs.Screen name="orders" options={{ title: "Orders" }} />
    </Tabs>
  );
}

export default function MobileLayout() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
