"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { BlogCard, ArticleSkeleton, SectionHeader, EmptyState, Pagination } from "@/components/shared";
import { useBlogs } from "@/hooks/useData";
import { Search, BookOpen } from "lucide-react";

export default function BlogsPage() {
  const [page, setPage]     = useState(1);
  const [search, setSearch]   = useState("");
  const [inputVal, setInputVal] = useState("");

  const { data, isLoading } = useBlogs({ page, limit: 12, search: search || undefined });

  const blogs = data?.blogs ?? [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-ember-600/10 border border-ember-600/20 rounded-2xl mb-4">
              <BookOpen size={22} className="text-ember-600" />
            </div>
            <h1 className="font-display text-4xl font-bold text-ink-900 mb-2">Community Voices</h1>
            <p className="text-ink-600 font-body max-w-md mx-auto">
              Stories, perspectives, and experiences shared by people from across Osun State.
            </p>
          </div>

          {/* Search */}
          <div className="flex gap-3 max-w-md mx-auto mb-10">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
              <input type="text" value={inputVal} onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === "Enter" && setSearch(inputVal)}
                placeholder="Search community blogs…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-(--color-border) bg-white font-sans text-sm text-ink-900 outline-none focus:ring-2 focus:ring-ember-600/25 focus:border-ember-600" />
            </div>
            <button onClick={() => { setSearch(inputVal); setPage(1); }}
              className="px-5 py-2.5 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold text-sm rounded-xl transition-colors">
              Search
            </button>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, i) => <ArticleSkeleton key={i} />)}
            </div>
          ) : blogs.length === 0 ? (
            <EmptyState icon="✍️" title="No blogs found"
              description={search ? `No blogs match "${search}"` : "No community blogs yet."} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {blogs.map(b => <BlogCard key={b._id} blog={b} />)}
              </div>
              {pagination && (
                <Pagination page={pagination.page} pages={pagination.pages ?? Math.ceil(pagination.total / 12)}
                  total={pagination.total}
                  onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
