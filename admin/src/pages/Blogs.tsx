import { useState } from "react";
import { useAdminBlogs, useAdminDeleteBlog } from "../hooks/useBlogs";
import Layout from "../components/layout/Layout";
import { Spinner, Empty, Pagination, Avatar } from "../components/ui";
import type { Blog } from "../types";
import { formatDate, timeAgo, truncate } from "../lib/utils";
import { Heart, Eye, Search, BookOpen, TrendingUp, Trash2 } from "lucide-react";

export default function Blogs() {
  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading }  = useAdminBlogs({ page, search });
  const { mutate: deleteBlog, isPending: isDeleting } = useAdminDeleteBlog();

  const blogs      = data?.blogs      ?? [];
  const pagination = data?.pagination;

  function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    deleteBlog(id);
  }

  return (
    <Layout title="Community Blogs">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <BookOpen size={18} className="text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Community Blogs</h1>
        </div>
        <p className="text-sm text-zinc-500 ml-13">
          Blogs publish instantly. Remove content that violates community guidelines.
        </p>
      </div>

      {/* ── Info Banner ────────────────────────────────── */}
      <div className="mb-5 px-4 py-3 rounded-xl bg-blue-500/8 border border-blue-500/15 text-sm text-blue-300 flex items-start gap-3">
        <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
          <span className="text-blue-400 text-[11px] font-bold">i</span>
        </div>
        <span className="leading-relaxed">
          All user blogs are published immediately with no approval queue.
          Only remove posts that clearly violate community guidelines.
        </span>
      </div>

      {/* ── Main Card ──────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-700/80 bg-zinc-800/60 text-zinc-100 text-sm placeholder:text-zinc-500 outline-none transition-all focus:border-red-500/60 focus:ring-2 focus:ring-red-500/10 focus:bg-zinc-800"
              placeholder="Search blogs…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex items-center gap-4 sm:ml-auto">
            {pagination && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <TrendingUp size={12} className="text-zinc-600" />
                <span>
                  <span className="text-zinc-300 font-semibold">{pagination.total.toLocaleString()}</span>
                  {" "}total blogs
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Spinner /></div>
        ) : blogs.length === 0 ? (
          <div className="py-20"><Empty message="No community blogs yet" /></div>
        ) : (
          <>
            {/* ── DESKTOP TABLE (md+) ──────────────────── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800/60">
                    {["Blog Post", "Author", "Tags", "Engagement", "Posted", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {blogs.map((b: Blog) => (
                    <tr key={b._id} className="group transition-colors hover:bg-zinc-800/25">

                      {/* Post */}
                      <td className="px-4 py-4 max-w-70">
                        <div className="flex items-start gap-3">
                          {b.featuredImage?.url ? (
                            <img src={b.featuredImage.url} alt="" className="shrink-0 w-14 h-14 object-cover rounded-lg border border-zinc-700/60" />
                          ) : (
                            <div className="shrink-0 w-14 h-14 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center">
                              <BookOpen size={18} className="text-zinc-600" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-zinc-100 font-semibold text-sm leading-snug mb-1 line-clamp-2">{b.title}</p>
                            {b.excerpt && (
                              <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed">{truncate(b.excerpt, 80)}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={b.author?.name ?? "?"} src={b.author?.avatar?.url} size={28} />
                          <span className="text-zinc-300 text-xs font-medium">{b.author?.name}</span>
                        </div>
                      </td>

                      {/* Tags */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1 max-w-30">
                          {(b.tags ?? []).slice(0, 3).map(t => (
                            <span key={t} className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/60 text-zinc-400 text-[10px] font-medium">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Engagement */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                              <Eye size={11} className="text-zinc-500" />{b.views.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                              <Heart size={11} className="text-rose-500/70" />{b.likes}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-600">{b.readTime}m read</p>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <p className="text-xs text-zinc-400 font-medium">{timeAgo(b.createdAt)}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{formatDate(b.createdAt)}</p>
                      </td>

                      {/* Delete */}
                      <td className="px-4 py-4">
                        <button
                          disabled={isDeleting}
                          onClick={() => handleDelete(b._id, b.title)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 hover:border-red-500/40 hover:text-red-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={11} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── MOBILE CARDS (< md) ──────────────────── */}
            <div className="md:hidden divide-y divide-zinc-800/40">
              {blogs.map((b: Blog) => (
                <div key={b._id} className="p-4 hover:bg-zinc-800/20 transition-colors">
                  <div className="flex gap-3">
                    {b.featuredImage?.url ? (
                      <img src={b.featuredImage.url} alt="" className="shrink-0 w-16 h-16 object-cover rounded-xl border border-zinc-700/60" />
                    ) : (
                      <div className="shrink-0 w-16 h-16 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center">
                        <BookOpen size={20} className="text-zinc-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-100 font-semibold text-sm leading-snug line-clamp-2 mb-1">{b.title}</p>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Avatar name={b.author?.name ?? "?"} src={b.author?.avatar?.url} size={16} />
                        <span className="text-zinc-500 text-[11px]">{b.author?.name}</span>
                        <span className="text-zinc-700 text-[11px]">·</span>
                        <span className="text-zinc-600 text-[11px]">{timeAgo(b.createdAt)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(b.tags ?? []).slice(0, 3).map(t => (
                          <span key={t} className="px-1.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/40 text-zinc-500 text-[10px] font-medium">
                            #{t}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                            <Eye size={10} />{b.views.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                            <Heart size={10} className="text-rose-500/60" />{b.likes}
                          </span>
                          <span className="text-[10px] text-zinc-600">{b.readTime}m read</span>
                        </div>
                        <button
                          disabled={isDeleting}
                          onClick={() => handleDelete(b._id, b.title)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-red-400 border border-red-500/20 bg-red-500/8 hover:bg-red-500/20 hover:text-red-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={10} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {pagination && (
          <div className="px-4 py-4 border-t border-zinc-800/60 bg-zinc-900/30">
            <Pagination page={pagination.page} total={pagination.total} limit={pagination.limit} onChange={setPage} />
          </div>
        )}
      </div>
    </Layout>
  );
}