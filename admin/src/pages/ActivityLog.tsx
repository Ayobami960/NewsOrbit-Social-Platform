import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "../lib/apiFetch";
import { queryKeys } from "../lib/queryKeys";
import { useActivityLogs } from "../hooks/useAnalytics";
import Layout from "../components/layout/Layout";
import { Card, Table, Th, Td, Badge, Select, Spinner, Empty, Pagination, Avatar } from "../components/ui";
import type { ActivityFilters, ActivitySeverity, ActivityAction } from "../types";
import { formatDate } from "../lib/utils";
import { Shield, AlertTriangle } from "lucide-react";

const SEVERITY_OPTIONS: ActivitySeverity[] = ["info", "warning", "critical"];
const ACTION_OPTIONS: ActivityAction[] = [
  "login", "failed_login", "injection_attempt", "rate_limit_hit",
  "forbidden_access", "user_ban", "article_create", "article_delete",
  "comment_report", "blog_create",
];

export default function ActivityLog() {
  const [filters, setFilters] = useState<ActivityFilters>({
    page: 1, limit: 50, severity: "", isSuspicious: "", action: "",
  });

  const { data, isLoading } = useActivityLogs(filters);
  const logs  = data?.logs  ?? [];
  const total = data?.total ?? 0;

  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    action: ACTION_OPTIONS[0], user: "", resource: "", resourceType: "", severity: SEVERITY_OPTIONS[0], isSuspicious: false, meta: "",
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => authFetch("/admin/activity-logs", { method: "POST", body: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.analytics.activity(filters) as unknown as any });
      setShowForm(false);
      setForm({ action: ACTION_OPTIONS[0], user: "", resource: "", resourceType: "", severity: SEVERITY_OPTIONS[0], isSuspicious: false, meta: "" });
    },
    onError: (err: any) => alert(err?.message || "Failed to create log"),
  });

  return (
    <Layout title="Activity Log">
      <Card>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <Shield size={15} className="text-zinc-600" />
            <div className="ml-2">
              <button
                className="bg-zinc-700 text-xs px-2 py-1 rounded"
                onClick={() => setShowForm(s => !s)}>
                {showForm ? "Cancel" : "New Log"}
              </button>
            </div>
          <span className="text-sm text-zinc-500 flex-1">
            {total.toLocaleString()} total entries
          </span>
          <Select className="w-35" value={filters.severity ?? ""}
            onChange={e => setFilters(f => ({ ...f, severity: e.target.value as ActivitySeverity | "", page: 1 }))}>
            <option value="">All Severity</option>
            {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </Select>
          <Select className="w-42.5" value={String(filters.isSuspicious ?? "")}
            onChange={e => {
              const v = e.target.value;
              setFilters(f => ({ ...f, isSuspicious: v === "" ? "" : v === "true", page: 1 }));
            }}>
            <option value="">All Types</option>
            <option value="true">Suspicious Only</option>
            <option value="false">Normal Only</option>
          </Select>
          <Select className="w-50" value={filters.action ?? ""}
            onChange={e => setFilters(f => ({ ...f, action: e.target.value as ActivityAction | "", page: 1 }))}>
            <option value="">All Actions</option>
            {ACTION_OPTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
          </Select>
        </div>

        {showForm && (
          <div className="px-4 py-3 border-b border-zinc-800">
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={form.action}
                onChange={e => setForm(f => ({ ...f, action: e.target.value as ActivityAction }))}>
                {ACTION_OPTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
              </Select>

              <input className="input" placeholder="User ID (optional)" value={form.user}
                onChange={e => setForm(f => ({ ...f, user: e.target.value }))} />

              <input className="input" placeholder="Resource ID" value={form.resource}
                onChange={e => setForm(f => ({ ...f, resource: e.target.value }))} />

              <Select value={form.severity}
                onChange={e => setForm(f => ({ ...f, severity: e.target.value as ActivitySeverity }))}>
                {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>

              <label className="inline-flex items-center gap-2 text-xs">
                <input type="checkbox" checked={form.isSuspicious}
                  onChange={e => setForm(f => ({ ...f, isSuspicious: e.target.checked }))} />
                Suspicious
              </label>

              <textarea className="w-full mt-2 textarea" rows={3} placeholder='Meta as JSON, e.g. {"info":"x"}'
                value={form.meta} onChange={e => setForm(f => ({ ...f, meta: e.target.value }))} />

              <div>
                <button className="btn-primary" disabled={createMutation.isPending}
                  onClick={() => {
                    let parsedMeta: any = undefined;
                    if (form.meta) {
                      try { parsedMeta = JSON.parse(form.meta); } catch { alert("Meta must be valid JSON"); return; }
                    }
                    const payload: any = {
                      action: form.action,
                      user: form.user || undefined,
                      resource: form.resource || undefined,
                      resourceType: form.resourceType || undefined,
                      severity: form.severity,
                      isSuspicious: form.isSuspicious,
                      meta: parsedMeta,
                    };
                    createMutation.mutate(payload);
                  }}>
                  {createMutation.isPending ? "Logging..." : "Create Log"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? <Spinner /> : logs.length === 0 ? (
          <Empty message="No activity logs found" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Action</Th>
                <Th>User</Th>
                <Th>IP Address</Th>
                <Th>Severity</Th>
                <Th>Suspicious</Th>
                <Th>Time</Th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l._id}
                  className={`hover:bg-zinc-800/30 transition-colors ${l.isSuspicious ? "bg-red-500/3" : ""}`}>
                  <Td>
                    <code className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                      {l.action.replace(/_/g, " ")}
                    </code>
                  </Td>
                  <Td>
                    {l.user ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={l.user.name} src={l.user.avatar?.url} size={22} />
                        <div>
                          <p className="text-zinc-300 text-xs font-medium">{l.user.name}</p>
                          <p className="text-zinc-600 text-[10px]">{l.user.role}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-600">Unknown</span>
                    )}
                  </Td>
                  <Td>
                    <code className="text-xs text-zinc-500">{l.ip ?? "—"}</code>
                  </Td>
                  <Td><Badge color={l.severity}>{l.severity}</Badge></Td>
                  <Td>
                    {l.isSuspicious ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">
                        <AlertTriangle size={11} /> YES
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-600">No</span>
                    )}
                  </Td>
                  <Td className="text-xs text-zinc-500 whitespace-nowrap">
                    {formatDate(l.createdAt, "MMM dd, HH:mm")}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <Pagination
          page={filters.page ?? 1}
          total={total}
          limit={filters.limit ?? 50}
          onChange={p => setFilters(f => ({ ...f, page: p }))}
        />
      </Card>
    </Layout>
  );
}
