"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ArticleCard, ArticleSkeleton, EmptyState } from "@/components/shared";
import { useWriterProfile, useFollowStatus, useFollow, useUnfollow } from "@/hooks/useData";
import { useArticles } from "@/hooks/useArticles";
import { useAuth } from "@/context/AuthContext";
import { formatNumber, getInitials, formatDate, cn } from "@/lib/utils";
import { UserPlus, UserMinus, Newspaper, Eye, Users, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { BsInstagram, BsTwitter } from "react-icons/bs";
import { FaFacebook } from "react-icons/fa6";

export default function WriterProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoggedIn } = useAuth();
  const { error } = useToast();
  const router = useRouter();
  const [page, setPage] = useState(1);

  // Auth guard — redirect unauthenticated users to login
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoggedIn, router]);

  const { data: writer, isLoading: writerLoading } = useWriterProfile(id ?? "");
  const { data: followData } = useFollowStatus(id ?? "", isLoggedIn && id !== user?._id);
  const { data: articles, isLoading: articlesLoading } = useArticles({
    author: id,
    limit: 9,
    page,
    status: "published",
  });

  const followMut = useFollow();
  const unfollowMut = useUnfollow();

  const isFollowing  = followData?.isFollowing ?? false;
  const isOwnProfile = user?._id === id;

  const handleFollowToggle = () => {
    if (!isLoggedIn) { error("Sign in required", "Sign in to follow writers."); return; }
    if (isFollowing) unfollowMut.mutate(id!);
    else followMut.mutate(id!);
  };

  // Don't render anything while redirecting unauthenticated users
  if (!isLoggedIn) return null;

  if (writerLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="skeleton h-40 w-full rounded-2xl mb-6" />
            <div className="grid grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <ArticleSkeleton key={i} />)}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!writer) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <EmptyState icon="👤" title="Writer not found" />
        </main>
        <Footer />
      </div>
    );
  }

  const articlesData = articles?.articles   ?? [];
  const pagination = articles?.pagination;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

          <Link
            href="/writers"
            className="inline-flex items-center gap-1.5 text-sm font-sans text-ink-500 hover:text-ink-900 transition-colors mb-6"
          >
            <ArrowLeft size={14} /> All Writers
          </Link>

          {/* Profile card */}
          <div className="bg-white border border-(--color-border) rounded-2xl overflow-hidden mb-8">
            <div className="h-28 bg-linear-to-r from-ember-900 via-ink-900 to-ink-800" />
            <div className="px-6 pb-6">
              <div className="flex items-end justify-between -mt-10 mb-4">
                <div className="relative">
                  {writer.avatar?.url ? (
                    <img
                      src={writer.avatar.url}
                      alt={writer.name}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-white"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-linear-to-br from-ember-500 to-ember-700 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white">
                      {getInitials(writer.name)}
                    </div>
                  )}
                  {writer.isVerified && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-ember-600 rounded-full flex items-center justify-center border-2 border-white">
                      <span className="text-white text-[10px] font-bold">✓</span>
                    </div>
                  )}
                </div>

                {!isOwnProfile && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={followMut.isPending || unfollowMut.isPending}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2 rounded-xl font-sans font-semibold text-sm border transition-all",
                      isFollowing
                        ? "border-ink-300 text-ink-600 hover:border-ember-300 hover:text-ember-600 hover:bg-ember-50"
                        : "bg-ember-600 hover:bg-ember-700 text-white border-ember-600"
                    )}
                  >
                    {isFollowing
                      ? <><UserMinus size={14} /> Following</>
                      : <><UserPlus  size={14} /> Follow</>
                    }
                  </button>
                )}
              </div>

              <h1 className="font-display text-2xl font-bold text-ink-900 mb-0.5">{writer.name}</h1>
              <p className="text-sm font-sans text-ember-600 font-medium capitalize mb-3">{writer.role}</p>

              {writer.bio && (
                <p className="text-ink-600 font-body text-sm leading-relaxed mb-4 max-w-lg">{writer.bio}</p>
              )}

              {writer.socialLinks && (
                <div className="flex items-center gap-3 mb-4">
                  {writer.socialLinks.twitter && (
                    <a
                      href={writer.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-ink-100 hover:bg-ember-100 flex items-center justify-center text-ink-500 hover:text-ember-600 transition-colors"
                    >
                      <BsTwitter size={14} />
                    </a>
                  )}
                  {writer.socialLinks.facebook && (
                    <a
                      href={writer.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-ink-100 hover:bg-ember-100 flex items-center justify-center text-ink-500 hover:text-ember-600 transition-colors"
                    >
                      <FaFacebook size={14} />
                    </a>
                  )}
                  {writer.socialLinks.instagram && (
                    <a
                      href={writer.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-ink-100 hover:bg-ember-100 flex items-center justify-center text-ink-500 hover:text-ember-600 transition-colors"
                    >
                      <BsInstagram size={14} />
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5">
                  <Newspaper size={14} className="text-ink-400" />
                  <span className="font-display font-bold text-ink-900">{formatNumber(writer.stats?.totalArticles ?? 0)}</span>
                  <span className="text-xs font-sans text-ink-500">Articles</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-ink-400" />
                  <span className="font-display font-bold text-ink-900">{formatNumber(writer.followersCount ?? 0)}</span>
                  <span className="text-xs font-sans text-ink-500">Followers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye size={14} className="text-ink-400" />
                  <span className="font-display font-bold text-ink-900">{formatNumber(writer.stats?.totalViews ?? 0)}</span>
                  <span className="text-xs font-sans text-ink-500">Views</span>
                </div>
                <div className="ml-auto text-xs font-sans text-ink-400">
                  Joined {formatDate(writer.createdAt, "MMM yyyy")}
                </div>
              </div>
            </div>
          </div>

          {/* Articles */}
          <h2 className="font-display text-xl font-bold text-ink-900 mb-5">
            Articles by {writer.name}
          </h2>

          {articlesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <ArticleSkeleton key={i} />)}
            </div>
          ) : articlesData.length === 0 ? (
            <EmptyState
              icon="📝"
              title="No articles yet"
              description={`${writer.name} hasn't published any articles yet.`}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {articlesData.map(a => <ArticleCard key={a._id} article={a} />)}
              </div>

              {pagination && pagination.pages > 1 && (
                <div className="flex justify-center gap-3 mt-8">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 text-sm font-sans border border-(--color-border) rounded-xl text-ink-700 hover:bg-ink-50 disabled:opacity-40 transition-colors"
                  >
                    ← Previous
                  </button>
                  <span className="px-4 py-2 text-sm font-sans text-ink-500">
                    {page} / {pagination.pages}
                  </span>
                  <button
                    disabled={page === pagination.pages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 text-sm font-sans border border-(--color-border) rounded-xl text-ink-700 hover:bg-ink-50 disabled:opacity-40 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}