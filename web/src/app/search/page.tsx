"use client";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FeedCard } from "@/components/feed/FeedCard";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import type { PaginatedResponse, PostCard } from "@/types";
import { useLocationStore } from "@/store/locationStore";
import { clsx } from "clsx";

export default function SearchPage() {
  const { lat, lng } = useLocationStore();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedQ, setDebouncedQ] = useState("");

  const debounce = useCallback((val: string) => {
    const t = setTimeout(() => setDebouncedQ(val), 400);
    return () => clearTimeout(t);
  }, []);

  const { data, isLoading } = useQuery<PaginatedResponse<PostCard>>({
    queryKey: ["search", debouncedQ, city, maxPrice, lat, lng],
    queryFn: async () => {
      const params: Record<string, unknown> = { page: 1, per_page: 20 };
      if (debouncedQ) params.q = debouncedQ;
      if (city) params.city = city;
      if (maxPrice) params.max_price = maxPrice;
      if (lat && lng) { params.lat = lat; params.lng = lng; }
      const { data } = await api.get("/search/posts", { params });
      return data;
    },
    enabled: !!(debouncedQ || city || maxPrice),
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-5">Search</h1>

      {/* Search bar */}
      <div className="relative mb-3">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); debounce(e.target.value); }}
          placeholder="Search food or restaurant..."
          className="input pl-11 pr-12"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={clsx("absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg", showFilters ? "text-brand-500 bg-brand-50" : "text-gray-400")}
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4 mb-5 flex flex-col gap-3">
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Filter by city" className="input text-sm py-2" />
          <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} type="number" placeholder="Max price" className="input text-sm py-2" />
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={28} className="animate-spin text-brand-500" />
        </div>
      ) : !data ? (
        <div className="text-center py-16 text-gray-400">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p>Search for food or restaurants</p>
        </div>
      ) : data.items.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No results found</div>
      ) : (
        <div className="flex flex-col gap-5">
          <p className="text-sm text-gray-500">{data.total} results</p>
          {data.items.map((post) => (
            <FeedCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
