"use client";
import { useFeed } from "@/lib/hooks/useFeed";
import { FeedCard } from "@/components/feed/FeedCard";
import { useRequestLocation } from "@/lib/hooks/useLocation";
import { useLocationStore } from "@/store/locationStore";
import { Loader2, MapPin } from "lucide-react";

export default function HomePage() {
  // Request location on mount
  useRequestLocation();
  const { lat, lng } = useLocationStore();

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useFeed();

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Location banner */}
      {lat && lng && (
        <div className="flex items-center gap-2 text-sm text-brand-500 bg-brand-50 rounded-xl px-4 py-2 mb-5">
          <MapPin size={16} />
          <span>Showing nearby posts first</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-brand-500" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-lg font-medium">No posts yet</p>
          <p className="text-sm mt-1">Be the first to share a food experience!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {posts.map((post) => (
            <FeedCard key={post.id} post={post} />
          ))}

          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="btn-ghost w-full py-3 flex items-center justify-center gap-2"
            >
              {isFetchingNextPage ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Load more"
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
