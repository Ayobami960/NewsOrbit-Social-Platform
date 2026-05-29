import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "../lib/apiFetch";
import { queryKeys } from "../lib/queryKeys";
import type {
  Blog,
  Category,
  NewsletterSubscriber,
  SendNewsletterPayload,
  PushBroadcastPayload,
  PushBroadcastResult,
  CategoryPayload,
  AdminBlogFilters,
} from "../types";

export type { CategoryPayload };
import toast from "react-hot-toast";

// ── BLOGS ─────────────────────────────────────────────────────────────────────

export function useAdminBlogs(filters: AdminBlogFilters) {
  const params = new URLSearchParams({
    page:       String(filters.page),
    limit:      "20",
    includeAll: "true",
  });
  if (filters.search) params.set("search", filters.search);

  return useQuery({
    queryKey: ["blogs", "admin-list", filters.page, filters.search],
    queryFn:  () =>
      authFetch<{
        blogs:      Blog[];
        pagination: { page: number; total: number; limit: number };
      }>(`/blog?${params}`).then(r => r.data),
    staleTime: 30_000,
  });
}

export function useAdminDeleteBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authFetch(`/blog/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Blog deleted.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── CATEGORIES ────────────────────────────────────────────────────────────────


export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn:  () =>
      authFetch<{ categories: Category[] }>("/categories").then(r => r.data.categories),
    staleTime: 300_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CategoryPayload>) =>
      authFetch<{ category: Category }>("/categories", { method: "POST", body: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.list() });
      toast.success("Category created.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryPayload> }) =>
      authFetch<{ category: Category }>(`/categories/${id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.list() });
      toast.success("Category updated.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authFetch(`/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.list() });
      toast.success("Category deleted.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── NEWSLETTER ────────────────────────────────────────────────────────────────
export function useNewsletterSubscribers(page = 1) {
  return useQuery({
    queryKey: queryKeys.newsletter.subscribers(page),
    queryFn:  () =>
      authFetch<{ subscribers: NewsletterSubscriber[]; total: number }>(
        `/newsletter/subscribers?page=${page}&limit=30`
      ).then(r => r.data),
    staleTime: 60_000,
  });
}

export function useSendNewsletter() {
  return useMutation({
    mutationFn: (data: Partial<SendNewsletterPayload>) =>
      authFetch<{ sent: number }>("/newsletter/send", { method: "POST", body: data }),
    onSuccess: (data) => toast.success(`Newsletter sent to ${data.data.sent} subscribers.`),
    onError:   (e: Error) => toast.error(e.message),
  });
}

// ── PUSH ──────────────────────────────────────────────────────────────────────
export function useBroadcastPush() {
  return useMutation({
    mutationFn: (data: Partial<PushBroadcastPayload>) =>
      authFetch<PushBroadcastResult>("/push/broadcast", { method: "POST", body: data }),
    onSuccess: (data) => toast.success(`Push sent to ${data.data.sent} devices!`),
    onError:   (e: Error) => toast.error(e.message),
  });
}