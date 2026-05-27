"use client";

import { useState } from "react";
import Link from "next/link";
import { X,  Users, FileText, Eye } from "lucide-react";
import { useWriterProfile, useFollowStatus, useFollow, useUnfollow } from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import { getInitials, formatNumber, cn } from "@/lib/utils";
import { FaFacebook } from "react-icons/fa6";
import { BsInstagram, BsTwitter } from "react-icons/bs";

interface Props {
  authorId: string;
  onClose:  () => void;
}

export function WriterProfileCard({ authorId, onClose }: Props) {
  const { isLoggedIn, user }        = useAuth();
  const { data: writer, isLoading } = useWriterProfile(authorId);
  const { data: followData }        = useFollowStatus(authorId, isLoggedIn);
  const follow                      = useFollow();
  const unfollow                    = useUnfollow();

  const isOwnProfile = user?._id === authorId;
  const isFollowing  = followData?.isFollowing ?? false;
  const isPending    = follow.isPending || unfollow.isPending;

  const handleFollowToggle = () => {
    if (!isLoggedIn) return;
    isFollowing ? unfollow.mutate(authorId) : follow.mutate(authorId);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-ink-100 hover:bg-ink-200 text-ink-600 transition-colors">
          <X size={14} />
        </button>

        {isLoading ? (
          <div className="p-6 space-y-3">
            <div className="skeleton w-16 h-16 rounded-full mx-auto" />
            <div className="skeleton h-5 w-1/2 mx-auto rounded" />
            <div className="skeleton h-4 w-3/4 mx-auto rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-9 w-full rounded-xl" />
          </div>
        ) : !writer ? (
          <div className="p-8 text-center text-ink-400 font-body text-sm">
            Could not load profile.
          </div>
        ) : (
          <>
            {/* Header band */}
            <div className="h-16 bg-gradient-to-r from-ember-600 to-ember-400" />

            <div className="px-5 pb-5">
              {/* Avatar — overlaps the band */}
              <div className="-mt-8 mb-3 flex items-end justify-between">
                <div className="w-16 h-16 rounded-full ring-4 ring-white overflow-hidden bg-ember-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                  {writer.avatar?.url
                    ? <img src={writer.avatar.url} alt={writer.name} className="w-full h-full object-cover" />
                    : getInitials(writer.name)}
                </div>

                {/* Follow button — only for other users when logged in */}
                {!isOwnProfile && isLoggedIn && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={isPending}
                    className={cn(
                      "px-4 py-1.5 rounded-xl text-sm font-sans font-semibold transition-all disabled:opacity-50",
                      isFollowing
                        ? "bg-ink-100 text-ink-700 hover:bg-red-50 hover:text-red-600 border border-ink-200"
                        : "bg-ember-600 hover:bg-ember-700 text-white"
                    )}>
                    {isPending ? "…" : isFollowing ? "Unfollow" : "Follow"}
                  </button>
                )}
              </div>

              {/* Name */}
              <h3 className="font-display text-lg font-bold text-ink-900 leading-tight">
                {writer.name}
              </h3>

              {/* Verified badge */}
              {writer.isVerified && (
                <span className="inline-block text-[10px] font-sans font-semibold text-ember-600 bg-ember-50 border border-ember-200 px-2 py-0.5 rounded-full mb-2">
                  ✓ Verified
                </span>
              )}

              {/* Bio */}
              {writer.bio && (
                <p className="text-sm text-ink-600 font-body leading-relaxed mb-3 line-clamp-3">
                  {writer.bio}
                </p>
              )}

              {/* Social links */}
              {(writer.socialLinks?.twitter || writer.socialLinks?.facebook || writer.socialLinks?.instagram) && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {writer.socialLinks.twitter && (
                    <a
                      href={`https://twitter.com/${writer.socialLinks.twitter}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-ink-500 hover:text-sky-500 font-sans transition-colors">
                      <BsTwitter size={12} /> @{writer.socialLinks.twitter}
                    </a>
                  )}
                  {writer.socialLinks.instagram && (
                    <a
                      href={`https://instagram.com/${writer.socialLinks.instagram}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-ink-500 hover:text-pink-500 font-sans transition-colors">
                      <BsInstagram size={12} /> @{writer.socialLinks.instagram}
                    </a>
                  )}
                  {writer.socialLinks.facebook && (
                    <a
                      href={writer.socialLinks.facebook}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-ink-500 hover:text-blue-600 font-sans transition-colors">
                      <FaFacebook size={12} /> Facebook
                    </a>
                  )}
                </div>
              )}

              {/* Stats — using exact fields from User.stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  {
                    icon:  Users,
                    label: "Followers",
                    value: writer.stats?.totalFollowers ?? writer.followersCount ?? 0,
                  },
                  {
                    icon:  FileText,
                    label: "Posts",
                    value: (writer.stats?.totalBlogs ?? 0) + (writer.stats?.totalArticles ?? 0),
                  },
                  {
                    icon:  Eye,
                    label: "Views",
                    value: writer.stats?.totalViews ?? 0,
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-ink-50 rounded-xl p-2.5 text-center">
                    <Icon size={13} className="mx-auto mb-1 text-ink-400" />
                    <p className="font-display font-bold text-ink-900 text-sm leading-none">
                      {formatNumber(value)}
                    </p>
                    <p className="text-[10px] text-ink-400 font-sans mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Member since */}
              {writer.createdAt && (
                <p className="text-[11px] text-ink-400 font-sans text-center mb-3">
                  Member since {new Date(writer.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
              )}

              {/* Full profile link */}
              <Link
                href={`/writers/${authorId}`}
                onClick={onClose}
                className="block w-full text-center py-2 rounded-xl border border-[var(--color-border)] text-sm font-sans font-semibold text-ink-700 hover:bg-ink-50 transition-colors">
                View full profile →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}