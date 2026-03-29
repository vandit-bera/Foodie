import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api, mediaUrl } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import type { PostCard, PaginatedResponse } from "@/types";

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const { data: postsData } = useQuery<PaginatedResponse<PostCard>>({
    queryKey: ["userPosts", user?.id],
    queryFn: async () => {
      const { data } = await api.get(`/users/${user!.id}/posts`, { params: { per_page: 18 } });
      return data;
    },
    enabled: !!user,
  });

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>👤</Text>
        <Text style={styles.title}>Your Profile</Text>
        <Text style={styles.sub}>Sign in to view and manage your profile</Text>
        <Button title="Sign in" onPress={() => router.push("/auth/login")} style={styles.btn} />
        <Button title="Create account" variant="ghost" onPress={() => router.push("/auth/signup")} style={styles.btn} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile header */}
      <View style={styles.header}>
        <Avatar url={user.avatar_url} username={user.username} size={80} />
        <View style={styles.headerInfo}>
          <Text style={styles.username}>{user.username}</Text>
          {user.full_name && <Text style={styles.fullName}>{user.full_name}</Text>}
          {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
          <View style={styles.stats}>
            <Text style={styles.stat}><Text style={styles.statNum}>{postsData?.total ?? 0}</Text> posts</Text>
          </View>
        </View>
      </View>

      {/* Edit button */}
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => router.push("/settings")}
      >
        <Ionicons name="settings-outline" size={16} color="#374151" />
        <Text style={styles.editBtnText}>Edit Profile</Text>
      </TouchableOpacity>

      {/* Post grid */}
      <View style={styles.grid}>
        {postsData?.items.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={styles.gridItem}
            onPress={() => router.push(`/post/${post.id}`)}
          >
            {post.images[0]?.url ? (
              <Image
                source={{ uri: mediaUrl(post.images[0].url) }}
                style={styles.gridImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.gridImage, styles.gridPlaceholder]}>
                <Text style={{ color: "#9ca3af", fontSize: 12 }}>{post.food_name}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const GRID_SIZE = 120;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: { flexDirection: "row", gap: 16, padding: 20, backgroundColor: "#fff" },
  headerInfo: { flex: 1 },
  username: { fontSize: 18, fontWeight: "700", color: "#111827" },
  fullName: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  bio: { fontSize: 13, color: "#374151", marginTop: 6, lineHeight: 18 },
  stats: { flexDirection: "row", gap: 16, marginTop: 8 },
  stat: { fontSize: 14, color: "#374151" },
  statNum: { fontWeight: "700" },
  editBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, margin: 16, backgroundColor: "#fff", borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: "#e5e7eb" },
  editBtnText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 2, paddingHorizontal: 2 },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE },
  gridImage: { width: "100%", height: "100%" },
  gridPlaceholder: { backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 8, backgroundColor: "#f9fafb" },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 15, color: "#6b7280", textAlign: "center" },
  btn: { width: "100%", marginTop: 6 },
});
