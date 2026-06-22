"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { EmptyState } from "@/components/shared";
import { apiFetch } from "@/lib/apiFetch";
import { formatNumber, getInitials } from "@/lib/utils";
import { Search, PenSquare } from "lucide-react";
import type { User } from "@/types";

function useWriters(search: string) {
  return useQuery({
    queryKey: ["writers", "list", search],
    queryFn: () =>
      apiFetch<{ users: User[] }>(
        `/users/writers?limit=24${search ? `&search=${encodeURIComponent(search)}` : ""}`
      ).then(r => r.data),
    staleTime: 120_000,
  });
}

export default function WritersPage() {
  const [search,   setSearch]   = useState("");
  const [inputVal, setInputVal] = useState("");

  const { data, isLoading } = useWriters(search);
  const writers = data?.users ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-ember-600/10 border border-ember-600/20 rounded-2xl mb-4">
              <PenSquare size={22} className="text-ember-600" />
            </div>
            <h1 className="font-display text-4xl font-bold text-ink-900 mb-2">Our Writers</h1>
            <p className="text-ink-600 font-body max-w-md mx-auto">
              Meet the journalists and storytellers bringing you NewOrbit's most important news.
            </p>
          </div>

          <div className="flex gap-3 max-w-md mx-auto mb-10">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
              <input type="text" value={inputVal} onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === "Enter" && setSearch(inputVal)}
                placeholder="Search writers…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-(--color-border) bg-white font-sans text-sm text-ink-900 outline-none focus:ring-2 focus:ring-ember-600/25 focus:border-ember-600" />
            </div>
            <button onClick={() => setSearch(inputVal)}
              className="px-5 py-2.5 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold text-sm rounded-xl transition-colors">
              Search
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="border border-(--color-border) rounded-2xl p-6 bg-white">
                  <div className="skeleton w-20 h-20 rounded-full mx-auto mb-4" />
                  <div className="skeleton h-4 w-32 mx-auto mb-2" />
                  <div className="skeleton h-3 w-24 mx-auto" />
                </div>
              ))}
            </div>
          ) : writers.length === 0 ? (
            <EmptyState icon="✍️" title="No writers found"
              description={search ? `No writers match "${search}"` : "No writers available."} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {writers.map(w => <WriterCard key={w._id} writer={w} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function WriterCard({ writer }: { writer: User }) {
  return (
    <Link href={`/writers/${writer._id}`}
      className="group border border-(--color-border) rounded-2xl p-6 bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center text-center">
      <div className="relative mb-4">
        {writer.avatar?.url ? (
          <img src={writer.avatar.url} alt={writer.name}
            className="w-20 h-20 rounded-full object-cover ring-2 ring-(--color-border) group-hover:ring-ember-600/30 transition-all" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-ember-500 to-ember-700 flex items-center justify-center text-white text-2xl font-bold">
            {getInitials(writer.name)}
          </div>
        )}
        {writer.isVerified && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-ember-600 rounded-full flex items-center justify-center border-2 border-white">
            <span className="text-white text-[10px] font-bold">✓</span>
          </div>
        )}
      </div>
      <h3 className="font-display font-bold text-ink-900 group-hover:text-ember-700 transition-colors mb-1">{writer.name}</h3>
      {writer.bio && <p className="text-xs text-ink-500 font-body line-clamp-2 mb-4 leading-relaxed">{writer.bio}</p>}
      <div className="flex items-center gap-4 mt-auto pt-4 border-t border-(--color-border) w-full justify-center">
        <div className="text-center">
          <p className="font-display font-bold text-ink-900 text-sm">{formatNumber(writer.stats?.totalArticles ?? 0)}</p>
          <p className="text-[10px] font-sans text-ink-500 uppercase tracking-wider">Articles</p>
        </div>
        <div className="w-px h-8 bg-(--color-border)" />
        <div className="text-center">
          <p className="font-display font-bold text-ink-900 text-sm">{formatNumber(writer.followersCount ?? 0)}</p>
          <p className="text-[10px] font-sans text-ink-500 uppercase tracking-wider">Followers</p>
        </div>
      </div>
    </Link>
  );
}
