/**
 * Home screen — location-aware infinite feed.
 */
import React, { useEffect } from "react";
import {
  View, FlatList, Text, StyleSheet, ActivityIndicator, RefreshControl,
} from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { api } from "@/lib/api";
import { useLocationStore } from "@/store/locationStore";
import FeedCard from "@/components/feed/FeedCard";
import type { PaginatedResponse, PostCard } from "@/types";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const { lat, lng, setLocation, setPermissionGranted } = useLocationStore();

  // Request location permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setPermissionGranted(false); return; }
      const pos = await Location.getCurrentPositionAsync({});
      setLocation(pos.coords.latitude, pos.coords.longitude);
    })();
  }, []);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } =
    useInfiniteQuery<PaginatedResponse<PostCard>>({
      queryKey: ["feed", lat, lng],
      queryFn: async ({ pageParam = 1 }) => {
        const params: Record<string, unknown> = { page: pageParam, per_page: 20 };
        if (lat && lng) { params.lat = lat; params.lng = lng; }
        const { data } = await api.get("/posts/feed", { params });
        return data;
      },
      initialPageParam: 1,
      getNextPageParam: (last) => last.has_next ? last.page + 1 : undefined,
    });

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <FeedCard post={item} />}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      ListHeaderComponent={
        lat && lng ? (
          <View style={styles.locationBanner}>
            <Ionicons name="location" size={14} color="#f97316" />
            <Text style={styles.locationText}>Showing nearby posts first</Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptySubtitle}>Be the first to share a food experience!</Text>
        </View>
      }
      ListFooterComponent={
        hasNextPage ? (
          <View style={styles.footer}>
            {isFetchingNextPage && <ActivityIndicator color="#f97316" />}
          </View>
        ) : null
      }
      onEndReached={() => hasNextPage && fetchNextPage()}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#f97316" />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  locationBanner: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff7ed", borderRadius: 12, padding: 10, marginBottom: 12 },
  locationText: { fontSize: 13, color: "#f97316", fontWeight: "500" },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#374151" },
  emptySubtitle: { fontSize: 14, color: "#9ca3af", marginTop: 4 },
  footer: { paddingVertical: 16, alignItems: "center" },
});
