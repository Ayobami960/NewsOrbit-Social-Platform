// "use client";

// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { apiFetch, authFetch } from "@/lib/apiFetch";
// import { queryKeys } from "@/lib/queryKeys";
// import type { Blog, Category, Comment, BlogFilters, User, ApiResponse } from "@/types";
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

// // Public reader view — hits GET /blog/slug/:slug (optionalAuth)
// export function useBlogBySlug(slug: string) {
//   return useQuery({
//     queryKey: queryKeys.blogs.bySlug(slug),                         // ✅ distinct key
//     queryFn:  () =>
//       apiFetch<{ blog: Blog }>(`/blog/slug/${slug}`).then(r => r.data), // ✅ correct route
//     enabled: !!slug,
//   });
// }

// // Owner/admin edit view — hits GET /blog/:id (protect)
// export function useBlog(id: string) {
//   return useQuery({
//     queryKey: queryKeys.blogs.detail(id),                           // ✅ ID-only key
//     queryFn:  () =>
//       authFetch<{ blog: Blog }>(`/blog/${id}`).then(r => r.data.blog),
//     enabled: !!id,
//   });
// }

// export function useMyBlogs() {
//   return useQuery({
//     queryKey: queryKeys.blogs.mine(),
//     queryFn:  () =>
//       authFetch<{ blogs: Blog[] }>("/blog/mine").then(r => r.data),
//   });
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // BLOGS — create
// // ─────────────────────────────────────────────────────────────────────────────

// export function useCreateBlog() {
//   const qc = useQueryClient();

//   return useMutation({
//     mutationFn: (formData: FormData) =>
//       authFetch<{ blog: Blog }>("/blog", {
//         method: "POST",
//         body:   formData,
//         // Do NOT set Content-Type — browser sets it with the boundary
//       }).then(r => r.data.blog),

//     onSuccess: (blog) => {
//       qc.invalidateQueries({ queryKey: queryKeys.blogs.lists() });
//       qc.invalidateQueries({ queryKey: queryKeys.blogs.mine() });
//       qc.setQueryData(queryKeys.blogs.bySlug(blog.slug), { blog }); // ✅ was detail(blog.slug)
//       toast.success("Blog published successfully! 🎉");
//     },

//     onError: (err: any) => {
//       toast.error(err?.message ?? "Failed to publish blog.");
//     },
//   });
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // BLOGS — update
// // ─────────────────────────────────────────────────────────────────────────────

// export function useUpdateBlog() {
//   const qc = useQueryClient();

//   return useMutation({
//     mutationFn: ({ id, data }: { id: string; data: FormData }) =>
//       authFetch<{ blog: Blog }>(`/blog/${id}`, {
//         method: "PATCH",
//         body:   data,
//       }).then(r => r.data.blog),

//     onSuccess: (blog) => {
//       qc.invalidateQueries({ queryKey: queryKeys.blogs.lists() });
//       qc.invalidateQueries({ queryKey: queryKeys.blogs.mine() });
//       qc.setQueryData(queryKeys.blogs.bySlug(blog.slug), { blog }); // ✅ was detail(blog.slug)
//       qc.setQueryData(queryKeys.blogs.detail(blog._id),  { blog }); // ✅ consistent shape
//       toast.success("Blog updated!");
//     },

//     onError: (e: Error) => toast.error(e.message ?? "Failed to update blog."),
//   });
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // BLOGS — delete
// // ─────────────────────────────────────────────────────────────────────────────

// export function useDeleteBlog() {
//   const qc = useQueryClient();

//   return useMutation({
//     mutationFn: (id: string) =>
//       authFetch(`/blog/${id}`, { method: "DELETE" }),

//     onSuccess: (_, id) => {
//       // Scrub deleted blog from every list cache
//       qc.setQueriesData<{ blogs: Blog[] }>(
//         { queryKey: queryKeys.blogs.lists() },
//         (old) => old ? { ...old, blogs: old.blogs.filter(b => b._id !== id) } : old
//       );
//       // Scrub from mine cache
//       qc.setQueryData<{ blogs: Blog[] }>(
//         queryKeys.blogs.mine(),
//         (old) => old ? { ...old, blogs: old.blogs.filter(b => b._id !== id) } : old
//       );
//       // Remove both detail caches (ID and slug are both orphaned)
//       qc.removeQueries({ queryKey: queryKeys.blogs.detail(id) });
//       qc.removeQueries({
//         predicate: (q) =>
//           JSON.stringify(q.queryKey).startsWith(JSON.stringify(["blogs", "slug"])),
//       });
//       toast.success("Blog deleted.");
//     },

//     onError: (e: Error) => toast.error(e.message ?? "Failed to delete blog."),
//   });
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // BLOGS — like  (optimistic, no flicker)
// // ─────────────────────────────────────────────────────────────────────────────

// interface LikeResponse {
//   likes:   number;
//   isLiked: boolean;
// }

// export function useLikeBlog() {
//   const qc = useQueryClient();

//   return useMutation<ApiResponse<LikeResponse>, Error, string>({
//     mutationFn: (id: string) =>
//       authFetch<LikeResponse>(`/blog/${id}/like`, { method: "POST" }),

//     // ── Optimistic update ──────────────────────────────────────────────────
//     onMutate: async (id: string) => {
//       await qc.cancelQueries({
//         predicate: (q) => JSON.stringify(q.queryKey).includes("blog"),
//       });

//       const snapshots = qc.getQueriesData<unknown>({
//         predicate: (q) => JSON.stringify(q.queryKey).includes("blog"),
//       });

//       const patchLike = (cached: any): any => {
//         if (!cached || typeof cached !== "object") return cached;

//         // shape: { blog: Blog }
//         if ("blog" in cached && cached.blog?._id === id) {
//           const wasLiked = Boolean(cached.blog.isLiked);
//           return {
//             ...cached,
//             blog: {
//               ...cached.blog,
//               isLiked: !wasLiked,
//               likes:   wasLiked ? Math.max(0, cached.blog.likes - 1) : cached.blog.likes + 1,
//             },
//           };
//         }

//         // shape: { blogs: Blog[] }
//         if ("blogs" in cached && Array.isArray(cached.blogs)) {
//           return {
//             ...cached,
//             blogs: cached.blogs.map((b: Blog) => {
//               if (b._id !== id) return b;
//               const wasLiked = Boolean(b.isLiked);
//               return {
//                 ...b,
//                 isLiked: !wasLiked,
//                 likes:   wasLiked ? Math.max(0, b.likes - 1) : b.likes + 1,
//               };
//             }),
//           };
//         }

//         return cached;
//       };

//       qc.setQueriesData<unknown>(
//         { predicate: (q) => JSON.stringify(q.queryKey).includes("blog") },
//         patchLike
//       );

//       return { snapshots };
//     },

//     // ── Reconcile with server truth ────────────────────────────────────────
//     onSuccess: (response, id) => {
//       const { likes, isLiked } = response.data;

//       qc.setQueriesData<unknown>(
//         { predicate: (q) => JSON.stringify(q.queryKey).includes("blog") },
//         (cached: any) => {
//           if (!cached || typeof cached !== "object") return cached;

//           if ("blog" in cached && cached.blog?._id === id) {
//             return { ...cached, blog: { ...cached.blog, likes, isLiked } };
//           }
//           if ("blogs" in cached && Array.isArray(cached.blogs)) {
//             return {
//               ...cached,
//               blogs: cached.blogs.map((b: Blog) =>
//                 b._id === id ? { ...b, likes, isLiked } : b
//               ),
//             };
//           }
//           return cached;
//         }
//       );
//     },

//     // ── Roll back on error ─────────────────────────────────────────────────
//     onError: (_err, _id, context) => {
//       (context as any)?.snapshots?.forEach(
//         ([key, data]: [readonly unknown[], unknown]) => qc.setQueryData(key, data)
//       );
//       toast.error("Could not update like. Please try again.");
//     },
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
//       articleId,
//       blogId,
//       body,
//       parent,
//     }: {
//       articleId?: string;
//       blogId?:    string;
//       body:       string;
//       parent?:    string;
//     }) => {
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

// // ── COMMENT LIKES ─────────────────────────────────────────────────────────────

// interface CommentLikeResponse {
//   likes:     number;
//   userLiked: boolean;
// }

// interface CommentQueryData {
//   comments: Comment[];
//   total:    number;
// }

// export function useLikeComment() {
//   const qc = useQueryClient();

//   return useMutation<ApiResponse<CommentLikeResponse>, Error, string>({
//     mutationFn: (commentId: string) =>
//       authFetch<CommentLikeResponse>(`/comments/${commentId}/like`, { method: "POST" }),

//     onMutate: async (commentId: string) => {
//       const commentCaches = qc
//         .getQueryCache()
//         .getAll()
//         .filter(cache => JSON.stringify(cache.queryKey).includes("comments"));

//       const previous = commentCaches.map(cache => ({
//         key:  cache.queryKey,
//         data: cache.state.data,
//       }));

//       const updateComment = (comment: Comment): Comment => {
//         if (comment._id === commentId) {
//           const isLiked = comment.isLiked ?? false;
//           return {
//             ...comment,
//             likes:   isLiked ? Math.max(0, comment.likes - 1) : comment.likes + 1,
//             isLiked: !isLiked,
//           };
//         }
//         if (comment.replies?.length) {
//           return { ...comment, replies: comment.replies.map(updateComment) };
//         }
//         return comment;
//       };

//       commentCaches.forEach(cache => {
//         qc.setQueryData<CommentQueryData>(cache.queryKey, (old) => {
//           if (!old) return old;
//           return { ...old, comments: old.comments?.map(updateComment) ?? [] };
//         });
//       });

//       return { previous };
//     },

//     onError: (_err, _id, context) => {
//       const ctx = context as { previous?: Array<{ key: readonly unknown[]; data: unknown }> };
//       ctx?.previous?.forEach(({ key, data }) => qc.setQueryData(key, data));
//     },
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
//     mutationFn: (id: string) => authFetch(`/user/follow/${id}`, { method: "POST" }),
//     onSuccess: (_, id) => {
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
//     mutationFn: (id: string) => authFetch(`/user/follow/${id}`, { method: "DELETE" }),
//     onSuccess: (_, id) => {
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
//     queryFn:  () =>
//       apiFetch<{ user: User }>(`/users/public/${id}`).then(r => r.data.user),
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
import { apiFetch, authFetch, getStoredToken } from "@/lib/apiFetch";
import { queryKeys } from "@/lib/queryKeys";
import type { Blog, Category, Comment, BlogFilters, User, ApiResponse } from "@/types";
import { toast } from "react-toastify";

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

/**
 * All published blogs by any user — used on the public user profile page.
 * GET /blog?author=:userId&page=:page&limit=:limit
 */
export function useUserBlogs(userId: string, page = 1, limit = 9) {
  return useQuery({
    queryKey: queryKeys.blogs.byUser(userId, page),
    queryFn: () =>
      apiFetch<{
        blogs: Blog[];
        pagination: { page: number; total: number; pages: number; limit: number };
      }>(`/blog?author=${userId}&page=${page}&limit=${limit}`).then(
        (r) => r.data
      ),
    enabled: !!userId,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOGS — create
// ─────────────────────────────────────────────────────────────────────────────

export function useCreateBlog() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      authFetch<{ blog: Blog }>("/blog", {
        method: "POST",
        body: formData,
        // Do NOT set Content-Type — browser sets it with the multipart boundary
      }).then((r) => r.data.blog),

    onSuccess: (blog) => {
      qc.invalidateQueries({ queryKey: queryKeys.blogs.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.blogs.mine() });
      qc.setQueryData(queryKeys.blogs.bySlug(blog.slug), { blog });
      toast.success("Blog published successfully! 🎉");
    },

    onError: (e: Error) =>
      toast.error(e?.message ?? "Failed to publish blog."),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOGS — update
// ─────────────────────────────────────────────────────────────────────────────

export function useUpdateBlog() {
  const qc = useQueryClient();

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
      toast.success("Blog updated!");
    },

    onError: (e: Error) => toast.error(e.message ?? "Failed to update blog."),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOGS — delete
// ─────────────────────────────────────────────────────────────────────────────

export function useDeleteBlog() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      const token = getStoredToken();
      if (!token) throw new Error("Not authenticated");
      return authFetch(`/blog/${id}`, { method: "DELETE" });
    },

    onSuccess: (_, id) => {
      // Remove from all list caches
      qc.setQueriesData<{ blogs: Blog[] }>(
        { queryKey: queryKeys.blogs.lists() },
        (old) =>
          old ? { ...old, blogs: old.blogs.filter((b) => b._id !== id) } : old
      );
      // Remove from mine cache
      qc.setQueryData<{ blogs: Blog[] }>(
        queryKeys.blogs.mine(),
        (old) =>
          old ? { ...old, blogs: old.blogs.filter((b) => b._id !== id) } : old
      );
      // Remove detail caches
      qc.removeQueries({ queryKey: queryKeys.blogs.detail(id) });
      qc.removeQueries({
        predicate: (q) =>
          JSON.stringify(q.queryKey).startsWith(
            JSON.stringify(["blogs", "slug"])
          ),
      });
      toast.success("Blog deleted.");
    },

    onError: (e: Error) => toast.error(e.message ?? "Failed to delete blog."),
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
        ([key, data]: [readonly unknown[], unknown]) =>
          qc.setQueryData(key, data)
      );
      toast.error("Could not update like. Please try again.");
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// USER PROFILES (blog context — not writer/staff)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch any user's public profile.
 * Used by /app/profile/user/[id]/page.tsx
 * GET /users/public/:id  (optionalAuth)
 */
export function usePublicUserProfile(id: string) {
  return useQuery({
    queryKey: queryKeys.users.public(id),
    queryFn: () =>
      apiFetch<{ user: User }>(`/users/public/${id}`).then(
        (r) => r.data.user
      ),
    enabled: !!id,
  });
}


export function useWriterProfile(id: string) {
  return useQuery({
    queryKey: queryKeys.users.public(id),
    queryFn:  () =>
      apiFetch<{ user: User }>(`/users/public/${id}`).then(r => r.data.user),
    enabled: !!id,
  });
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
    enabled: !!userId && enabled,
  });
}

export function useFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      const token = getStoredToken();
      if (!token) throw new Error("Not authenticated");
      return authFetch(`/user/follow/${id}`, { method: "POST" });
    },
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
    mutationFn: (id: string) => {
      const token = getStoredToken();
      if (!token) throw new Error("Not authenticated");
      return authFetch(`/user/follow/${id}`, { method: "DELETE" });
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.users.followStatus(id) });
      qc.invalidateQueries({ queryKey: queryKeys.users.public(id) });
      toast.success("Unfollowed.");
    },
    onError: (e: Error) => toast.error(e.message),
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
// COMMENTS
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
      const token = getStoredToken();
      if (!token) throw new Error("Not authenticated");
      return authFetch<{ comment: Comment }>(url, {
        method: "POST",
        body: { body, parent },
      });
    },
    onSuccess: (_, vars) => {
      if (vars.articleId)
        qc.invalidateQueries({
          queryKey: queryKeys.comments.article(vars.articleId),
        });
      if (vars.blogId)
        qc.invalidateQueries({
          queryKey: queryKeys.comments.blog(vars.blogId),
        });
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
        .filter((cache) =>
          JSON.stringify(cache.queryKey).includes("comments")
        );
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
  return useMutation({
    mutationFn: ({ email, name }: { email: string; name?: string }) =>
      apiFetch("/newsletter/subscribe", {
        method: "POST",
        body: { email, name },
      }),
    onSuccess: () => toast.success("Subscribed! Check your email."),
    onError: (e: Error) => toast.error(e.message),
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