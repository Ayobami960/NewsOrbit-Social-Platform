"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { EmptyState } from "@/components/shared";
import { useAuth } from "@/context/AuthContext";
import { useMyBlogs, useDeleteBlog } from "@/hooks/useData";
import { formatDate, formatNumber } from "@/lib/utils";
import {
  PenLine, Plus, Trash2, Eye, Heart,
  Clock, Edit3, BookOpen, AlertTriangle,
} from "lucide-react";

// ─── Confirm Delete Modal ────────────────────────────────────────────────────

function DeleteModal({
  title,
  onConfirm,
  onCancel,
  isPending,
}: {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-ink-950/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-(--color-border) shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-display font-bold text-ink-900 text-lg">Delete Blog</h3>
            <p className="text-sm font-sans text-ink-500">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm font-body text-ink-700 mb-6 leading-relaxed">
          Are you sure you want to delete{" "}
          <strong className="font-semibold">"{title}"</strong>? The post and its
          cover image will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 py-2.5 border border-(--color-border) rounded-xl text-sm font-sans font-semibold text-ink-700 hover:bg-ink-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-sans font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 size={14} /> Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Blog Row Card ────────────────────────────────────────────────────────────

function BlogRow({
  blog,
  onDelete,
}: {
  blog: any;
  onDelete: (id: string, title: string) => void;
}) {
  return (
    <div className="group bg-white border border-(--color-border) rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200">
      <div className="flex items-stretch gap-0">
        {/* Cover thumbnail */}
        {blog.featuredImage?.url ? (
          <div className="shrink-0 w-28 sm:w-36 overflow-hidden">
            <img
              src={blog.featuredImage.url}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="shrink-0 w-28 sm:w-36 bg-linear-to-br from-ink-100 to-ink-200 flex items-center justify-center">
            <BookOpen size={24} className="text-ink-300" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-4 sm:p-5 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display font-bold text-ink-900 text-base leading-snug line-clamp-1 mb-1">
                {blog.title}
              </h3>
              {blog.excerpt && (
                <p className="text-sm font-body text-ink-500 line-clamp-1 mb-2">
                  {blog.excerpt}
                </p>
              )}

              {/* Tags */}
              {blog.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {blog.tags.slice(0, 3).map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-ink-100 text-ink-500 text-[10px] font-sans font-medium rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs font-sans text-ink-400">
                <span className="flex items-center gap-1">
                  <Eye size={11} />
                  {formatNumber(blog.views ?? 0)}
                </span>
                <span className="flex items-center gap-1">
                  <Heart size={11} />
                  {formatNumber(blog.likes ?? 0)}
                </span>
                {/* <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {blog.readTime ?? 1} min read
                </span> */}
                <span className="hidden sm:inline text-ink-300">
                  {formatDate(blog.createdAt, "MMM d, yyyy")}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                href={`/blogs/${blog.slug}`}
                className="p-2 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-50 transition-colors"
                title="View"
              >
                <Eye size={15} />
              </Link>
              <Link
                href={`/blogs/edit/${blog._id}`}
                className="p-2 rounded-lg text-ink-400 hover:text-ember-600 hover:bg-ember-50 transition-colors"
                title="Edit"
              >
                <Edit3 size={15} />
              </Link>
              <button
                type="button"
                onClick={() => onDelete(blog._id, blog.title)}
                className="p-2 rounded-lg text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MyBlogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const { data, isLoading } = useMyBlogs();
  const deleteMut = useDeleteBlog();

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const blogs = data?.blogs ?? [];

  const handleDeleteRequest = (id: string, title: string) =>
    setDeleteTarget({ id, title });

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteMut.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-6 py-10">
            <div className="skeleton h-8 w-48 mb-8 rounded" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-28 rounded-2xl" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

            {/* Header */}
            <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-ember-600/10 border border-ember-600/20 rounded-xl flex items-center justify-center">
                  <PenLine size={18} className="text-ember-600" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-ink-900">
                    My Blogs
                  </h1>
                  <p className="text-sm font-sans text-ink-500">
                    {blogs.length} {blogs.length === 1 ? "post" : "posts"} published
                  </p>
                </div>
              </div>

              <Link
                href="/blogs/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold text-sm rounded-xl transition-colors"
              >
                <Plus size={15} /> New Blog
              </Link>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-28 rounded-2xl" />
                ))}
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-ink-100 rounded-2xl mb-4">
                  <PenLine size={24} className="text-ink-400" />
                </div>
                <h3 className="font-display font-bold text-ink-900 text-xl mb-2">
                  No blogs yet
                </h3>
                <p className="text-ink-500 font-body text-sm mb-6">
                  Share your story with the Osun community.
                </p>
                <Link
                  href="/blogs/create"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold text-sm rounded-xl transition-colors"
                >
                  <Plus size={15} /> Write your first blog
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {blogs.map((blog: any) => (
                  <BlogRow
                    key={blog._id}
                    blog={blog}
                    onDelete={handleDeleteRequest}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          title={deleteTarget.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isPending={deleteMut.isPending}
        />
      )}
    </>
  );
}