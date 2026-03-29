import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAuthStore } from "@/store/authStore";
import Button from "@/components/ui/Button";
import { useRouter } from "expo-router";

/**
 * Activity tab — MVP shows post stats for the logged-in user.
 * Full notifications system is a V2 feature.
 */
export default function ActivityScreen() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>🔔</Text>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.sub}>Login to see your post interactions</Text>
        <Button title="Sign in" onPress={() => router.push("/auth/login")} style={styles.btn} />
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.emoji}>🔔</Text>
      <Text style={styles.title}>Activity</Text>
      <Text style={styles.sub}>
        Push notifications and full activity feed coming in v1.1
      </Text>
      <Button
        title="View my posts"
        variant="ghost"
        onPress={() => router.push("/profile")}
        style={styles.btn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 8, backgroundColor: "#f9fafb" },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 15, color: "#6b7280", textAlign: "center", lineHeight: 22 },
  btn: { marginTop: 12, width: "100%" },
});
