import { AuthProvider, useAuth } from "@/context/AuthContext";
import { initDb } from "@/lib/db/database";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  // Initializes database
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDb(); // Prepare SQLite tables before app starts
    setDbReady(true);
  }, []);

  if (!dbReady) return null; // Prevent rendering before DB is ready

  return (
    <AuthProvider>
      <>
        <RootNavigator />
        <Toast />
      </>
    </AuthProvider>
  );
}

function RootNavigator() {
  // Controls navigation based on authentication and boot state
  const { isLoggedIn, isBooting } = useAuth();

  if (isBooting) {
    // Show loading while restoring auth session
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" redirect={isLoggedIn} />
      <Stack.Screen name="(drawer)" redirect={!isLoggedIn} />
    </Stack>
  );
}
