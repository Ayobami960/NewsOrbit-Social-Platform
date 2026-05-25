"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ArticleCard, ArticleSkeleton, SectionHeader, EmptyState, Pagination } from "@/components/shared";
import { useArticles } from "@/hooks/useArticles";
import { useCategories } from "@/hooks/useData";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "-publishedAt", label: "Newest" },
  { value: "-views",       label: "Most Read" },
  { value: "-likes",       label: "Most Liked" },
];

function NewsContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [page,        setPage]        = useState(1);
  const [sort,        setSort]        = useState("-publishedAt");
  const [inputVal,    setInputVal]    = useState(searchParams.get("search") ?? "");
  const [search,      setSearch]      = useState(searchParams.get("search") ?? "");
  const [category,    setCategory]    = useState(searchParams.get("category") ?? "");
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories = [] } = useCategories();

  const { data, isLoading } = useArticles({
    page,
    limit: 12,
    status: "published",
    sort,
    search:   search   || undefined,
    category: category || undefined,
  });

  const articles   = data?.articles   ?? [];
  const pagination = data?.pagination;

  // Sync URL → state
  useEffect(() => {
    setSearch(searchParams.get("search")   ?? "");
    setCategory(searchParams.get("category") ?? "");
    setInputVal(searchParams.get("search")   ?? "");
    setPage(1);
  }, [searchParams]);

  const updateParams = (s: string, c: string) => {
    const p = new URLSearchParams();
    if (s) p.set("search",   s);
    if (c) p.set("category", c);
    router.push(`/news?${p.toString()}`);
  };

  const activeCategory = categories.find(c => c.slug === category);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-ink-900 mb-2">
          {activeCategory ? activeCategory.name : search ? `"${search}"` : "All News"}
        </h1>
        <p className="text-ink-600 font-body text-sm">
          {pagination
            ? `${pagination.total.toLocaleString()} ${pagination.total === 1 ? "story" : "stories"}`
            : ""}
          {activeCategory ? ` in ${activeCategory.name}` : ""}
          {search ? ` matching "${search}"` : ""}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-lg">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && updateParams(inputVal, category)}
            placeholder="Search news, topics, writers…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[var(--color-border)] bg-white text-ink-900 font-sans text-sm outline-none focus:ring-2 focus:ring-ember-600/25 focus:border-ember-600 transition-all"
          />
          {inputVal && (
            <button onClick={() => { setInputVal(""); updateParams("", category); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700">
              <X size={13} />
            </button>
          )}
        </div>

        <button onClick={() => updateParams(inputVal, category)}
          className="px-5 py-2.5 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold text-sm rounded-xl transition-colors">
          Search
        </button>

        <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-white text-ink-700 font-sans text-sm outline-none focus:border-ember-600 cursor-pointer">
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <button onClick={() => setShowFilters(o => !o)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl border font-sans text-sm transition-colors",
            showFilters
              ? "bg-ember-50 border-ember-200 text-ember-700"
              : "border-[var(--color-border)] text-ink-700 hover:bg-ink-50"
          )}>
          <SlidersHorizontal size={14} /> Topics
        </button>
      </div>

      {/* Active filters */}
      {(activeCategory || search) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeCategory && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-ink-900 text-white text-xs font-sans font-medium">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: activeCategory.color }} />
              {activeCategory.name}
              <button onClick={() => updateParams(search, "")} className="ml-1 hover:opacity-70">
                <X size={10} />
              </button>
            </span>
          )}
          {search && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-ink-900 text-white text-xs font-sans font-medium">
              Search: {search}
              <button onClick={() => updateParams("", category)} className="ml-1 hover:opacity-70">
                <X size={10} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Category chips */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-6 p-4 bg-white border border-[var(--color-border)] rounded-xl">
          <button
            onClick={() => updateParams(search, "")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-sans font-medium border transition-colors",
              !category ? "bg-ink-900 text-white border-ink-900" : "border-[var(--color-border)] text-ink-600 hover:border-ink-400"
            )}>
            All Topics
          </button>
          {categories.map(cat => (
            <button key={cat._id}
              onClick={() => updateParams(search, cat.slug)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-sans font-medium border transition-colors",
                category === cat.slug ? "text-white border-transparent" : "border-[var(--color-border)] text-ink-600 hover:border-ink-400"
              )}
              style={category === cat.slug ? { background: cat.color, borderColor: cat.color } : {}}>
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Articles */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 9 }).map((_, i) => <ArticleSkeleton key={i} />)}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState icon="🔍" title="No stories found"
          description="Try adjusting your search or browse a different category." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map(a => <ArticleCard key={a._id} article={a} />)}
          </div>
          {pagination && (
            <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total}
              onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          )}
        </>
      )}
    </div>
  );
}

export default function NewsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="skeleton h-10 w-64 mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, i) => <ArticleSkeleton key={i} />)}
            </div>
          </div>
        }>
          <NewsContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
