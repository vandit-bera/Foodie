import React, { useState, useRef } from "react";
import {
  View, Text, ScrollView, Image, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Dimensions, FlatList, Share, KeyboardAvoidingView, Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api, mediaUrl } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatDistanceToNow } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import type { PostDetail, CommentOut, PaginatedResponse } from "@/types";
import Toast from "react-native-toast-message";

const W = Dimensions.get("window").width;

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const [imgIdx, setImgIdx] = useState(0);
  const [commentBody, setCommentBody] = useState("");

  const { data: post, isLoading } = useQuery<PostDetail>({
    queryKey: ["post", id],
    queryFn: async () => { const { data } = await api.get(`/posts/${id}`); return data; },
  });

  const { data: commentsData } = useQuery<PaginatedResponse<CommentOut>>({
    queryKey: ["comments", id],
    queryFn: async () => { const { data } = await api.get(`/posts/${id}/comments`); return data; },
    enabled: !!id,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (post?.liked_by_me) await api.delete(`/posts/${id}/like`);
      else await api.post(`/posts/${id}/like`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["post", id] }),
  });

  const addCommentMutation = useMutation({
    mutationFn: async (body: string) => {
      const { data } = await api.post(`/posts/${id}/comments`, { body, parent_id: null });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", id] });
      qc.invalidateQueries({ queryKey: ["post", id] });
      setCommentBody("");
    },
  });

  if (isLoading || !post) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  const handleLike = () => {
    if (!isAuthenticated) { Toast.show({ type: "error", text1: "Login to like" }); return; }
    likeMutation.mutate();
  };

  const handleShare = () => Share.share({ message: `${post.food_name} at ${post.restaurant_name}` });

  const handleComment = () => {
    if (!isAuthenticated) { Toast.show({ type: "error", text1: "Login to comment" }); return; }
    if (!commentBody.trim()) return;
    addCommentMutation.mutate(commentBody);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container}>
        {/* Image carousel */}
        <View>
          <Image
            source={{ uri: mediaUrl(post.images[imgIdx]?.url ?? "") }}
            style={styles.image}
            resizeMode="cover"
          />
          {post.images.length > 1 && (
            <View style={styles.dotRow}>
              {post.images.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setImgIdx(i)} style={[styles.dot, i === imgIdx && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* Author */}
        <View style={styles.authorRow}>
          <Avatar url={post.user.avatar_url} username={post.user.username} size={36} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.username}>{post.user.username}</Text>
            <Text style={styles.time}>{formatDistanceToNow(post.created_at)}</Text>
          </View>
        </View>

        {/* Food info */}
        <View style={styles.infoBox}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.foodName}>{post.food_name}</Text>
              <Text style={styles.restaurantName}>{post.restaurant_name}</Text>
            </View>
            {post.price !== null && <Text style={styles.price}>₹{post.price}</Text>}
          </View>
          {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}
          {(post.location_name || post.city) && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#f97316" />
              <Text style={styles.locationText}>
                {post.location_name}{post.city ? ` · ${post.city}` : ""}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
            <Ionicons name={post.liked_by_me ? "heart" : "heart-outline"} size={24} color={post.liked_by_me ? "#ef4444" : "#6b7280"} />
            <Text style={[styles.actionCount, post.liked_by_me && { color: "#ef4444" }]}>{post.like_count}</Text>
          </TouchableOpacity>
          <View style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={24} color="#6b7280" />
            <Text style={styles.actionCount}>{post.comment_count}</Text>
          </View>
          <TouchableOpacity onPress={handleShare} style={[styles.actionBtn, { marginLeft: "auto" }]}>
            <Ionicons name="arrow-redo-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Comments */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments</Text>
          {commentsData?.items.map((c) => (
            <View key={c.id} style={styles.comment}>
              <Avatar url={c.user.avatar_url} username={c.user.username} size={32} />
              <View style={styles.commentBody}>
                <Text style={styles.commentUser}>{c.user.username}</Text>
                <Text style={styles.commentText}>{c.body}</Text>
                <Text style={styles.commentTime}>{formatDistanceToNow(c.created_at)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Comment input */}
      <View style={styles.commentInput}>
        <TextInput
          value={commentBody}
          onChangeText={setCommentBody}
          placeholder={isAuthenticated ? "Add a comment..." : "Login to comment"}
          placeholderTextColor="#9ca3af"
          style={styles.commentTextInput}
          editable={isAuthenticated}
        />
        <TouchableOpacity
          onPress={handleComment}
          disabled={!commentBody.trim() || addCommentMutation.isPending}
          style={styles.sendBtn}
        >
          <Ionicons name="send" size={20} color="#f97316" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  image: { width: W, height: W, maxHeight: 420 },
  dotRow: { position: "absolute", bottom: 10, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { width: 12, backgroundColor: "#fff" },
  authorRow: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  username: { fontSize: 14, fontWeight: "700", color: "#111827" },
  time: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  infoBox: { backgroundColor: "#fff", padding: 16, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  foodName: { fontSize: 20, fontWeight: "700", color: "#111827" },
  restaurantName: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  price: { fontSize: 18, fontWeight: "700", color: "#f97316" },
  caption: { fontSize: 14, color: "#374151", marginTop: 10, lineHeight: 20 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 },
  locationText: { fontSize: 13, color: "#6b7280" },
  actions: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 14, gap: 16, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount: { fontSize: 14, color: "#6b7280", fontWeight: "500" },
  commentsSection: { padding: 16 },
  commentsTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 14 },
  comment: { flexDirection: "row", gap: 10, marginBottom: 14 },
  commentBody: { flex: 1 },
  commentUser: { fontSize: 13, fontWeight: "700", color: "#111827" },
  commentText: { fontSize: 14, color: "#374151", marginTop: 2, lineHeight: 18 },
  commentTime: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
  commentInput: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f3f4f6", padding: 12, gap: 10 },
  commentTextInput: { flex: 1, backgroundColor: "#f3f4f6", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: "#111827" },
  sendBtn: { padding: 8 },
});
