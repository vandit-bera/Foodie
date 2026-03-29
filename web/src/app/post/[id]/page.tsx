"use client";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, MessageCircle, Share2, MapPin, DollarSign, ArrowLeft, Send } from "lucide-react";
import { usePost, useComments, useLikePost, useAddComment } from "@/lib/hooks/usePost";
import { useAuthStore } from "@/store/authStore";
import { buildMediaUrl, formatDistanceToNow } from "@/lib/utils";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const { data: post, isLoading } = usePost(id);
  const { data: commentsData } = useComments(id);
  const likeMutation = useLikePost();
  const addComment = useAddComment();
  const [imgIdx, setImgIdx] = useState(0);
  const [commentBody, setCommentBody] = useState("");

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  );
  if (!post) return <div className="text-center py-20 text-gray-400">Post not found</div>;

  const imageUrl = post.images[imgIdx]?.url ? buildMediaUrl(post.images[imgIdx].url) : "/placeholder.jpg";

  const handleLike = () => {
    if (!isAuthenticated) { toast.error("Login to like"); return; }
    likeMutation.mutate({ postId: post.id, liked: post.liked_by_me });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error("Login to comment"); return; }
    if (!commentBody.trim()) return;
    await addComment.mutateAsync({ postId: id, body: commentBody });
    setCommentBody("");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back */}
      <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
        <ArrowLeft size={16} /> Back to feed
      </Link>

      <div className="card overflow-hidden">
        {/* Image */}
        <div className="relative aspect-square bg-gray-100">
          <Image src={imageUrl} alt={post.food_name} fill className="object-cover" sizes="672px" />
          {post.images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {post.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={clsx("w-1.5 h-1.5 rounded-full", i === imgIdx ? "bg-white w-3" : "bg-white/60")}
                />
              ))}
            </div>
          )}
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <Link href={`/profile/${post.user.id}`}>
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center overflow-hidden">
              {post.user.avatar_url ? (
                <Image src={buildMediaUrl(post.user.avatar_url)} alt={post.user.username} width={40} height={40} className="object-cover" />
              ) : (
                <span className="text-brand-500 font-bold">{post.user.username[0].toUpperCase()}</span>
              )}
            </div>
          </Link>
          <div>
            <Link href={`/profile/${post.user.id}`} className="font-semibold text-sm hover:text-brand-500">
              {post.user.username}
            </Link>
            <p className="text-xs text-gray-400">{formatDistanceToNow(post.created_at)}</p>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h1 className="text-xl font-bold">{post.food_name}</h1>
              <p className="text-gray-500">{post.restaurant_name}</p>
            </div>
            {post.price !== null && (
              <div className="flex items-center gap-0.5 text-brand-500 font-bold">
                <DollarSign size={16} />
                <span>{post.price}</span>
              </div>
            )}
          </div>
          {post.caption && <p className="text-gray-700 text-sm">{post.caption}</p>}
          {(post.location_name || post.address) && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-3">
              <MapPin size={14} className="text-brand-500" />
              <span>{post.location_name || post.address}</span>
              {post.city && <span>· {post.city}</span>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-5 px-4 py-3 border-b border-gray-100">
          <button
            onClick={handleLike}
            className={clsx("flex items-center gap-1.5 text-sm font-medium", post.liked_by_me ? "text-red-500" : "text-gray-500")}
          >
            <Heart size={20} fill={post.liked_by_me ? "currentColor" : "none"} />
            {post.like_count}
          </button>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <MessageCircle size={20} />
            {post.comment_count}
          </div>
          <button onClick={handleShare} className="flex items-center gap-1.5 text-sm text-gray-500 ml-auto">
            <Share2 size={18} /> Share
          </button>
        </div>

        {/* Comments */}
        <div id="comments" className="p-4">
          <h2 className="font-semibold mb-4">Comments</h2>

          {/* Add comment */}
          <form onSubmit={handleComment} className="flex gap-2 mb-5">
            <input
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder={isAuthenticated ? "Add a comment..." : "Login to comment"}
              className="input flex-1 text-sm py-2"
              disabled={!isAuthenticated}
            />
            <button
              type="submit"
              disabled={!commentBody.trim() || addComment.isPending}
              className="btn-primary px-3 py-2"
            >
              <Send size={16} />
            </button>
          </form>

          {/* Comment list */}
          <div className="flex flex-col gap-4">
            {commentsData?.items.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-xs font-bold text-gray-600">
                  {c.user.username[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <Link href={`/profile/${c.user.id}`} className="text-sm font-semibold hover:text-brand-500">
                      {c.user.username}
                    </Link>
                    <span className="text-xs text-gray-400">{formatDistanceToNow(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5">{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
