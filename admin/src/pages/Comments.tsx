import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "../lib/apiFetch";
import Layout from "../components/layout/Layout";
import { Card, Table, Th, Td, Badge, Btn, Spinner, Empty, Avatar, Pagination } from "../components/ui";
import type { Comment, CommentStatus } from "../types";
import { timeAgo, truncate } from "../lib/utils";
import { Check, X, AlertTriangle, Newspaper, BookOpen } from "lucide-react";
import toast from "react-hot-toast";

type CommentTab = "all" | "pending" | "approved" | "rejected" | "spam";

const TABS: { key: CommentTab; label: string }[] = [
  { key: "all",      label: "All" },
  { key: "pending",  label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "spam",     label: "Spam" },
];

interface CommentsData {
  comments: Comment[];
  pagination: { page: number; total: number; limit: number };
}

export default function Comments() {
  const qc            = useQueryClient();
  const [tab, setTab] = useState<CommentTab>("all");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ page: String(page), limit: "30" });
  if (tab !== "all") params.set("status", tab);

  // Fetch all comments across articles AND blogs via admin endpoint
  const { data, isLoading } = useQuery({
    queryKey: ["comments", "admin", tab, page],
    queryFn:  () =>
      authFetch<CommentsData>(`/admin/comments?${params}`).then(r => r.data),
    staleTime: 30_000,
  });

  const comments   = data?.comments   ?? [];
  const pagination = data?.pagination;

  const moderateMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CommentStatus }) =>
      authFetch(`/comments/${id}/moderate`, { method: "PATCH", body: { status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", "admin"] });
      toast.success("Comment updated.");
    },
    onError: (e: Error) => toast.error(e.message),
  });}

  return (
    <Layout title="Comments">
      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit mb-5">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-zinc-800 text-zinc-100 shadow"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        {isLoading ? <Spinner /> : comments.length === 0 ? (
          <Empty message={`No ${tab === "all" ? "" : tab} comments`} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Comment</Th>
                <Th>Author</Th>
                <Th>On</Th>
                <Th>Status</Th>
                <Th>Posted</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {comments.map(c => (
                <tr key={c._id} className="hover:bg-zinc-800/20 transition-colors">
                  <Td className="max-w-[300px]">
                    <p className={`text-sm leading-relaxed ${c.isDeleted ? "text-zinc-600 italic" : "text-zinc-300"}`}>
                      {c.isDeleted ? "[deleted]" : truncate(c.body, 120)}
                    </p>
                    {c.reports?.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 mt-1.5">
                        <AlertTriangle size={10}/> {c.reports.length} report{c.reports.length > 1 ? "s" : ""}
                      </span>
                    )}
                    {c.parent && (
                      <span className="block text-[10px] text-zinc-600 mt-1">↳ Reply to comment</span>
                    )}
                  </Td>

                  <Td>
                    <div className="flex items-center gap-2">
                      <Avatar name={c.author?.name ?? "?"} src={c.author?.avatar?.url} size={24} />
                      <span className="text-xs text-zinc-400">{c.author?.name}</span>
                    </div>
                  </Td>

                  <Td>
                    {c.article ? (
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <Newspaper size={11} className="text-red-400" />
                        <span className="truncate max-w-[120px]">{(c.article as any).title ?? "Article"}</span>
                      </span>
                    ) : c.blog ? (
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <BookOpen size={11} className="text-blue-400" />
                        <span className="truncate max-w-[120px]">{(c.blog as any).title ?? "Blog"}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </Td>

                  <Td><Badge color={c.status}>{c.status}</Badge></Td>

                  <Td className="text-xs text-zinc-500 whitespace-nowrap">{timeAgo(c.createdAt)}</Td>

                  <Td>
                    <div className="flex items-center gap-1.5">
                      {c.status !== "approved" && (
                        <Btn size="xs" variant="success"
                          onClick={() => moderateMut.mutate({ id: c._id, status: "approved" })}
                          disabled={moderateMut.isPending}>
                          <Check size={11} />
                        </Btn>
                      )}
                      {c.status !== "rejected" && (
                        <Btn size="xs" variant="danger"
                          onClick={() => moderateMut.mutate({ id: c._id, status: "rejected" })}
                          disabled={moderateMut.isPending}>
                          <X size={11} />
                        </Btn>
                      )}
                      {c.status !== "spam" && (
                        <Btn size="xs"
                          onClick={() => moderateMut.mutate({ id: c._id, status: "spam" })}
                          disabled={moderateMut.isPending}>
                          🚫
                        </Btn>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {pagination && (
          <Pagination
            page={pagination.page}
            total={pagination.total}
            limit={pagination.limit}
            onChange={setPage}
          />
        )}
      </Card>
    </Layout>
  );
}
