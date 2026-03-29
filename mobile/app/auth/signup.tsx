import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Toast from "react-native-toast-message";

export default function SignupScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username || !email || !password) { Toast.show({ type: "error", text1: "Fill required fields" }); return; }
    if (password.length < 8) { Toast.show({ type: "error", text1: "Password min 8 chars" }); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", { username, email, password, full_name: fullName || undefined });
      setAuth(data.user, data.access_token, data.refresh_token);
      Toast.show({ type: "success", text1: "Account created!" });
      router.replace("/(tabs)");
    } catch (e: any) {
      Toast.show({ type: "error", text1: e.response?.data?.detail ?? "Sign up failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.emoji}>🍜</Text>
      <Text style={styles.title}>Join Foodie</Text>
      <Text style={styles.sub}>Share your food discoveries</Text>

      <View style={styles.form}>
        <Input value={fullName} onChangeText={setFullName} placeholder="Full name (optional)" />
        <Input value={username} onChangeText={setUsername} placeholder="Username *" autoCapitalize="none" />
        <Input value={email} onChangeText={setEmail} placeholder="Email *" keyboardType="email-address" autoCapitalize="none" />
        <Input value={password} onChangeText={setPassword} placeholder="Password * (min 8 chars)" secureTextEntry />
        <Button title="Create account" onPress={handleSignup} loading={loading} />
      </View>

      <TouchableOpacity onPress={() => router.push("/auth/login")} style={styles.link}>
        <Text style={styles.linkText}>Already have an account? <Text style={styles.linkHighlight}>Sign in</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", padding: 32, flexGrow: 1, backgroundColor: "#fff" },
  emoji: { fontSize: 52, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 15, color: "#6b7280", marginBottom: 32, marginTop: 4 },
  form: { width: "100%", gap: 14 },
  link: { marginTop: 24 },
  linkText: { fontSize: 14, color: "#6b7280" },
  linkHighlight: { color: "#f97316", fontWeight: "600" },
});
