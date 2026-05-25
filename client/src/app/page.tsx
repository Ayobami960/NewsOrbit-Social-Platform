"use client";

import Link from "next/link";
import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  ArticleCardHero, ArticleCard, ArticleCardMd, ArticleSkeleton,
  SectionHeader, CategoryPill, BlogCard,
} from "@/components/shared";
import { useArticles, useBreakingArticles, useFeaturedArticles } from "@/hooks/useArticles";
import { useBlogs, useCategories, useSubscribeNewsletter } from "@/hooks/useData";
import { ArrowRight, Flame, TrendingUp, Rss } from "lucide-react";

export default function HomePage() {
  const { data: featuredData, isLoading: featLoading } = useFeaturedArticles();
  const { data: latestData,   isLoading: latestLoading } = useArticles({ limit: 9, sort: "-publishedAt" });
  const { data: breakingData }  = useBreakingArticles();
  const { data: blogsData }     = useBlogs({ limit: 4 });
  const { data: categories }    = useCategories();
  const subscribeMut            = useSubscribeNewsletter();

  const [email, setEmail] = useState("");

  const featured = featuredData?.articles ?? [];
  const latest   = latestData?.articles   ?? [];
  const breaking = breakingData?.articles ?? [];
  const blogs    = blogsData?.blogs       ?? [];

  const hero    = featured[0];
  const sideTop = featured.slice(1, 3);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) { subscribeMut.mutate({ email }); setEmail(""); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">

        {/* Breaking strip */}
        {breaking.length > 0 && (
          <div className="bg-ink-950 py-3">
            <div className="max-w-7xl mx-auto px-6 flex items-center gap-4">
              <div className="flex items-center gap-2 shrink-0">
                <Flame size={14} className="text-ember-500 animate-pulse" />
                <span className="text-[11px] font-sans font-bold uppercase tracking-widest text-ember-500">Breaking</span>
                <span className="text-ink-700">|</span>
              </div>
              <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
                {breaking.map((a, i) => (
                  <Link key={a._id} href={`/articles/${a.slug}`}
                    className="shrink-0 text-sm text-ink-200 hover:text-red-300 transition-colors font-body">
                    {i > 0 && <span className="text-ink-700 mr-4">•</span>}
                    {a.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {featLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2"><ArticleSkeleton /></div>
              <div className="space-y-4"><ArticleSkeleton /><ArticleSkeleton /></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {hero && <div className="lg:col-span-2"><ArticleCardHero article={hero} /></div>}
              <div className="flex flex-col gap-5">
                {sideTop.map(a => <ArticleCardMd key={a._id} article={a} />)}
                <div className="border border-(--color-border) rounded-xl p-4 bg-white">
                  <p className="text-[11px] font-sans font-bold uppercase tracking-widest text-ink-400 mb-3">Browse Topics</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(categories ?? []).slice(0, 8).map(cat => (
                      <CategoryPill key={cat._id} category={cat} size="xs" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="max-w-7xl mx-auto px-6"><div className="h-px bg-(--color-border)" /></div>

        {/* Latest news */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <SectionHeader
            title="Latest Stories"
            subtitle="Fresh news and reporting from across Osun State"
            action={
              <Link href="/news" className="flex items-center gap-1.5 text-sm font-sans font-semibold text-ember-600 hover:text-ember-700 transition-colors">
                All stories <ArrowRight size={14} />
              </Link>
            }
          />
          {latestLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <ArticleSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {latest.slice(0, 9).map(a => <ArticleCard key={a._id} article={a} />)}
            </div>
          )}
          <div className="text-center mt-8">
            <Link href="/news"
              className="inline-flex items-center gap-2 px-6 py-3 bg-ink-900 hover:bg-ink-800 text-white font-sans font-semibold text-sm rounded-xl transition-colors">
              <TrendingUp size={16} /> Explore All News
            </Link>
          </div>
        </section>

        {/* Newsletter */}
        <section className="bg-ink-100 py-12 border-y border-(--color-border)">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-ember-600/10 border border-ember-600/20 rounded-xl mb-4">
              <Rss size={20} className="text-ember-600" />
            </div>
            <h2 className="font-display text-3xl font-bold text-ink-900 mb-2">Osun news. Every morning.</h2>
            <p className="text-ink-600 font-body mb-6">
              Join thousands of Osun readers who get the top stories delivered daily.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-xl border border-(--color-border) bg-white text-ink-900 font-sans text-sm outline-none focus:ring-2 focus:ring-ember-600/30 focus:border-ember-600" />
              <button type="submit" disabled={subscribeMut.isPending}
                className="px-6 py-3 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold text-sm rounded-xl transition-colors disabled:opacity-60">
                {subscribeMut.isPending ? "Subscribing…" : "Subscribe Free"}
              </button>
            </form>
          </div>
        </section>

        {/* Community blogs */}
        {blogs.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <SectionHeader
              title="Community Voices"
              subtitle="Stories and perspectives written by Osun people"
              action={
                <Link href="/blogs" className="flex items-center gap-1.5 text-sm font-sans font-semibold text-ember-600 hover:text-ember-700 transition-colors">
                  All posts <ArrowRight size={14} />
                </Link>
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {blogs.map(b => <BlogCard key={b._id} blog={b} />)}
            </div>
          </section>
        )}

        {/* Categories grid */}
        {(categories?.length ?? 0) > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-16">
            <SectionHeader title="Explore by Topic" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {(categories ?? []).map(cat => (
                <Link key={cat._id} href={`/news?category=${cat.slug}`}
                  className="flex flex-col items-center justify-center text-center p-4 rounded-xl border border-(--color-border) bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"
                    style={{ background: cat.color + "22", border: `2px solid ${cat.color}44` }}>
                    <span style={{ color: cat.color }} className="text-base">●</span>
                  </div>
                  <span className="text-xs font-sans font-semibold text-ink-700 group-hover:text-ink-900">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>
      {/* <Footer /> */}
    </div>
  );
}
