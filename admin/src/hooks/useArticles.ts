import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "../lib/apiFetch";
import { queryKeys } from "../lib/queryKeys";
import type {
  Article,
  ArticleListItem,
  ArticleFilters,
  CreateArticlePayload,
  UpdateArticlePayload,
  ArticlePaginatedResponse,
} from "../types";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// Extended payload types
// ─────────────────────────────────────────────────────────────────────────────

export type CreatePayload = CreateArticlePayload & { contentDelta?: object };
export type UpdatePayload = UpdateArticlePayload & { contentDelta?: object };

// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────

export function useArticles(filters: ArticleFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== "" && v !== undefined) params.set(k, String(v));
  });

  return useQuery({
    queryKey: queryKeys.articles.list(filters),
    queryFn: () =>
      authFetch<ArticlePaginatedResponse>(`/articles?${params}`).then(
        (res) => res.data
      ),
    staleTime: 30_000,
  });
}

export function useArticle(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.articles.detail(id ?? ""),
    queryFn: () =>
      authFetch<{ article: Article }>(`/articles/${id}`).then(
        (r) => r.data.article
      ),
    enabled: !!id,
  });
}

export function useMyArticleStats() {
  return useQuery({
    queryKey: queryKeys.articles.myStats(),
    queryFn: () =>
      authFetch<{
        total: number;
        published: number;
        draft: number;
        totalViews: number;
        topArticles: ArticleListItem[];
      }>("/articles/my-stats").then((r) => r.data),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

export function useCreateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePayload | FormData) =>
      authFetch<{ article: Article }>("/articles", {
        method: "POST",
        body: payload as FormData | Record<string, unknown>,  // ✅ satisfies ApiFetchOptions body type
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["articles"] });
      toast.success("Article created successfully.");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e.message),
  });
}

export function useUpdateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePayload | FormData }) =>
      authFetch<{ article: Article }>(`/articles/${id}`, {
        method: "PATCH",
        body: data as FormData | Record<string, unknown>,  // ✅ same fix
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["articles"] });
      toast.success("Article updated successfully.");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e.message),
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      authFetch(`/articles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["articles"] });
      toast.success("Article deleted.");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e.message),
  });
}