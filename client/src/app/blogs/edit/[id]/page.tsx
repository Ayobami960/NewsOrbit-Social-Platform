"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useBlog, useUpdateBlog } from "@/hooks/useData";
import { cn } from "@/lib/utils";
import {
  Image as ImageIcon, X, Tag, Eye,
  Send, ArrowLeft, Lightbulb,
} from "lucide-react";
import Link from "next/link";

const TiptapEditor = dynamic(() => import("@/components/ui/Tiptapeditor"), {
  ssr: false,
  loading: () => (
    <div
      className="border bor(--color-border)rounded-xl bg-white"
      style={{ minHeight: 400 }}
    >
      <div className="h-12 border-b bor(--color-border)bg-ink-50 skeleton" />
      <div className="p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="skeleton h-4 rounded"
            style={{ width: `${60 + (i % 4) * 10}%` }}
          />
        ))}
      </div>
    </div>
  ),
});

export default function EditBlogPage() {
  const { id }= useParams<{ id: string }>();
  const { user, loading: authLoading }  = useAuth();
  const router  = useRouter();
  const updateMut  = useUpdateBlog();

  const { data: blog, isLoading } = useBlog(id ?? "");

  const [title,    setTitle]    = useState("");
  const [excerpt,  setExcerpt]  = useState("");
  const [content,  setContent]  = useState("");
  const [tags,     setTags]     = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [coverFile,    setCoverFile]    = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [preview,      setPreview]      = useState(false);
  const [hydrated,     setHydrated]     = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // Populate form once blog data loads
  useEffect(() => {
    if (blog && !hydrated) {
      setTitle(blog.title ?? "");
      setExcerpt(blog.excerpt ?? "");
      setContent(blog.content ?? "");
      setTags(blog.tags ?? []);
      if (blog.featuredImage?.url) setCoverPreview(blog.featuredImage.url);
      setHydrated(true);
    }
  }, [blog, hydrated]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!tag || tags.includes(tag) || tags.length >= 5) return;
    setTags((t) => [...t, tag]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags((t) => t.filter((x) => x !== tag));

  const isValid =
    title.trim().length >= 5 &&
    content.replace(/<[^>]*>/g, "").trim().length >= 50;

  const handleSave = async () => {
    if (!isValid || !blog) return;

    const fd = new FormData();
    fd.append("title",   title.trim());
    fd.append("excerpt", excerpt.trim());
    fd.append("content", content);
    tags.forEach((t) => fd.append("tags[]", t));
    if (coverFile) fd.append("featuredImage", coverFile);

    try {
      const updated = await updateMut.mutateAsync({ id: blog._id, data: fd });
      router.push(`/blogs/${updated.slug}`);
    } catch {
      // Error handled inside mutation
    }
  };

  // ── Loading states ─────────────────────────────────────────────────────────

  if (authLoading || !user || isLoading || !hydrated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full">
          <div className="skeleton h-8 w-48 mb-6 rounded" />
          <div className="skeleton h-72 rounded-2xl mb-5" />
          <div className="skeleton h-12 rounded-xl mb-4" />
          <div className="skeleton h-96 rounded-xl" />
        </main>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center py-16">
            <p className="text-ink-400 font-body mb-4">Blog post not found.</p>
            <Link href="/blogs/mine"
              className="text-sm font-sans text-ember-600 hover:underline">
              ← Back to My Blogs
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-(--color-bg)">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
            <Link
              href="/blogs/mine"
              className="inline-flex items-center gap-1.5 text-sm font-sans text-ink-500 hover:text-ink-900 transition-colors"
            >
              <ArrowLeft size={14} /> My Blogs
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreview((p) => !p)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl border font-sans font-semibold text-sm transition-all",
                  preview
                    ? "bg-ink-900 text-white border-ink-900"
                    : "border-(--color-border) text-ink-600 hover:bg-ink-50"
                )}
              >
                <Eye size={14} /> {preview ? "Edit" : "Preview"}
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={!isValid || updateMut.isPending}
                className="flex items-center gap-2 px-5 py-2 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold text-sm rounded-xl transition-colors disabled:opacity-50"
              >
                {updateMut.isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Send size={14} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Tip banner ── */}
          <div className="mb-5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-sm font-sans text-amber-800">
            <Lightbulb size={14} className="shrink-0 text-amber-500" />
            Changes will be published immediately and visible to everyone.
          </div>

          {/* ── Preview mode ── */}
          {preview ? (
            <div className="bg-white border border-(--color-border) rounded-2xl overflow-hidden">
              {coverPreview && (
                <img src={coverPreview} alt="cover" className="w-full max-h-72 object-cover" />
              )}
              <div className="p-8">
                <h1 className="font-display text-4xl font-bold text-ink-900 mb-4 leading-tight">
                  {title || <em className="text-ink-300">Untitled</em>}
                </h1>
                {excerpt && (
                  <p className="text-lg text-ink-600 font-body italic border-l-4 border-ember-600 pl-4 mb-6">
                    {excerpt}
                  </p>
                )}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {tags.map((tag) => (
                      <span key={tag}
                        className="px-3 py-1 bg-ink-100 text-ink-600 text-xs font-sans font-medium rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <div
                  className="prose-article text-ink-800 font-body text-[17px] leading-[1.85]"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </div>
          ) : (
            /* ── Edit mode ── */
            <div className="space-y-5">

              {/* Cover image */}
              <div
                className={cn(
                  "relative rounded-2xl overflow-hidden border-2 border-dashed transition-all cursor-pointer group",
                  coverPreview
                    ? "border-transparent"
                    : "border-(--color-border) hover:border-ember-400 bg-white"
                )}
                onClick={() => fileRef.current?.click()}
              >
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="cover" className="w-full max-h-72 object-cover" />
                    <div className="absolute inset-0 bg-ink-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button type="button"
                        onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                        className="px-4 py-2 bg-white text-ink-900 font-sans font-semibold text-sm rounded-lg">
                        Change cover
                      </button>
                      <button type="button"
                        onClick={(e) => { e.stopPropagation(); setCoverFile(null); setCoverPreview(null); }}
                        className="px-4 py-2 bg-ember-600 text-white font-sans font-semibold text-sm rounded-lg">
                        Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <div className="w-12 h-12 rounded-xl bg-ink-100 flex items-center justify-center mb-1">
                      <ImageIcon size={22} className="text-ink-400" />
                    </div>
                    <p className="font-sans font-semibold text-ink-700 text-sm">Add a cover image</p>
                    <p className="font-sans text-ink-400 text-xs">JPEG, PNG, WebP — max 5 MB</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                  hidden onChange={handleCoverChange} />
              </div>

              {/* Title */}
              <div>
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 200))}
                  placeholder="Blog title…"
                  rows={2}
                  className="w-full font-display text-3xl font-bold text-ink-900 placeholder:text-ink-300 bg-transparent border-none outline-none resize-none"
                  style={{ lineHeight: 1.2 }}
                />
                <div className="flex items-center justify-between mt-1">
                  <div className="flex-1 h-px bg-(--color-border)" />
                  <span className="ml-3 text-[11px] font-sans text-ink-400">{title.length}/200</span>
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-2">
                  Excerpt
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value.slice(0, 400))}
                  placeholder="A brief summary shown in listings…"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-(--color-border) bg-white text-ink-900 font-body text-sm placeholder:text-ink-400 outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/20 resize-none transition-all"
                />
                <p className="text-right text-[11px] font-sans text-ink-400 mt-1">{excerpt.length}/400</p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-2">
                  Tags <span className="normal-case font-normal text-ink-400">(up to 5)</span>
                </label>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag) => (
                      <span key={tag}
                        className="flex items-center gap-1.5 px-3 py-1 bg-ink-900 text-white text-xs font-sans font-medium rounded-full">
                        #{tag}
                        <button type="button" onClick={() => removeTag(tag)}
                          className="hover:text-red-400 transition-colors">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <div className="relative flex-1 max-w-xs">
                    <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value.toLowerCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
                      }}
                      placeholder="e.g. osun, politics"
                      maxLength={30}
                      disabled={tags.length >= 5}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-(--color-border) bg-white text-ink-900 font-sans text-sm placeholder:text-ink-400 outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/20 transition-all disabled:opacity-50"
                    />
                  </div>
                  <button type="button" onClick={addTag}
                    disabled={!tagInput.trim() || tags.length >= 5}
                    className="px-4 py-2 border border-(--color-border) rounded-xl text-sm font-sans font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-40 transition-colors">
                    Add
                  </button>
                </div>
              </div>

              {/* Rich text editor */}
              <div>
                <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-2">
                  Content <span className="text-ember-600">*</span>
                  <span className="ml-2 normal-case font-normal text-ink-400">(min 50 characters)</span>
                </label>
                {/* Key forces TiptapEditor to re-mount with pre-filled content */}
                <TiptapEditor
                  key={blog._id}
                  content={content}
                  onChange={setContent}
                  placeholder="Tell your story…"
                  minHeight={480}
                />
              </div>

              {/* Bottom save bar */}
              <div className="flex items-center justify-between pt-2 border-t border-(--color-border)">
                <p className="text-xs font-sans text-ink-400">
                  {isValid ? (
                    <span className="text-emerald-600 font-medium">✓ Ready to save</span>
                  ) : (
                    "Fill in title (5+ chars) and content (50+ chars)"
                  )}
                </p>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!isValid || updateMut.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold text-sm rounded-xl transition-colors disabled:opacity-50"
                >
                  {updateMut.isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}