import { useQuery } from "@tanstack/react-query";
import { authFetch } from "../lib/apiFetch";
import { queryKeys } from "../lib/queryKeys";
import type {
  AnalyticsOverview,
  ArticleListItem,
  ArticlesByDayItem,
  UsersByRoleItem,
  ActivityLog,
  ActivityFilters,
} from "../types";

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: queryKeys.analytics.overview(),
    queryFn:  () => authFetch<AnalyticsOverview>("/admin/overview").then(r => r.data),
    staleTime: 60_000,
  });
}

export function useTopArticles() {
  return useQuery({
    queryKey: queryKeys.analytics.topArticles(),
    queryFn:  () =>
      authFetch<{ articles: ArticleListItem[] }>("/admin/top-articles").then(r => r.data.articles),
    staleTime: 60_000,
  });
}

export function useArticlesByDay(days = 14) {
  return useQuery({
    queryKey: queryKeys.analytics.byDay(days),
    queryFn:  () =>
      authFetch<{ data: ArticlesByDayItem[] }>(`/admin/articles-by-day?days=${days}`).then(r => r.data.data),
    staleTime: 60_000,
  });
}

export function useUsersByRole() {
  return useQuery({
    queryKey: queryKeys.analytics.usersByRole(),
    queryFn:  () =>
      authFetch<{ data: UsersByRoleItem[] }>("/admin/users-by-role").then(r => r.data.data),
    staleTime: 120_000,
  });
}

export function useActivityLogs(filters: ActivityFilters) {
  const params = new URLSearchParams();
  if (filters.page)         params.set("page",         String(filters.page));
  if (filters.limit)        params.set("limit",        String(filters.limit));
  if (filters.severity)     params.set("severity",     filters.severity);
  if (filters.action)       params.set("action",       filters.action);
  if (filters.isSuspicious !== "") params.set("isSuspicious", String(filters.isSuspicious));

  return useQuery({
    queryKey: queryKeys.analytics.activity(filters),
    queryFn:  () =>
      authFetch<{ logs: ActivityLog[]; total: number }>(`/admin/activity?${params}`).then(r => r.data),
    staleTime: 30_000,
  });
}
