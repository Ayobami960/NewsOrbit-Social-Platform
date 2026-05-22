
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "../lib/apiFetch";
import { queryKeys } from "../lib/queryKeys";
import type {
  User,
  UserFilters,
  InviteUserPayload,
  BanUserPayload,
  ChangeRolePayload,
  ActivityLog,
  Pagination,
} from "../types";
import toast from "react-hot-toast";

// ── Helper ────────────────────────────────────────────────────────────────────
// Named interfaces lack an index signature, so we route through `unknown`
// to satisfy apiFetch's  body: Record<string, unknown>  constraint.
function toBody<T extends object>(payload: T): Record<string, unknown> {
  return payload as unknown as Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

export function useAdminUsers(filters: UserFilters) {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== "" && v !== undefined && v !== null) {
      params.set(k, String(v));
    }
  });

  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () =>
      authFetch<{
        users: User[];
        pagination: { page: number; limit: number; total: number };
      }>(`/admin/users?${params}`).then((res) => {
        const data = res.data;
        
        const pages = data.pagination.total > 0 
          ? Math.ceil(data.pagination.total / data.pagination.limit) 
          : 1;

        return {
          ...data,
          pagination: {
            ...data.pagination,
            pages,
            hasNext: data.pagination.page < pages,
            hasPrev: data.pagination.page > 1,
          } as Pagination,
        };
      }),
    staleTime: 30_000,
  });
}

/** GET /api/v1/admin/users/:id  — single user full document */
export function useAdminUser(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn:  () =>
      authFetch<{ user: User }>(`/admin/users/${id}`).then(r => r.data.user),
    enabled: !!id,
  });
}

/** GET /api/v1/admin/users/:id/activity */
export function useUserActivity(id: string) {
  return useQuery({
    queryKey: queryKeys.users.activity(id),
    queryFn:  () =>
      authFetch<{ logs: ActivityLog[] }>(`/admin/users/${id}/activity`).then(
        r => r.data.logs
      ),
    enabled: !!id,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/v1/admin/invite */
export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InviteUserPayload) =>
      authFetch("/admin/invite", { method: "POST", body: toBody(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Invitation sent!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** PATCH /api/v1/admin/users/:id/ban */
export function useBanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BanUserPayload }) =>
      authFetch(`/admin/users/${id}/ban`, { method: "PATCH", body: toBody(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User banned.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** PATCH /api/v1/admin/users/:id/unban */
export function useUnbanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      authFetch(`/admin/users/${id}/unban`, { method: "PATCH" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User unbanned.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** PATCH /api/v1/admin/users/:id/role */
export function useChangeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ChangeRolePayload }) =>
      authFetch(`/admin/users/${id}/role`, { method: "PATCH", body: toBody(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Role updated.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}


