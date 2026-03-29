"use client";
import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Share2, MapPin, DollarSign } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";
import { useAuthStore } from "@/store/authStore";
import { useLikePost } from "@/lib/hooks/usePost";
import type { PostCard } from "@/types";
import { formatDistanceToNow } from "@/lib/utils";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ?? "http://localhost:8000";

interface Props {
  post: PostCard;
}

export function FeedCard({ post }: Props) {
  const { isAuthenticated } = useAuthStore();
  const likeMutation = useLikePost();
  const [imgIdx, setImgIdx] = useState(0);

  const imageUrl = post.images[imgIdx]?.url
    ? `${API_URL}${post.images[imgIdx].url}`
    : "/placeholder.jpg";

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error("Login to like posts");
      return;
    }
    likeMutation.mutate({ postId: post.id, liked: post.liked_by_me });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    toast.success("Link copied!");
  };

  return (
    <article className="card overflow-hidden">
      {/* Author header */}
      <div className="flex items-center gap-3 p-4">
        <Link href={`/profile/${post.user.id}`}>
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center overflow-hidden">
            {post.user.avatar_url ? (
              <Image
                src={`${API_URL}${post.user.avatar_url}`}
                alt={post.user.username}
                width={40} height={40}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-brand-500 font-bold text-sm">
                {post.user.username[0].toUpperCase()}
              </span>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${post.user.id}`} className="font-semibold text-sm hover:text-brand-500">
            {post.user.username}
          </Link>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
            {post.location_name && (
              <>
                <MapPin size={11} />
                <span className="truncate">{post.location_name}</span>
                {post.distance_km !== null && (
                  <span className="text-brand-500 font-medium ml-1">· {post.distance_km} km</span>
                )}
              </>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-400">{formatDistanceToNow(post.created_at)}</span>
      </div>

      {/* Image carousel */}
      <Link href={`/post/${post.id}`}>
        <div className="relative aspect-square bg-gray-100">
          <Image
            src={imageUrl}
            alt={post.food_name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 600px"
          />
          {post.images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {post.images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); setImgIdx(i); }}
                  className={clsx(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    i === imgIdx ? "bg-white w-3" : "bg-white/60"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Food info */}
      <div className="px-4 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-base leading-tight">{post.food_name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{post.restaurant_name}</p>
          </div>
          {post.price !== null && (
            <div className="flex items-center gap-0.5 text-brand-500 font-bold text-sm shrink-0">
              <DollarSign size={14} />
              {post.price.toFixed(0)}
            </div>
          )}
        </div>
        {post.caption && (
          <p className="text-sm text-gray-700 mt-2 line-clamp-2">{post.caption}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3">
        <button
          onClick={handleLike}
          className={clsx(
            "flex items-center gap-1.5 text-sm font-medium transition-colors",
            post.liked_by_me ? "text-red-500" : "text-gray-500 hover:text-red-400"
          )}
          disabled={likeMutation.isPending}
        >
          <Heart size={20} fill={post.liked_by_me ? "currentColor" : "none"} />
          <span>{post.like_count}</span>
        </button>

        <Link
          href={`/post/${post.id}#comments`}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-500"
        >
          <MessageCircle size={20} />
          <span>{post.comment_count}</span>
        </Link>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-500 ml-auto"
        >
          <Share2 size={18} />
        </button>
      </div>
    </article>
  );
}
