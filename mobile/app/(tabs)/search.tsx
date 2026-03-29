import React, { useState } from "react";
import {
  View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import FeedCard from "@/components/feed/FeedCard";
import type { PaginatedResponse, PostCard } from "@/types";
import { useLocationStore } from "@/store/locationStore";

export default function SearchScreen() {
  const { lat, lng } = useLocationStore();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery<PaginatedResponse<PostCard>>({
    queryKey: ["search", searchQuery, city, maxPrice],
    queryFn: async () => {
      const params: Record<string, unknown> = { page: 1, per_page: 20 };
      if (searchQuery) params.q = searchQuery;
      if (city) params.city = city;
      if (maxPrice) params.max_price = maxPrice;
      if (lat && lng) { params.lat = lat; params.lng = lng; }
      const { data } = await api.get("/search/posts", { params });
      return data;
    },
    enabled: !!(searchQuery || city || maxPrice),
  });

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search food or restaurant..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => setSearchQuery(q)}
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => { setQ(""); setSearchQuery(""); }}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
        >
          <Ionicons name="options" size={20} color={showFilters ? "#f97316" : "#6b7280"} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filters}>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="City"
            placeholderTextColor="#9ca3af"
            style={styles.filterInput}
          />
          <TextInput
            value={maxPrice}
            onChangeText={setMaxPrice}
            placeholder="Max price"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            style={styles.filterInput}
          />
          <TouchableOpacity style={styles.applyBtn} onPress={() => setSearchQuery(q)}>
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : !data ? (
        <View style={styles.center}>
          <Ionicons name="search" size={48} color="#e5e7eb" />
          <Text style={styles.hint}>Search for food or restaurants</Text>
        </View>
      ) : data.items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.hint}>No results found</Text>
        </View>
      ) : (
        <FlatList
          data={data.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <FeedCard post={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          ListHeaderComponent={
            <Text style={styles.resultCount}>{data.total} results</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  searchRow: { flexDirection: "row", padding: 16, gap: 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#f3f4f6", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 15, color: "#111827" },
  filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  filterBtnActive: { backgroundColor: "#fff7ed" },
  filters: { backgroundColor: "#fff", padding: 16, gap: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  filterInput: { borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: "#111827" },
  applyBtn: { backgroundColor: "#f97316", borderRadius: 10, padding: 12, alignItems: "center" },
  applyText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  list: { padding: 16, paddingBottom: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  hint: { fontSize: 15, color: "#9ca3af" },
  resultCount: { fontSize: 13, color: "#6b7280", marginBottom: 12 },
});
