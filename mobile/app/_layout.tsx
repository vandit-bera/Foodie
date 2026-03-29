import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="post/[id]" options={{ headerShown: true, title: "" }} />
            <Stack.Screen name="profile/[id]" options={{ headerShown: true, title: "Profile" }} />
            <Stack.Screen name="auth/login" options={{ headerShown: true, title: "Sign in", presentation: "modal" }} />
            <Stack.Screen name="auth/signup" options={{ headerShown: true, title: "Sign up", presentation: "modal" }} />
          </Stack>
          <Toast />
          <StatusBar style="dark" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
