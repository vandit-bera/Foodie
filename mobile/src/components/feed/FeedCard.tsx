import React, { useState } from "react";
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  Dimensions, Share, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, mediaUrl } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatDistanceToNow } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import type { PostCard } from "@/types";
import Toast from "react-native-toast-message";

const W = Dimensions.get("window").width;

interface Props {
  post: PostCard;
}

export default function FeedCard({ post }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [imgIdx, setImgIdx] = useState(0);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (post.liked_by_me) {
        await api.delete(`/posts/${post.id}/like`);
      } else {
        await api.post(`/posts/${post.id}/like`);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const handleLike = () => {
    if (!isAuthenticated) { Toast.show({ type: "error", text1: "Login to like posts" }); return; }
    likeMutation.mutate();
  };

  const handleShare = async () => {
    await Share.share({ message: `Check this out on Foodie! foodie://post/${post.id}` });
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <TouchableOpacity
        onPress={() => router.push(`/profile/${post.user.id}`)}
        style={styles.header}
        activeOpacity={0.8}
      >
        <Avatar url={post.user.avatar_url} username={post.user.username} size={38} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.username}>{post.user.username}</Text>
          {post.location_name ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Ionicons name="location-outline" size={11} color="#9ca3af" />
              <Text style={styles.location} numberOfLines={1}>{post.location_name}</Text>
              {post.distance_km !== null && (
                <Text style={styles.distance}> · {post.distance_km} km</Text>
              )}
            </View>
          ) : null}
        </View>
        <Text style={styles.time}>{formatDistanceToNow(post.created_at)}</Text>
      </TouchableOpacity>

      {/* Image */}
      <TouchableOpacity onPress={() => router.push(`/post/${post.id}`)} activeOpacity={0.95}>
        <Image
          source={{ uri: mediaUrl(post.images[imgIdx]?.url ?? "") }}
          style={styles.image}
          resizeMode="cover"
        />
        {post.images.length > 1 && (
          <View style={styles.dotRow}>
            {post.images.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setImgIdx(i)}
                style={[styles.dot, i === imgIdx ? styles.dotActive : null]}
              />
            ))}
          </View>
        )}
      </TouchableOpacity>

      {/* Food info */}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.foodName}>{post.food_name}</Text>
            <Text style={styles.restaurantName}>{post.restaurant_name}</Text>
          </View>
          {post.price !== null && (
            <Text style={styles.price}>₹{post.price}</Text>
          )}
        </View>
        {post.caption ? (
          <Text style={styles.caption} numberOfLines={2}>{post.caption}</Text>
        ) : null}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
          <Ionicons
            name={post.liked_by_me ? "heart" : "heart-outline"}
            size={22}
            color={post.liked_by_me ? "#ef4444" : "#6b7280"}
          />
          <Text style={[styles.actionCount, post.liked_by_me && { color: "#ef4444" }]}>
            {post.like_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push(`/post/${post.id}`)}
          style={styles.actionBtn}
        >
          <Ionicons name="chatbubble-outline" size={22} color="#6b7280" />
          <Text style={styles.actionCount}>{post.comment_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} style={[styles.actionBtn, { marginLeft: "auto" }]}>
          <Ionicons name="arrow-redo-outline" size={22} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  header: { flexDirection: "row", alignItems: "center", padding: 12 },
  username: { fontSize: 14, fontWeight: "700", color: "#111827" },
  location: { fontSize: 12, color: "#9ca3af", flex: 1 },
  distance: { fontSize: 11, color: "#f97316", fontWeight: "600" },
  time: { fontSize: 12, color: "#d1d5db" },
  image: { width: W, height: W, maxHeight: 400 },
  dotRow: { position: "absolute", bottom: 10, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { width: 12, backgroundColor: "#fff" },
  body: { padding: 12, paddingBottom: 8 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  foodName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  restaurantName: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  price: { fontSize: 15, fontWeight: "700", color: "#f97316" },
  caption: { fontSize: 13, color: "#374151", marginTop: 6, lineHeight: 18 },
  actions: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 12, gap: 16 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
});
