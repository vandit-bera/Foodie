import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, mediaUrl } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Toast from "react-native-toast-message";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser, clearAuth } = useAuthStore();
  const [username, setUsername] = useState(user?.username ?? "");
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saving, setSaving] = useState(false);

  if (!isAuthenticated) {
    router.replace("/auth/login");
    return null;
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch("/users/me", { username, full_name: fullName, bio });
      updateUser(data);
      Toast.show({ type: "success", text1: "Profile updated!" });
      router.back();
    } catch (e: any) {
      Toast.show({ type: "error", text1: e.response?.data?.detail ?? "Update failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    const img = result.assets[0];
    const form = new FormData() as any;
    form.append("file", { uri: img.uri, type: img.mimeType ?? "image/jpeg", name: "avatar.jpg" });
    try {
      const { data } = await api.post("/users/me/avatar", form, { headers: { "Content-Type": "multipart/form-data" } });
      updateUser({ avatar_url: data.avatar_url });
      Toast.show({ type: "success", text1: "Avatar updated!" });
    } catch {
      Toast.show({ type: "error", text1: "Upload failed" });
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Logout", style: "destructive",
        onPress: async () => {
          try { await api.post("/auth/logout", { refresh_token: useAuthStore.getState().refreshToken }); } catch {}
          clearAuth();
          router.replace("/(tabs)");
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Edit Profile</Text>

      {/* Avatar */}
      <TouchableOpacity onPress={handleAvatar} style={styles.avatarWrapper}>
        {user?.avatar_url ? (
          <Image source={{ uri: mediaUrl(user.avatar_url) }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLetter}>{user?.username[0].toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.cameraIcon}>
          <Ionicons name="camera" size={16} color="#fff" />
        </View>
      </TouchableOpacity>

      <View style={styles.form}>
        <View>
          <Text style={styles.label}>Username</Text>
          <Input value={username} onChangeText={setUsername} autoCapitalize="none" />
        </View>
        <View>
          <Text style={styles.label}>Full name</Text>
          <Input value={fullName} onChangeText={setFullName} />
        </View>
        <View>
          <Text style={styles.label}>Bio</Text>
          <Input value={bio} onChangeText={setBio} multiline numberOfLines={3} placeholder="Tell people about yourself..." />
        </View>
        <Button title="Save changes" onPress={handleSave} loading={saving} />
        <Button title="Logout" variant="ghost" onPress={handleLogout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 24 },
  avatarWrapper: { alignSelf: "center", position: "relative", marginBottom: 28 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#ffedd5", alignItems: "center", justifyContent: "center" },
  avatarLetter: { fontSize: 32, fontWeight: "700", color: "#f97316" },
  cameraIcon: { position: "absolute", bottom: 0, right: 0, backgroundColor: "#f97316", width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  form: { gap: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#6b7280", marginBottom: 6 },
});
