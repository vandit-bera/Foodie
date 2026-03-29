import React from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api, mediaUrl } from "@/lib/api";
import Avatar from "@/components/ui/Avatar";
import type { UserPublic, PostCard, PaginatedResponse } from "@/types";

const GRID = 120;

export default function OtherProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: user, isLoading } = useQuery<UserPublic>({
    queryKey: ["user", id],
    queryFn: async () => { const { data } = await api.get(`/users/${id}`); return data; },
  });

  const { data: postsData } = useQuery<PaginatedResponse<PostCard>>({
    queryKey: ["userPosts", id],
    queryFn: async () => { const { data } = await api.get(`/users/${id}/posts`, { params: { per_page: 18 } }); return data; },
    enabled: !!user,
  });

  if (isLoading || !user) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#f97316" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar url={user.avatar_url} username={user.username} size={80} />
        <View style={styles.info}>
          <Text style={styles.username}>{user.username}</Text>
          {user.full_name && <Text style={styles.fullName}>{user.full_name}</Text>}
          <Text style={styles.stat}><Text style={styles.statNum}>{postsData?.total ?? 0}</Text> posts</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {postsData?.items.map((post) => (
          <TouchableOpacity key={post.id} style={styles.gridItem} onPress={() => router.push(`/post/${post.id}`)}>
            {post.images[0]?.url ? (
              <Image source={{ uri: mediaUrl(post.images[0].url) }} style={styles.gridImg} resizeMode="cover" />
            ) : (
              <View style={[styles.gridImg, styles.gridPlaceholder]}>
                <Text style={{ fontSize: 11, color: "#9ca3af" }}>{post.food_name}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: { flexDirection: "row", gap: 16, padding: 20, backgroundColor: "#fff" },
  info: { flex: 1, justifyContent: "center" },
  username: { fontSize: 18, fontWeight: "700", color: "#111827" },
  fullName: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  stat: { fontSize: 13, color: "#374151", marginTop: 8 },
  statNum: { fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 2, padding: 2 },
  gridItem: { width: GRID, height: GRID },
  gridImg: { width: "100%", height: "100%" },
  gridPlaceholder: { backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
