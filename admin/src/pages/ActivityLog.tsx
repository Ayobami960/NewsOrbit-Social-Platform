import { useState } from "react";
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

  return (
    <Layout title="Activity Log">
      <Card>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <Shield size={15} className="text-zinc-600" />
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
