"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, authFetch, getStoredToken } from "@/lib/apiFetch";
import { queryKeys } from "@/lib/queryKeys";
import type { Blog, Category, Comment, BlogFilters, User, ApiResponse } from "@/types";
import { useToast } from "@/components/ui/toast";

// ─────────────────────────────────────────────────────────────────────────────
// BLOGS — read
// ─────────────────────────────────────────────────────────────────────────────

export function useBlogs(filters: BlogFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== "") params.set(k, String(v));
  });
  return useQuery({
    queryKey: queryKeys.blogs.list(filters),
    queryFn: () =>
      apiFetch<{
        blogs: Blog[];
        pagination: { page: number; total: number; pages: number; limit: number };
      }>(`/blog?${params}`).then((r) => r.data),
  });
}

/** Public reader view — GET /blog/slug/:slug (optionalAuth) */
export function useBlogBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.blogs.bySlug(slug),
    queryFn: () =>
      apiFetch<{ blog: Blog }>(`/blog/slug/${slug}`).then((r) => r.data),
    enabled: !!slug,
  });
}

/** Owner/admin edit view — GET /blog/:id (protect) */
export function useBlog(id: string) {
  return useQuery({
    queryKey: queryKeys.blogs.detail(id),
    queryFn: () =>
      authFetch<{ blog: Blog }>(`/blog/${id}`).then((r) => r.data.blog),
    enabled: !!id,
  });
}

/** Current user's own blogs — GET /blog/mine (protect) */
export function useMyBlogs() {
  return useQuery({
    queryKey: queryKeys.blogs.mine(),
    queryFn: () =>
      authFetch<{ blogs: Blog[] }>("/blog/mine").then((r) => r.data),
  });
}

/** All published blogs by any user — used on the public user profile page */
export function useUserBlogs(userId: string, page = 1, limit = 9) {
  return useQuery({
    queryKey: queryKeys.blogs.byUser(userId, page),
    queryFn: () =>
      apiFetch<{
        blogs: Blog[];
        pagination: { page: number; total: number; pages: number; limit: number };
      }>(`/blog?author=${userId}&page=${page}&limit=${limit}`).then((r) => r.data),
    enabled: isValidUserId(userId),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOGS — create
// ─────────────────────────────────────────────────────────────────────────────

export function useCreateBlog() {
  const qc = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: (formData: FormData) =>
      authFetch<{ blog: Blog }>("/blog", {
        method: "POST",
        body: formData,
      }).then((r) => r.data.blog),

    onSuccess: (blog) => {
      qc.invalidateQueries({ queryKey: queryKeys.blogs.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.blogs.mine() });
      qc.setQueryData(queryKeys.blogs.bySlug(blog.slug), { blog });
      success("Blog published!", "Your blog is now live.");
    },

    onError: (e: Error) =>
      showError("Failed to publish", e?.message ?? "Please try again."),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOGS — update
// ─────────────────────────────────────────────────────────────────────────────

export function useUpdateBlog() {
  const qc = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      authFetch<{ blog: Blog }>(`/blog/${id}`, {
        method: "PATCH",
        body: data,
      }).then((r) => r.data.blog),

    onSuccess: (blog) => {
      qc.invalidateQueries({ queryKey: queryKeys.blogs.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.blogs.mine() });
      qc.setQueryData(queryKeys.blogs.bySlug(blog.slug), { blog });
      qc.setQueryData(queryKeys.blogs.detail(blog._id), { blog });
      success("Blog updated!", "Your changes have been saved.");
    },

    onError: (e: Error) =>
      showError("Failed to update", e.message ?? "Please try again."),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOGS — delete
// ─────────────────────────────────────────────────────────────────────────────

export function useDeleteBlog() {
  const qc = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: (id: string) => {
      const token = getStoredToken();
      if (!token) throw new Error("Not authenticated");
      return authFetch(`/blog/${id}`, { method: "DELETE" });
    },

    onSuccess: (_, id) => {
      qc.setQueriesData<{ blogs: Blog[] }>(
        { queryKey: queryKeys.blogs.lists() },
        (old) => old ? { ...old, blogs: old.blogs.filter((b) => b._id !== id) } : old
      );
      qc.setQueryData<{ blogs: Blog[] }>(
        queryKeys.blogs.mine(),
        (old) => old ? { ...old, blogs: old.blogs.filter((b) => b._id !== id) } : old
      );
      qc.removeQueries({ queryKey: queryKeys.blogs.detail(id) });
      qc.removeQueries({
        predicate: (q) =>
          JSON.stringify(q.queryKey).startsWith(JSON.stringify(["blogs", "slug"])),
      });
      success("Blog deleted", "It has been permanently removed.");
    },

    onError: (e: Error) =>
      showError("Failed to delete", e.message ?? "Please try again."),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOGS — like (optimistic, no flicker)
// ─────────────────────────────────────────────────────────────────────────────

interface LikeResponse {
  likes: number;
  isLiked: boolean;
}

export function useLikeBlog() {
  const qc = useQueryClient();
  const { error: showError } = useToast();

  return useMutation<ApiResponse<LikeResponse>, Error, string>({
    mutationFn: (id: string) =>
      authFetch<LikeResponse>(`/blog/${id}/like`, { method: "POST" }),

    onMutate: async (id: string) => {
      await qc.cancelQueries({
        predicate: (q) => JSON.stringify(q.queryKey).includes("blog"),
      });

      const snapshots = qc.getQueriesData<unknown>({
        predicate: (q) => JSON.stringify(q.queryKey).includes("blog"),
      });

      const patchLike = (cached: any): any => {
        if (!cached || typeof cached !== "object") return cached;
        if ("blog" in cached && cached.blog?._id === id) {
          const wasLiked = Boolean(cached.blog.isLiked);
          return {
            ...cached,
            blog: {
              ...cached.blog,
              isLiked: !wasLiked,
              likes: wasLiked
                ? Math.max(0, cached.blog.likes - 1)
                : cached.blog.likes + 1,
            },
          };
        }
        if ("blogs" in cached && Array.isArray(cached.blogs)) {
          return {
            ...cached,
            blogs: cached.blogs.map((b: Blog) => {
              if (b._id !== id) return b;
              const wasLiked = Boolean(b.isLiked);
              return {
                ...b,
                isLiked: !wasLiked,
                likes: wasLiked ? Math.max(0, b.likes - 1) : b.likes + 1,
              };
            }),
          };
        }
        return cached;
      };

      qc.setQueriesData<unknown>(
        { predicate: (q) => JSON.stringify(q.queryKey).includes("blog") },
        patchLike
      );

      return { snapshots };
    },

    onSuccess: (response, id) => {
      const { likes, isLiked } = response.data;
      qc.setQueriesData<unknown>(
        { predicate: (q) => JSON.stringify(q.queryKey).includes("blog") },
        (cached: any) => {
          if (!cached || typeof cached !== "object") return cached;
          if ("blog" in cached && cached.blog?._id === id)
            return { ...cached, blog: { ...cached.blog, likes, isLiked } };
          if ("blogs" in cached && Array.isArray(cached.blogs))
            return {
              ...cached,
              blogs: cached.blogs.map((b: Blog) =>
                b._id === id ? { ...b, likes, isLiked } : b
              ),
            };
          return cached;
        }
      );
    },

    onError: (_err, _id, context) => {
      (context as any)?.snapshots?.forEach(
        ([key, data]: [readonly unknown[], unknown]) => qc.setQueryData(key, data)
      );
      showError("Update failed", "Could not update like. Please try again.");
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// USER PROFILES
// ─────────────────────────────────────────────────────────────────────────────

const isValidUserId = (id: string) => !!id && id !== "undefined" && id !== "null";

export function usePublicUserProfile(id: string) {
  return useQuery({
    queryKey: queryKeys.users.public(id),
    queryFn: () =>
      apiFetch<{ user: User }>(`/users/public/${id}`).then((r) => r.data.user),
    enabled: isValidUserId(id),
  });
}

/** Alias kept for backward compat — points to the same route */
export function useWriterProfile(id: string) {
  return usePublicUserProfile(id);
}

// ─────────────────────────────────────────────────────────────────────────────
// FOLLOW
// ─────────────────────────────────────────────────────────────────────────────

export function useFollowStatus(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.users.followStatus(userId),
    queryFn: () =>
      authFetch<{ isFollowing: boolean }>(
        `/user/follow/${userId}/follow-status`
      ).then((r) => r.data),
    enabled: isValidUserId(userId) && enabled,
  });
}

export function useFollow() {
  const qc = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: (id: string) => {
      const token = getStoredToken();
      if (!token) throw new Error("Not authenticated");
      return authFetch(`/user/follow/${id}`, { method: "POST" });
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.users.followStatus(id) });
      qc.invalidateQueries({ queryKey: queryKeys.users.public(id) });
      success("Now following!", "You'll see their updates in your feed.");
    },
    onError: (e: Error) => showError("Follow failed", e.message),
  });
}

export function useUnfollow() {
  const qc = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: (id: string) => {
      const token = getStoredToken();
      if (!token) throw new Error("Not authenticated");
      return authFetch(`/user/follow/${id}`, { method: "DELETE" });
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.users.followStatus(id) });
      qc.invalidateQueries({ queryKey: queryKeys.users.public(id) });
      success("Unfollowed", "You won't see their updates anymore.");
    },
    onError: (e: Error) => showError("Unfollow failed", e.message),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () =>
      apiFetch<{ categories: Category[] }>("/categories").then(
        (r) => r.data.categories
      ),
    staleTime: 300_000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMENTS — read
// ─────────────────────────────────────────────────────────────────────────────

export function useArticleComments(articleId: string, page = 1) {
  return useQuery({
    queryKey: [...queryKeys.comments.article(articleId), page],
    queryFn: () =>
      apiFetch<{ comments: Comment[]; total: number }>(
        `/articles/${articleId}/comments?page=${page}&limit=30`
      ).then((r) => r.data),
    enabled: !!articleId,
  });
}

export function useBlogComments(blogId: string, page = 1) {
  return useQuery({
    queryKey: [...queryKeys.comments.blog(blogId), page],
    queryFn: () =>
      apiFetch<{ comments: Comment[]; total: number }>(
        `/blog/${blogId}/comments?page=${page}&limit=30`
      ).then((r) => r.data),
    enabled: !!blogId,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMENTS — post
// ─────────────────────────────────────────────────────────────────────────────

export function usePostComment() {
  const qc = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: ({
      articleId,
      blogId,
      body,
      parent,
    }: {
      articleId?: string;
      blogId?: string;
      body: string;
      parent?: string;
    }) => {
      const token = getStoredToken();
      if (!token) throw new Error("Not authenticated");
      const url = articleId
        ? `/articles/${articleId}/comments`
        : `/blog/${blogId}/comments`;
      return authFetch<{ comment: Comment }>(url, {
        method: "POST",
        body: { body, parent },
      });
    },
    onSuccess: (_, vars) => {
      if (vars.articleId)
        qc.invalidateQueries({ queryKey: queryKeys.comments.article(vars.articleId) });
      if (vars.blogId)
        qc.invalidateQueries({ queryKey: queryKeys.comments.blog(vars.blogId) });
      success("Comment posted!", "Your comment is now visible.");
    },
    onError: (e: Error) => showError("Failed to post", e.message),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMENTS — edit & delete
// ─────────────────────────────────────────────────────────────────────────────

export function useEditComment() {
  const qc = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) => {
      const token = getStoredToken();
      if (!token) throw new Error("Not authenticated");
      return authFetch<{ comment: Comment }>(`/comments/${commentId}`, {
        method: "PATCH",
        body: { body },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.comments.all() });
      success("Comment updated", "Your changes are saved.");
    },
    onError: (e: Error) =>
      showError("Update failed", e.message ?? "Please try again."),
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: (commentId: string) => {
      const token = getStoredToken();
      if (!token) throw new Error("Not authenticated");
      return authFetch(`/comments/${commentId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.comments.all() });
      success("Comment deleted", "It has been removed.");
    },
    onError: (e: Error) =>
      showError("Delete failed", e.message ?? "Please try again."),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMENTS — like (optimistic)
// ─────────────────────────────────────────────────────────────────────────────

interface CommentLikeResponse {
  likes: number;
  userLiked: boolean;
}

interface CommentQueryData {
  comments: Comment[];
  total: number;
}

export function useLikeComment() {
  const qc = useQueryClient();

  return useMutation<ApiResponse<CommentLikeResponse>, Error, string>({
    mutationFn: (commentId: string) => {
      const token = getStoredToken();
      if (!token) throw new Error("Not authenticated");
      return authFetch<CommentLikeResponse>(`/comments/${commentId}/like`, {
        method: "POST",
      });
    },

    onMutate: async (commentId: string) => {
      const commentCaches = qc
        .getQueryCache()
        .getAll()
        .filter((cache) => JSON.stringify(cache.queryKey).includes("comments"));

      const previous = commentCaches.map((cache) => ({
        key: cache.queryKey,
        data: cache.state.data,
      }));

      const updateComment = (comment: Comment): Comment => {
        if (comment._id === commentId) {
          const isLiked = comment.isLiked ?? false;
          return {
            ...comment,
            likes: isLiked ? Math.max(0, comment.likes - 1) : comment.likes + 1,
            isLiked: !isLiked,
          };
        }
        if (comment.replies?.length)
          return { ...comment, replies: comment.replies.map(updateComment) };
        return comment;
      };

      commentCaches.forEach((cache) => {
        qc.setQueryData<CommentQueryData>(cache.queryKey, (old) =>
          old ? { ...old, comments: old.comments?.map(updateComment) ?? [] } : old
        );
      });

      return { previous };
    },

    onError: (_err, _id, context) => {
      const ctx = context as {
        previous?: Array<{ key: readonly unknown[]; data: unknown }>;
      };
      ctx?.previous?.forEach(({ key, data }) => qc.setQueryData(key, data));
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// NEWSLETTER
// ─────────────────────────────────────────────────────────────────────────────

export function useSubscribeNewsletter() {
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: ({ email, name }: { email: string; name?: string }) =>
      apiFetch("/newsletter/subscribe", {
        method: "POST",
        body: { email, name },
      }),
    onSuccess: () => success("Subscribed!", "Check your email to confirm."),
    onError: (e: Error) => showError("Subscription failed", e.message),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () =>
      authFetch<{
        notifications: import("@/types").Notification[];
        unreadCount: number;
      }>("/notifications").then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      const token = getStoredToken();
      if (!token) throw new Error("Not authenticated");
      return authFetch(`/notifications/${id}/read`, { method: "PATCH" });
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.notifications.list() }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      const token = getStoredToken();
      if (!token) throw new Error("Not authenticated");
      return authFetch("/notifications/read-all", { method: "PATCH" });
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.notifications.list() }),
  });
}