import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocationStore } from "@/store/locationStore";
import type { PaginatedResponse, PostCard } from "@/types";

export function useFeed(city?: string) {
  const { lat, lng } = useLocationStore();

  return useInfiniteQuery<PaginatedResponse<PostCard>>({
    queryKey: ["feed", lat, lng, city],
    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, unknown> = { page: pageParam, per_page: 20 };
      if (lat && lng) { params.lat = lat; params.lng = lng; }
      if (city) params.city = city;
      const { data } = await api.get("/posts/feed", { params });
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => last.has_next ? last.page + 1 : undefined,
  });
}
