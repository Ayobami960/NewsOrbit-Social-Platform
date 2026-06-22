"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, authFetch } from "@/lib/apiFetch";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiResponse, Article, ArticleFilters, ArticlesResponse } from "@/types";
import { useToast } from "@/components/ui/toast";

interface LikeResponse {
  likes: number;
  isLiked: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLES — read
// ─────────────────────────────────────────────────────────────────────────────

export function useArticles(filters: ArticleFilters = {}) {
  const params = new URLSearchParams();
  const merged = { status: "published", ...filters };
  Object.entries(merged).forEach(([k, v]) => {
    if (v !== undefined && v !== "") params.set(k, String(v));
  });
  return useQuery({
    queryKey: queryKeys.articles.list(filters),
    queryFn:  () =>
      apiFetch<ArticlesResponse>(`/articles?${params}`).then((r) => r.data),
  });
}

/** Public reader — GET /articles/:slug (by slug) */
export function useArticle(slug: string) {
  return useQuery<Article>({
    queryKey: queryKeys.articles.bySlug(slug),
    queryFn:  async () => {
      const res = await apiFetch<{ article: Article }>(`/articles/${slug}`);
      return res.data.article;
    },
    enabled: !!slug,
  });
}

/** Public reader — GET /articles/slug/:slug */
export function useArticleBySlug(slug: string) {
  return useArticle(slug);
}

/** Writer/admin edit view — GET /articles/edit/:id (protected) */
export function useArticleById(id: string) {
  return useQuery({
    queryKey: queryKeys.articles.detail(id),
    queryFn:  () =>
      authFetch<{ article: Article }>(`/articles/edit/${id}`).then((r) => r.data.article),
    enabled: !!id,
  });
}

export function useBreakingArticles() {
  return useQuery({
    queryKey: queryKeys.articles.breaking(),
    queryFn:  () =>
      apiFetch<ArticlesResponse>(
        "/articles?isBreaking=true&status=published&limit=5"
      ).then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useFeaturedArticles() {
  return useQuery({
    queryKey: queryKeys.articles.featured(),
    queryFn:  () =>
      apiFetch<ArticlesResponse>(
        "/articles?isFeatured=true&status=published&limit=6"
      ).then((r) => r.data),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLES — like (optimistic)
// ─────────────────────────────────────────────────────────────────────────────

export function useLikeArticle() {
  const qc = useQueryClient();
  const { error: showError } = useToast();

  return useMutation<ApiResponse<LikeResponse>, Error, string>({
    mutationFn: (id: string) =>
      authFetch<LikeResponse>(`/articles/${id}/like`, { method: "POST" }),

    onMutate: async (id: string) => {
      await qc.cancelQueries({
        predicate: (q) => JSON.stringify(q.queryKey).includes("article"),
      });

      const snapshots = qc.getQueriesData<unknown>({
        predicate: (q) => JSON.stringify(q.queryKey).includes("article"),
      });

      const patchArticle = (article: Article): Article => {
        const wasLiked = Boolean(article.isLiked);
        return {
          ...article,
          isLiked: !wasLiked,
          likes: wasLiked ? Math.max(0, article.likes - 1) : article.likes + 1,
        };
      };

      const patchLike = (cached: any): any => {
        if (!cached || typeof cached !== "object") return cached;
        if ("_id" in cached && cached._id === id) {
          return patchArticle(cached);
        }
        if ("article" in cached && cached.article?._id === id) {
          return {
            ...cached,
            article: patchArticle(cached.article),
          };
        }
        if ("articles" in cached && Array.isArray(cached.articles)) {
          return {
            ...cached,
            articles: cached.articles.map((b: Article) => {
              if (b._id !== id) return b;
              return patchArticle(b);
            }),
          };
        }
        return cached;
      };

      qc.setQueriesData<unknown>(
        { predicate: (q) => JSON.stringify(q.queryKey).includes("article") },
        patchLike
      );

      return { snapshots };
    },

    onSuccess: (response, id) => {
      const { likes, isLiked } = response.data;
      qc.setQueriesData<unknown>(
        { predicate: (q) => JSON.stringify(q.queryKey).includes("article") },
        (cached: any) => {
          if (!cached || typeof cached !== "object") return cached;
          if ("_id" in cached && cached._id === id)
            return { ...cached, likes, isLiked };
          if ("article" in cached && cached.article?._id === id)
            return { ...cached, article: { ...cached.article, likes, isLiked } };
          if ("articles" in cached && Array.isArray(cached.articles))
            return {
              ...cached,
              articles: cached.articles.map((b: Article) =>
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
