"use client";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { buildMediaUrl } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { UserPublic, PostCard, PaginatedResponse } from "@/types";
import { Grid3X3, Settings, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuthStore();
  const isOwnProfile = me?.id === id;

  const { data: user, isLoading: userLoading } = useQuery<UserPublic>({
    queryKey: ["user", id],
    queryFn: async () => {
      const { data } = await api.get(`/users/${id}`);
      return data;
    },
  });

  const { data: postsData, isLoading: postsLoading } = useQuery<PaginatedResponse<PostCard>>({
    queryKey: ["userPosts", id],
    queryFn: async () => {
      const { data } = await api.get(`/users/${id}/posts`, { params: { per_page: 12 } });
      return data;
    },
    enabled: !!user,
  });

  if (userLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  );
  if (!user) return <div className="text-center py-20 text-gray-400">User not found</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Profile header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center overflow-hidden shrink-0">
            {user.avatar_url ? (
              <Image src={buildMediaUrl(user.avatar_url)} alt={user.username} width={80} height={80} className="object-cover" />
            ) : (
              <span className="text-brand-500 font-bold text-3xl">{user.username[0].toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold">{user.username}</h1>
              {isOwnProfile && (
                <Link href="/settings" className="btn-ghost text-sm flex items-center gap-1 py-1.5">
                  <Settings size={14} /> Edit profile
                </Link>
              )}
            </div>
            {user.full_name && <p className="text-gray-600 mt-0.5">{user.full_name}</p>}
            <div className="flex gap-4 mt-3 text-sm">
              <span><strong>{postsData?.total ?? 0}</strong> posts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Post grid */}
      <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-3">
        <Grid3X3 size={16} /> Posts
      </div>

      {postsLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="animate-spin text-brand-500" />
        </div>
      ) : postsData?.items.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No posts yet</div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {postsData?.items.map((post) => (
            <Link key={post.id} href={`/post/${post.id}`} className="relative aspect-square bg-gray-100 overflow-hidden rounded-lg">
              {post.images[0]?.url ? (
                <Image
                  src={buildMediaUrl(post.images[0].url)}
                  alt={post.food_name}
                  fill
                  className="object-cover hover:scale-105 transition-transform"
                  sizes="200px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">{post.food_name}</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
