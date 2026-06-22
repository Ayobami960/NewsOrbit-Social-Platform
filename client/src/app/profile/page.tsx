"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { authFetch } from "@/lib/apiFetch";
import { useMyBlogs, useDeleteBlog } from "@/hooks/useData";
import { getInitials, formatNumber, formatDate } from "@/lib/utils";
import {
  User, Camera, Save, Settings,
  PenLine, BookOpen, Plus, Eye,
  Heart, Clock, Edit3, Trash2,
  AlertTriangle, BarChart2, Users,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { User as UserType } from "@/types";
import { BsInstagram, BsTwitter } from "react-icons/bs";
import { FaFacebook } from "react-icons/fa6";

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "settings", label: "Account Settings", icon: Settings },
  { id: "my-blogs", label: "My Blogs",          icon: BookOpen },
  { id: "write",    label: "Write a Blog",      icon: PenLine  },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({
  title, onConfirm, onCancel, isPending,
}: {
  title: string; onConfirm: () => void; onCancel: () => void; isPending: boolean;
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
          Are you sure you want to permanently delete <strong>"{title}"</strong>?
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} disabled={isPending}
            className="flex-1 py-2.5 border border-(--color-border) rounded-xl text-sm font-sans font-semibold text-ink-700 hover:bg-ink-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={isPending}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-sans font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {isPending
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Deleting…</>
              : <><Trash2 size={14} /> Delete</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── My Blogs tab ─────────────────────────────────────────────────────────────

function MyBlogsTab() {
  const { data, isLoading } = useMyBlogs();
  const deleteMut = useDeleteBlog();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const blogs = data?.blogs ?? [];

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteMut.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-(--color-border) rounded-2xl">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-ink-100 rounded-2xl mb-4">
          <PenLine size={22} className="text-ink-400" />
        </div>
        <h3 className="font-display font-bold text-ink-900 text-lg mb-2">No blogs yet</h3>
        <p className="text-ink-500 font-body text-sm mb-6">Share your story with the Osun community.</p>
        <Link href="/blogs/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold text-sm rounded-xl transition-colors">
          <Plus size={15} /> Write your first blog
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-sans text-ink-500">
          {blogs.length} {blogs.length === 1 ? "post" : "posts"} published
        </p>
        <Link href="/blogs/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold text-sm rounded-xl transition-colors">
          <Plus size={14} /> New Blog
        </Link>
      </div>

      <div className="space-y-3">
        {blogs.map((blog: any) => (
          <div key={blog._id}
            className="group bg-white border border-(--color-border) rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200">
            <div className="flex items-stretch">
              {/* Thumbnail */}
              {blog.featuredImage?.url ? (
                <div className="shrink-0 w-28 sm:w-36 overflow-hidden">
                  <img src={blog.featuredImage.url} alt={blog.title}
                    className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="shrink-0 w-28 sm:w-36 bg-linear-to-br from-ink-100 to-ink-200 flex items-center justify-center">
                  <BookOpen size={22} className="text-ink-300" />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 p-4 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-ink-900 text-sm line-clamp-1 mb-1">
                      {blog.title}
                    </h3>
                    {blog.excerpt && (
                      <p className="text-xs font-body text-ink-400 line-clamp-1 mb-2">
                        {blog.excerpt}
                      </p>
                    )}
                    {/* Tags */}
                    {blog.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {blog.tags.slice(0, 3).map((tag: string) => (
                          <span key={tag}
                            className="px-2 py-0.5 bg-ink-100 text-ink-500 text-[10px] font-sans rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs font-sans text-ink-400">
                      <span className="flex items-center gap-1"><Eye size={11} />{formatNumber(blog.views ?? 0)}</span>
                      <span className="flex items-center gap-1"><Heart size={11} />{formatNumber(blog.likes ?? 0)}</span>
                      <span className="flex items-center gap-1"><Clock size={11} />{blog.readTime ?? 1}m</span>
                      <span className="hidden sm:inline text-ink-300">
                        {formatDate(blog.createdAt, "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/blogs/${blog.slug}`}
                      className="p-2 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-50 transition-colors" title="View">
                      <Eye size={14} />
                    </Link>
                    <Link href={`/blogs/edit/${blog._id}`}
                      className="p-2 rounded-lg text-ink-400 hover:text-ember-600 hover:bg-ember-50 transition-colors" title="Edit">
                      <Edit3 size={14} />
                    </Link>
                    <button type="button" onClick={() => setDeleteTarget({ id: blog._id, title: blog.title })}
                      className="p-2 rounded-lg text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

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

// ─── Write tab ────────────────────────────────────────────────────────────────

function WriteTab() {
  return (
    <div className="bg-white border border-(--color-border) rounded-2xl overflow-hidden">
      {/* Banner */}
      <div className="h-28 bg-linear-to-r from-ember-900 via-ink-900 to-ink-800 relative overflow-hidden flex items-center px-8 gap-5">
        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
          <PenLine size={26} className="text-white" />
        </div>
        <div>
          <h2 className="font-display text-xl font-black text-white leading-tight">
            Write a new blog
          </h2>
          <p className="text-sm font-sans text-ink-300 mt-0.5">
            Share your story with the Osun community
          </p>
        </div>
      </div>

      <div className="p-8">
        {/* Quick tips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: PenLine, title: "Write freely", desc: "No editorial gatekeeping — your voice, your story." },
            { icon: Eye, title: "Instant publish",  desc: "Your blog goes live immediately after posting." },
            { icon: Users, title: "Build a following", desc: "Readers can follow you and get notified of new posts." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center gap-2 p-4 bg-ink-50 rounded-xl border border-(--color-border)">
              <div className="w-9 h-9 rounded-xl bg-ember-600/10 flex items-center justify-center">
                <Icon size={16} className="text-ember-600" />
              </div>
              <p className="font-sans font-bold text-ink-900 text-sm">{title}</p>
              <p className="font-body text-ink-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/blogs/create"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-ember-600 hover:bg-ember-700 text-white font-sans font-bold text-sm rounded-xl transition-colors">
            <Plus size={16} /> Start writing now
          </Link>
          <Link href="/blogs/mine"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 border border-(--color-border) text-ink-700 hover:bg-ink-50 font-sans font-semibold text-sm rounded-xl transition-colors">
            <BookOpen size={16} /> View all my blogs
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Settings tab ─────────────────────────────────────────────────────────────

function SettingsTab({
  user,
  profile,
  setProfile,
  avatarPreview,
  avatarFile,
  setAvatarFile,
  setAvatarPreview,
  savingProfile,
  onSave,
}: {
  user: UserType;
  profile: { name: string; bio: string; twitter: string; facebook: string; instagram: string };
  setProfile: React.Dispatch<React.SetStateAction<any>>;
  avatarPreview: string | null;
  avatarFile: File | null;
  setAvatarFile: (f: File | null) => void;
  setAvatarPreview: (s: string | null) => void;
  savingProfile: boolean;
  onSave: (e: React.FormEvent) => void;
}) {
  const blogCount = user.stats?.totalBlogs ?? user.stats?.totalArticles ?? 0;

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-white text-ink-900 font-sans text-sm placeholder:text-ink-400 outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/20 transition-all";
  const labelCls = "block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* Profile form */}
      <form onSubmit={onSave}>
        <div className="bg-white border border-(--color-border) rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <User size={16} className="text-ink-400" />
            <h2 className="font-display text-lg font-bold text-ink-900">My Profile</h2>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-(--color-border)">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar"
                  className="w-16 h-16 rounded-full object-cover border-2 border-(--color-border)" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-ember-600 flex items-center justify-center text-white text-xl font-bold">
                  {getInitials(user.name)}
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-ember-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-ember-700 transition-colors border-2 border-white">
                <Camera size={11} className="text-white" />
                <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
              </label>
            </div>
            <div>
              <p className="font-sans font-semibold text-ink-900 text-sm">{user.name}</p>
              <p className="text-xs text-ink-500 font-sans">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-ember-600/10 text-ember-600 font-sans capitalize">
                {user.role}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelCls}>Full Name</label>
              <input type="text" value={profile.name}
                onChange={e => setProfile((p: any) => ({ ...p, name: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Bio</label>
              <textarea value={profile.bio}
                onChange={e => setProfile((p: any) => ({ ...p, bio: e.target.value }))}
                placeholder="Tell readers about yourself…" rows={3} maxLength={500}
                className={`${inputCls} resize-none`} />
            </div>

            <p className={labelCls} style={{ marginBottom: 0 }}>Social Links</p>
            {([
              { key: "twitter",   icon: BsTwitter,   placeholder: "https://twitter.com/…" },
              { key: "facebook",  icon: FaFacebook,  placeholder: "https://facebook.com/…" },
              { key: "instagram", icon: BsInstagram, placeholder: "https://instagram.com/…" },
            ] as const).map(({ key, icon: Icon, placeholder }) => (
              <div key={key} className="relative">
                <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                <input type="url" placeholder={placeholder}
                  value={profile[key]}
                  onChange={e => setProfile((p: any) => ({ ...p, [key]: e.target.value }))}
                  className={`${inputCls} pl-9`} />
              </div>
            ))}
          </div>

          <button type="submit" disabled={savingProfile}
            className="w-full mt-5 py-2.5 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {savingProfile
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
              : <><Save size={14} /> Save Profile</>
            }
          </button>
        </div>
      </form>

      {/* Right column */}
      <div className="flex flex-col gap-6">
        {/* Stats card */}
        <div className="bg-white border border-(--color-border) rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-ink-400" />
            <h2 className="font-display text-lg font-bold text-ink-900">Account Stats</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Blogs",         value: String(blogCount), icon: BookOpen },
              { label: "Total Views",   value: String(user.stats?.totalViews ?? 0),    icon: Eye },
              { label: "Followers",     value: String(user.followersCount ?? 0),        icon: Users },
              // { label: "Likes",         value: String(user.stats?.totalLikes ?? 0),    icon: Heart },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-ink-50 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-ember-600/10 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-ember-600" />
                </div>
                <div>
                  <p className="font-display font-black text-ink-900 text-lg leading-none">{value}</p>
                  <p className="text-[11px] font-sans text-ink-400 mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account info */}
        <div className="bg-white border border-(--color-border) rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-ink-400" />
            <h2 className="font-display text-lg font-bold text-ink-900">Account Info</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Email",  value: user.email },
              { label: "Role",   value: user.role.replace("_", " ") },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-(--color-border) last:border-0">
                <span className="text-sm text-ink-500 font-sans">{label}</span>
                <span className="text-sm font-sans font-semibold text-ink-900 capitalize">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, loading: authLoading, setUser } = useAuth();
  const { success, error } = useToast();
  const router = useRouter();

  const [activeTab,    setActiveTab]    = useState<TabId>("settings");
  const [avatarFile,   setAvatarFile]   = useState<File | null>(null);
  const [avatarPreview,setAvatarPreview]= useState<string | null>(null);
  const [savingProfile,setSavingProfile]= useState(false);

  const [profile, setProfile] = useState({
    name: "", bio: "", twitter: "", facebook: "", instagram: "",
  });

  const blogCount = user?.stats?.totalBlogs ?? user?.stats?.totalArticles ?? 0;

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (user) {
      setProfile({
        name:      user.name ?? "",
        bio:       user.bio  ?? "",
        twitter:   user.socialLinks?.twitter   ?? "",
        facebook:  user.socialLinks?.facebook  ?? "",
        instagram: user.socialLinks?.instagram ?? "",
      });
      setAvatarPreview(user.avatar?.url ?? null);
    }
  }, [user, authLoading, router]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const fd = new FormData();
      fd.append("name", profile.name);
      fd.append("bio",  profile.bio);
      fd.append("socialLinks", JSON.stringify({
        twitter:   profile.twitter,
        facebook:  profile.facebook,
        instagram: profile.instagram,
      }));
      if (avatarFile) fd.append("avatar", avatarFile);

      const { data } = await authFetch<{ user: UserType }>("/users/profile", {
        method: "PATCH", body: fd,
      });
      success("Profile updated!", "Your changes have been saved.");
    } catch (err) {
      error("Update failed", err instanceof Error ? err.message : "Please try again")
     
    } finally {
      setSavingProfile(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-6 py-10">
            <div className="skeleton h-8 w-48 mb-4 rounded" />
            <div className="skeleton h-12 w-full rounded-2xl mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="skeleton h-96 rounded-2xl" />
              <div className="skeleton h-64 rounded-2xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-(--color-bg)">
      <Navbar />

      {/* ── Profile header ── */}
      <div className="bg-white border-b border-(--color-border)">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-0">

          {/* User info row */}
          <div className="flex items-center gap-4 mb-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              {avatarPreview ? (
                <img src={avatarPreview} alt={user.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-(--color-border)" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-ember-600 flex items-center justify-center text-white text-xl font-bold">
                  {getInitials(user.name)}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white" title="Online" />
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-black text-ink-900 leading-tight truncate">
                {user.name}
              </h1>
              <p className="text-sm font-sans text-ink-400 truncate">{user.email}</p>
            </div>

            {/* Role badge + quick stats */}
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <span className="px-3 py-1 rounded-full text-[11px] font-sans font-bold bg-ember-600/10 text-ember-600 capitalize border border-ember-600/20">
                {user.role?.replace("_", " ")}
              </span>
              <div className="flex items-center gap-4 text-[12px] font-sans text-ink-500">
                <span className="flex items-center gap-1">
                  <BookOpen size={12} className="text-ink-400" />
                  {blogCount} blogs
                </span>
                <span className="flex items-center gap-1">
                  <Users size={12} className="text-ink-400" />
                  {user.followersCount ?? 0} followers
                </span>
              </div>
            </div>
          </div>

          {/* ── Tab sub-header ── */}
          <div className="flex items-end gap-1 -mb-px">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`
                  group flex items-center gap-2 px-4 py-2.5 rounded-t-xl border-x border-t text-sm font-sans font-semibold
                  transition-all duration-150 select-none
                  ${activeTab === id
                    ? "bg-white border-(--color-border) text-ember-600 border-b-white -mb-px z-10"
                    : "bg-transparent border-transparent text-ink-500 hover:text-ink-900 hover:bg-ink-50"
                  }
                `}
              >
                <Icon
                  size={14}
                  className={activeTab === id ? "text-ember-600" : "text-ink-400 group-hover:text-ink-600"}
                />
                 <span className="hidden sm:inline">{label}</span>
                {/* Badge for write tab */}
                {id === "write" && (
                  <span className="hidden sm:flex ml-1 w-4 h-4 rounded-full bg-ember-600 text-white text-[9px] font-bold items-center justify-center">
                    +
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {activeTab === "settings" && (
            <SettingsTab
              user={user}
              profile={profile}
              setProfile={setProfile}
              avatarPreview={avatarPreview}
              avatarFile={avatarFile}
              setAvatarFile={setAvatarFile}
              setAvatarPreview={setAvatarPreview}
              savingProfile={savingProfile}
              onSave={saveProfile}
            />
          )}
          {activeTab === "my-blogs" && <MyBlogsTab />}
          {activeTab === "write"    && <WriteTab />}
        </div>
      </main>

      <Footer />
    </div>
  );
}