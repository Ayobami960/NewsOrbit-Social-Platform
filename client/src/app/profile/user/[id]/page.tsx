"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { BlogCard, ArticleSkeleton, EmptyState } from "@/components/shared";
import {
  usePublicUserProfile,
  useFollowStatus,
  useFollow,
  useUnfollow,
  useUserBlogs,
} from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import {
  formatNumber,
  formatDate,
  getInitials,
  cn,
} from "@/lib/utils";
import {
  ArrowLeft,
  UserPlus,
  UserMinus,
  BookOpen,
  Eye,
  Users,
  Heart,
  Calendar,
} from "lucide-react";
import { toast } from "react-toastify";
import { BsInstagram, BsTwitter } from "react-icons/bs";
import { FaFacebook } from "react-icons/fa6";

export default function UserProfilePage() {
  const { id }               = useParams<{ id: string }>();
  const { user, isLoggedIn } = useAuth();
  const router               = useRouter();
  const [page, setPage]      = useState(1);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: profile, isLoading: profileLoading } = usePublicUserProfile(id ?? "");

  // Only fetch follow status when logged in and viewing someone else's profile
  const { data: followData } = useFollowStatus(
    id ?? "",
    isLoggedIn && id !== user?._id
  );

  // All blogs by this user (published, paginated)
  const { data: blogsData, isLoading: blogsLoading } = useUserBlogs(id ?? "", page);

  const followMut   = useFollow();
  const unfollowMut = useUnfollow();

  const isFollowing  = followData?.isFollowing ?? false;
  const isOwnProfile = user?._id === id;

  const handleFollowToggle = () => {
    if (!isLoggedIn) {
      toast.error("Sign in to follow this user.");
      router.push("/login");
      return;
    }
    if (isFollowing) unfollowMut.mutate(id!);
    else             followMut.mutate(id!);
  };

  const blogs      = blogsData?.blogs      ?? [];
  const pagination = blogsData?.pagination;

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
            {/* Back */}
            <div className="skeleton h-4 w-24 mb-6 rounded" />
            {/* Banner + avatar */}
            <div className="skeleton h-32 rounded-2xl mb-0" />
            <div className="bg-white border border-(--color-border) rounded-b-2xl px-6 pb-6">
              <div className="flex items-end justify-between -mt-10 mb-5">
                <div className="skeleton w-20 h-20 rounded-full" />
                <div className="skeleton h-9 w-28 rounded-xl" />
              </div>
              <div className="skeleton h-6 w-40 mb-2 rounded" />
              <div className="skeleton h-4 w-64 mb-4 rounded" />
              <div className="flex gap-6">
                <div className="skeleton h-10 w-20 rounded" />
                <div className="skeleton h-10 w-20 rounded" />
                <div className="skeleton h-10 w-20 rounded" />
              </div>
            </div>
            {/* Blog grid */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-(--color-border) rounded-xl overflow-hidden bg-white"
                >
                  <div className="skeleton aspect-video" />
                  <div className="p-4 space-y-2">
                    <div className="skeleton h-3 w-3/4 rounded" />
                    <div className="skeleton h-3 w-full rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <EmptyState
            icon="👤"
            title="User not found"
            description="This profile doesn't exist or has been removed."
            action={
              <Link
                href="/blogs"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-ember-600 text-white font-sans font-semibold text-sm rounded-xl hover:bg-ember-700 transition-colors"
              >
                <ArrowLeft size={14} /> Back to Blogs
              </Link>
            }
          />
        </main>
        <Footer />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-(--color-bg)">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

          {/* ── Back link ── */}
          <Link
            href="/blogs"
            className="inline-flex items-center gap-1.5 text-sm font-sans text-ink-500 hover:text-ink-900 transition-colors mb-6"
          >
            <ArrowLeft size={14} /> All Blogs
          </Link>

          {/* ── Profile card ── */}
          <div className="bg-white border border-(--color-border) rounded-2xl overflow-hidden mb-8 shadow-sm">
            {/* Banner */}
            <div className="h-32 bg-linear-to-r from-ember-900 via-ink-900 to-ink-800 relative">
              {/* Decorative pattern */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)",
                  backgroundSize: "12px 12px",
                }}
              />
            </div>

            <div className="px-6 pb-6">
              {/* Avatar row */}
              <div className="flex items-end justify-between -mt-12 mb-5">
                {/* Avatar */}
                <div className="relative">
                  {profile.avatar?.url ? (
                    <img
                      src={profile.avatar.url}
                      alt={profile.name}
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-linear-to-br from-ember-500 to-ember-700 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white shadow-md">
                      {getInitials(profile.name)}
                    </div>
                  )}
                  {profile.isVerified && (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-ember-600 rounded-full flex items-center justify-center border-2 border-white">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </div>

                {/* Follow / Edit button */}
                {isOwnProfile ? (
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-5 py-2 rounded-xl font-sans font-semibold text-sm border border-(--color-border) text-ink-600 hover:bg-ink-50 transition-colors"
                  >
                    Edit Profile
                  </Link>
                ) : (
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
                    {followMut.isPending || unfollowMut.isPending ? (
                      <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    ) : isFollowing ? (
                      <><UserMinus size={14} /> Following</>
                    ) : (
                      <><UserPlus size={14} /> Follow</>
                    )}
                  </button>
                )}
              </div>

              {/* Name + role */}
              <div className="mb-3">
                <h1 className="font-display text-2xl font-bold text-ink-900 leading-tight">
                  {profile.name}
                </h1>
                <p className="text-sm font-sans text-ember-600 font-medium capitalize mt-0.5">
                  {profile.role?.replace("_", " ") ?? "Community Member"}
                </p>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-ink-600 font-body text-sm leading-relaxed mb-4 max-w-xl">
                  {profile.bio}
                </p>
              )}

              {/* Social links */}
              {(profile.socialLinks?.twitter ||
                profile.socialLinks?.facebook ||
                profile.socialLinks?.instagram) && (
                <div className="flex items-center gap-2 mb-5">
                  {profile.socialLinks.twitter && (
                    <a
                      href={profile.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-ink-100 hover:bg-sky-100 flex items-center justify-center text-ink-500 hover:text-sky-500 transition-colors"
                    >
                      <BsTwitter size={14} />
                    </a>
                  )}
                  {profile.socialLinks.facebook && (
                    <a
                      href={profile.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-ink-100 hover:bg-blue-100 flex items-center justify-center text-ink-500 hover:text-blue-600 transition-colors"
                    >
                      <FaFacebook size={14} />
                    </a>
                  )}
                  {profile.socialLinks.instagram && (
                    <a
                      href={profile.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-ink-100 hover:bg-pink-100 flex items-center justify-center text-ink-500 hover:text-pink-600 transition-colors"
                    >
                      <BsInstagram size={14} />
                    </a>
                  )}
                </div>
              )}

              {/* Stats bar */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4 border-t border-(--color-border)">
                <div className="flex items-center gap-1.5">
                  <BookOpen size={14} className="text-ink-400" />
                  <span className="font-display font-bold text-ink-900 text-sm">
                    {formatNumber(blogsData?.pagination?.total ?? profile.stats?.totalBlogs ?? 0)}
                  </span>
                  <span className="text-xs font-sans text-ink-500">Blogs</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-ink-400" />
                  <span className="font-display font-bold text-ink-900 text-sm">
                    {formatNumber(profile.followersCount ?? 0)}
                  </span>
                  <span className="text-xs font-sans text-ink-500">Followers</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Eye size={14} className="text-ink-400" />
                  <span className="font-display font-bold text-ink-900 text-sm">
                    {formatNumber(profile.stats?.totalViews ?? 0)}
                  </span>
                  <span className="text-xs font-sans text-ink-500">Views</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Heart size={14} className="text-ink-400" />
                  <span className="font-display font-bold text-ink-900 text-sm">
                    {formatNumber(profile.stats?.totalLikes ?? 0)}
                  </span>
                  <span className="text-xs font-sans text-ink-500">Likes</span>
                </div>

                <div className="ml-auto flex items-center gap-1.5 text-xs font-sans text-ink-400">
                  <Calendar size={12} />
                  Joined {formatDate(profile.createdAt, "MMM yyyy")}
                </div>
              </div>
            </div>
          </div>

          {/* ── Blog posts section ── */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-bold text-ink-900">
              {isOwnProfile ? "My Blogs" : `Blogs by ${profile.name}`}
            </h2>
            {blogs.length > 0 && (
              <span className="text-sm font-sans text-ink-400">
                {formatNumber(pagination?.total ?? blogs.length)} post
                {(pagination?.total ?? blogs.length) !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {blogsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-(--color-border) rounded-xl overflow-hidden bg-white"
                >
                  <div className="skeleton aspect-video" />
                  <div className="p-4 space-y-2.5">
                    <div className="skeleton h-3 w-3/4 rounded" />
                    <div className="skeleton h-4 w-full rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <EmptyState
              icon="✍️"
              title="No blogs yet"
              description={
                isOwnProfile
                  ? "You haven't published any blogs yet."
                  : `${profile.name} hasn't published any blogs yet.`
              }
              action={
                isOwnProfile ? (
                  <Link
                    href="/blogs/create"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-ember-600 text-white font-sans font-semibold text-sm rounded-xl hover:bg-ember-700 transition-colors"
                  >
                    Write your first blog
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {blogs.map((blog: any) => (
                  <BlogCard key={blog._id} blog={blog} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    disabled={page === 1}
                    onClick={() => {
                      setPage((p) => p - 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-4 py-2 text-sm font-sans border border-(--color-border) rounded-xl text-ink-700 hover:bg-ink-50 disabled:opacity-40 transition-colors"
                  >
                    ← Previous
                  </button>
                  <span className="px-4 py-2 text-sm font-sans text-ink-500">
                    {page} / {pagination.pages}
                  </span>
                  <button
                    disabled={page === pagination.pages}
                    onClick={() => {
                      setPage((p) => p + 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
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