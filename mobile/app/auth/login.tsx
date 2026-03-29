import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Toast from "react-native-toast-message";

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Toast.show({ type: "error", text1: "Fill in all fields" }); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setAuth(data.user, data.access_token, data.refresh_token);
      Toast.show({ type: "success", text1: "Welcome back!" });
      router.replace("/(tabs)");
    } catch (e: any) {
      Toast.show({ type: "error", text1: e.response?.data?.detail ?? "Login failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.emoji}>🍜</Text>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.sub}>Sign in to Foodie</Text>

      <View style={styles.form}>
        <Input value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
        <Input value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
        <Button title="Sign in" onPress={handleLogin} loading={loading} />
      </View>

      <TouchableOpacity onPress={() => router.push("/auth/signup")} style={styles.link}>
        <Text style={styles.linkText}>No account? <Text style={styles.linkHighlight}>Sign up</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: "#fff" },
  emoji: { fontSize: 52, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 15, color: "#6b7280", marginBottom: 32, marginTop: 4 },
  form: { width: "100%", gap: 14 },
  link: { marginTop: 24 },
  linkText: { fontSize: 14, color: "#6b7280" },
  linkHighlight: { color: "#f97316", fontWeight: "600" },
});
