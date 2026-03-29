import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PostDetail, LikeResponse, CommentOut, PaginatedResponse } from "@/types";

export function usePost(postId: string) {
  return useQuery<PostDetail>({
    queryKey: ["post", postId],
    queryFn: async () => {
      const { data } = await api.get(`/posts/${postId}`);
      return data;
    },
    enabled: !!postId,
  });
}

export function useComments(postId: string) {
  return useQuery<PaginatedResponse<CommentOut>>({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data } = await api.get(`/posts/${postId}/comments`);
      return data;
    },
    enabled: !!postId,
  });
}

export function useLikePost() {
  const qc = useQueryClient();

  return useMutation<LikeResponse, Error, { postId: string; liked: boolean }>({
    mutationFn: async ({ postId, liked }) => {
      if (liked) {
        const { data } = await api.delete(`/posts/${postId}/like`);
        return data;
      }
      const { data } = await api.post(`/posts/${postId}/like`);
      return data;
    },
    onSuccess: (_, { postId }) => {
      qc.invalidateQueries({ queryKey: ["post", postId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useAddComment() {
  const qc = useQueryClient();

  return useMutation<CommentOut, Error, { postId: string; body: string; parentId?: string }>({
    mutationFn: async ({ postId, body, parentId }) => {
      const { data } = await api.post(`/posts/${postId}/comments`, {
        body,
        parent_id: parentId ?? null,
      });
      return data;
    },
    onSuccess: (_, { postId }) => {
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      qc.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
}
