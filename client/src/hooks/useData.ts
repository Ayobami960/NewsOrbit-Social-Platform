// "use client";

// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { apiFetch, authFetch } from "@/lib/apiFetch";
// import { queryKeys } from "@/lib/queryKeys";
// import type { Blog, Category, Comment, BlogFilters, User } from "@/types";
// import { toast } from "react-toastify";

// // ── BLOGS ─────────────────────────────────────────────────────────────────────

// export function useBlogs(filters: BlogFilters = {}) {
//   const params = new URLSearchParams();
//   Object.entries(filters).forEach(([k, v]) => {
//     if (v !== undefined && v !== "") params.set(k, String(v));
//   });
//   return useQuery({
//     queryKey: queryKeys.blogs.list(filters),
//     queryFn:  () =>
//       apiFetch<{ blogs: Blog[]; pagination: { page: number; total: number; pages: number; limit: number } }>(
//         `/blog?${params}`
//       ).then(r => r.data),
//   });
// }

// export function useBlog(slug: string) {
//   return useQuery({
//     queryKey: queryKeys.blogs.detail(slug),
//     queryFn:  () => apiFetch<{ blog: Blog }>(`/blog/${slug}`).then(r => r.data.blog),
//     enabled: !!slug,
//   });
// }

// export function useLikeBlog() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: (id: string) =>
//       authFetch<{ likes: number; isLiked: boolean }>(`/blog/${id}/like`, { method: "POST" }),
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["blogs"] }),
//   });
// }

// // ── CATEGORIES ────────────────────────────────────────────────────────────────

// export function useCategories() {
//   return useQuery({
//     queryKey: queryKeys.categories.list(),
//     queryFn:  () =>
//       apiFetch<{ categories: Category[] }>("/categories").then(r => r.data.categories),
//     staleTime: 300_000,
//   });
// }

// // ── COMMENTS ──────────────────────────────────────────────────────────────────

// export function useArticleComments(articleId: string, page = 1) {
//   return useQuery({
//     queryKey: [...queryKeys.comments.article(articleId), page],
//     queryFn:  () =>
//       apiFetch<{ comments: Comment[]; total: number }>(
//         `/articles/${articleId}/comments?page=${page}&limit=30`
//       ).then(r => r.data),
//     enabled: !!articleId,
//   });
// }

// export function useBlogComments(blogId: string, page = 1) {
//   return useQuery({
//     queryKey: [...queryKeys.comments.blog(blogId), page],
//     queryFn:  () =>
//       apiFetch<{ comments: Comment[]; total: number }>(
//         `/blog/${blogId}/comments?page=${page}&limit=30`
//       ).then(r => r.data),
//     enabled: !!blogId,
//   });
// }

// export function usePostComment() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: ({
//       articleId, blogId, body, parent,
//     }: { articleId?: string; blogId?: string; body: string; parent?: string }) => {
//       const url = articleId
//         ? `/articles/${articleId}/comments`
//         : `/blog/${blogId}/comments`;
//       return authFetch<{ comment: Comment }>(url, { method: "POST", body: { body, parent } });
//     },
//     onSuccess: (_, vars) => {
//       if (vars.articleId) qc.invalidateQueries({ queryKey: queryKeys.comments.article(vars.articleId) });
//       if (vars.blogId)    qc.invalidateQueries({ queryKey: queryKeys.comments.blog(vars.blogId) });
//       toast.success("Comment posted!");
//     },
//     onError: (e: Error) => toast.error(e.message),
//   });
// }

// // ── FOLLOW ────────────────────────────────────────────────────────────────────

// export function useFollowStatus(userId: string, enabled: boolean) {
//   return useQuery({
//     queryKey: queryKeys.users.followStatus(userId),
//     queryFn:  () =>
//       authFetch<{ isFollowing: boolean }>(`/user/follow/${userId}/follow-status`).then(r => r.data),
//     enabled: !!userId && enabled,
//   });
// }

// export function useFollow() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: (id: string) => authFetch(`/user/follow/${id}/follow`, { method: "POST" }),
//     onSuccess:  (_, id) => {
//       qc.invalidateQueries({ queryKey: queryKeys.users.followStatus(id) });
//       qc.invalidateQueries({ queryKey: queryKeys.users.public(id) });
//       toast.success("Now following!");
//     },
//     onError: (e: Error) => toast.error(e.message),
//   });
// }

// export function useUnfollow() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: (id: string) => authFetch(`/user/follow/${id}/follow`, { method: "DELETE" }),
//     onSuccess:  (_, id) => {
//       qc.invalidateQueries({ queryKey: queryKeys.users.followStatus(id) });
//       qc.invalidateQueries({ queryKey: queryKeys.users.public(id) });
//       toast.success("Unfollowed.");
//     },
//     onError: (e: Error) => toast.error(e.message),
//   });
// }

// // ── WRITER PROFILE ────────────────────────────────────────────────────────────

// export function useWriterProfile(id: string) {
//   return useQuery({
//     queryKey: queryKeys.users.public(id),
//     queryFn:  () => apiFetch<{ user: User }>(`/users/public/${id}`).then(r => r.data.user),
//     enabled: !!id,
//   });
// }

// // ── NEWSLETTER ────────────────────────────────────────────────────────────────

// export function useSubscribeNewsletter() {
//   return useMutation({
//     mutationFn: ({ email, name }: { email: string; name?: string }) =>
//       apiFetch("/newsletter/subscribe", { method: "POST", body: { email, name } }),
//     onSuccess: () => toast.success("Subscribed! Check your email."),
//     onError:   (e: Error) => toast.error(e.message),
//   });
// }

// // ── NOTIFICATIONS ─────────────────────────────────────────────────────────────

// export function useNotifications() {
//   return useQuery({
//     queryKey: queryKeys.notifications.list(),
//     queryFn:  () =>
//       authFetch<{ notifications: import("@/types").Notification[]; unreadCount: number }>(
//         "/notifications"
//       ).then(r => r.data),
//     staleTime: 30_000,
//   });
// }

// export function useMarkNotificationRead() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: (id: string) => authFetch(`/notifications/${id}/read`, { method: "PATCH" }),
//     onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.notifications.list() }),
//   });
// }

// export function useMarkAllRead() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: () => authFetch("/notifications/read-all", { method: "PATCH" }),
//     onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.notifications.list() }),
//   });
// }

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, authFetch } from "@/lib/apiFetch";
import { queryKeys } from "@/lib/queryKeys";
import type { Blog, Category, Comment, BlogFilters, User, ApiResponse } from "@/types";
import { toast } from "react-toastify";

// ── BLOGS ─────────────────────────────────────────────────────────────────────

export function useBlogs(filters: BlogFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== "") params.set(k, String(v));
  });
  return useQuery({
    queryKey: queryKeys.blogs.list(filters),
    queryFn: () =>
      apiFetch<{ blogs: Blog[]; pagination: { page: number; total: number; pages: number; limit: number } }>(
        `/blog?${params}`
      ).then(r => r.data),
  });
}

export function useBlog(slug: string) {
  return useQuery({
    queryKey: queryKeys.blogs.detail(slug),
    queryFn: () => apiFetch<{ blog: Blog }>(`/blog/${slug}`).then(r => r.data.blog),
    enabled: !!slug,
  });
}

interface LikeResponse {
  likes: number;
  isLiked: boolean;
}

export function useLikeBlog() {
  const qc = useQueryClient();

  return useMutation<ApiResponse<LikeResponse>, Error, string>({
    mutationFn: (id: string) =>
      authFetch<LikeResponse>(`/blog/${id}/like`, { method: "POST" }),

    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: queryKeys.blogs.detail(id) });

      const previous = qc.getQueryData<Blog>(queryKeys.blogs.detail(id));

      qc.setQueryData<Blog>(queryKeys.blogs.detail(id), (old: Blog | undefined) => {
        if (!old) return old;
        const isLiked = old.isLiked ?? false;
        return {
          ...old,
          isLiked: !isLiked,
          likes: isLiked ? Math.max(0, old.likes - 1) : old.likes + 1,
        };
      });

      return { previous };
    },

    onError: (_err, id, context) => {
      const ctx = context as { previous?: Blog };
      if (ctx?.previous) {
        qc.setQueryData<Blog>(queryKeys.blogs.detail(id), ctx.previous);
      }
    },

    onSuccess: (response, id) => {
      qc.setQueryData<Blog>(queryKeys.blogs.detail(id), (old: Blog | undefined) => {
        if (!old) return old;
        return {
          ...old,
          likes: response.data.likes,
          isLiked: response.data.isLiked,
        };
      });
    },
  });
}

// ── CATEGORIES ────────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () =>
      apiFetch<{ categories: Category[] }>("/categories").then(r => r.data.categories),
    staleTime: 300_000,
  });
}

// ── COMMENTS ──────────────────────────────────────────────────────────────────

export function useArticleComments(articleId: string, page = 1) {
  return useQuery({
    queryKey: [...queryKeys.comments.article(articleId), page],
    queryFn: () =>
      apiFetch<{ comments: Comment[]; total: number }>(
        `/articles/${articleId}/comments?page=${page}&limit=30`
      ).then(r => r.data),
    enabled: !!articleId,
  });
}

export function useBlogComments(blogId: string, page = 1) {
  return useQuery({
    queryKey: [...queryKeys.comments.blog(blogId), page],
    queryFn: () =>
      apiFetch<{ comments: Comment[]; total: number }>(
        `/blog/${blogId}/comments?page=${page}&limit=30`
      ).then(r => r.data),
    enabled: !!blogId,
  });
}

export function usePostComment() {
  const qc = useQueryClient();
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
      const url = articleId
        ? `/articles/${articleId}/comments`
        : `/blog/${blogId}/comments`;
      return authFetch<{ comment: Comment }>(url, { method: "POST", body: { body, parent } });
    },
    onSuccess: (_, vars) => {
      if (vars.articleId) qc.invalidateQueries({ queryKey: queryKeys.comments.article(vars.articleId) });
      if (vars.blogId)    qc.invalidateQueries({ queryKey: queryKeys.comments.blog(vars.blogId) });
      toast.success("Comment posted!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

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
    mutationFn: (commentId: string) =>
      authFetch<CommentLikeResponse>(`/comments/${commentId}/like`, { method: "POST" }),

    onMutate: async (commentId: string) => {
      const commentKeys = qc
        .getQueryCache()
        .getAll()
        .filter(cache => JSON.stringify(cache.queryKey).includes("comments"));

      const previous = commentKeys.map(cache => ({ key: cache.queryKey, data: cache.state.data }));

      commentKeys.forEach(cache => {
        qc.setQueryData<CommentQueryData>(cache.queryKey, (old: CommentQueryData | undefined) => {
          if (!old) return old;

          const updateComment = (comment: Comment): Comment => {
            if (comment._id === commentId) {
              const isLiked = comment.isLiked ?? false;
              return {
                ...comment,
                likes: isLiked ? Math.max(0, comment.likes - 1) : comment.likes + 1,
                isLiked: !isLiked,
              };
            }
            if (comment.replies && comment.replies.length > 0) {
              return { ...comment, replies: comment.replies.map(updateComment) };
            }
            return comment;
          };

          return {
            ...old,
            comments: old.comments?.map(updateComment) ?? [],
          };
        });
      });

      return { previous };
    },

    onError: (_err, _id, context) => {
      const ctx = context as { previous?: Array<{ key: readonly unknown[]; data: unknown }> };
      if (ctx?.previous) {
        ctx.previous.forEach(({ key, data }) => {
          qc.setQueryData(key, data);
        });
      }
    },
  });
}

// ── FOLLOW ────────────────────────────────────────────────────────────────────

export function useFollowStatus(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.users.followStatus(userId),
    queryFn: () =>
      authFetch<{ isFollowing: boolean }>(`/user/follow/${userId}/follow-status`).then(r => r.data),
    enabled: !!userId && enabled,
  });
}

export function useFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authFetch(`/user/follow/${id}`, { method: "POST" }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.users.followStatus(id) });
      qc.invalidateQueries({ queryKey: queryKeys.users.public(id) });
      toast.success("Now following!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUnfollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authFetch(`/user/follow/${id}`, { method: "DELETE" }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.users.followStatus(id) });
      qc.invalidateQueries({ queryKey: queryKeys.users.public(id) });
      toast.success("Unfollowed.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── WRITER PROFILE ────────────────────────────────────────────────────────────

export function useWriterProfile(id: string) {
  return useQuery({
    queryKey: queryKeys.users.public(id),
    queryFn: () => apiFetch<{ user: User }>(`/users/public/${id}`).then(r => r.data.user),
    enabled: !!id,
  });
}

// ── NEWSLETTER ────────────────────────────────────────────────────────────────

export function useSubscribeNewsletter() {
  return useMutation({
    mutationFn: ({ email, name }: { email: string; name?: string }) =>
      apiFetch("/newsletter/subscribe", { method: "POST", body: { email, name } }),
    onSuccess: () => toast.success("Subscribed! Check your email."),
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () =>
      authFetch<{ notifications: import("@/types").Notification[]; unreadCount: number }>(
        "/notifications"
      ).then(r => r.data),
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authFetch(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications.list() }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authFetch("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications.list() }),
  });
}