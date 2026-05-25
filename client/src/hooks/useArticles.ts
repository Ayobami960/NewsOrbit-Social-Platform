"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, authFetch } from "@/lib/apiFetch";
import { queryKeys } from "@/lib/queryKeys";
import type { Article, ArticleFilters, ArticlesResponse } from "@/types";

export function useArticles(filters: ArticleFilters = {}) {
  const params = new URLSearchParams();
  const merged = { status: "published", ...filters };
  Object.entries(merged).forEach(([k, v]) => {
    if (v !== undefined && v !== "") params.set(k, String(v));
  });
  return useQuery({
    queryKey: queryKeys.articles.list(filters),
    queryFn: () => apiFetch<ArticlesResponse>(`/articles?${params}`).then(r => r.data),
  });
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: queryKeys.articles.detail(slug),
    queryFn: () =>
      apiFetch<{ article: Article }>(`/articles/${slug}`).then(r => r.data.article),
    enabled: !!slug,
  });
}

export function useBreakingArticles() {
  return useQuery({
    queryKey: queryKeys.articles.breaking(),
    queryFn: () =>
      apiFetch<ArticlesResponse>("/articles?isBreaking=true&status=published&limit=5").then(r => r.data),
    staleTime: 30_000,
  });
}

export function useFeaturedArticles() {
  return useQuery({
    queryKey: queryKeys.articles.featured(),
    queryFn: () =>
      apiFetch<ArticlesResponse>("/articles?isFeatured=true&status=published&limit=6").then(r => r.data),
  });
}

export function useLikeArticle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      authFetch<{ likes: number; isLiked: boolean }>(`/articles/${id}/like`, { method: "POST" }),

    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: queryKeys.articles.detail(id) });

      const previous = qc.getQueryData<Article>(queryKeys.articles.detail(id));

      qc.setQueryData<Article>(queryKeys.articles.detail(id), old => {
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
      if (context?.previous) {
        qc.setQueryData(queryKeys.articles.detail(id), context.previous);
      }
    },

    onSuccess: (data, id) => {
      qc.setQueryData<Article>(queryKeys.articles.detail(id), old => {
        if (!old) return old;
        return { ...old, likes: data.data.likes, isLiked: data.data.isLiked };
      });
    },
  });
}