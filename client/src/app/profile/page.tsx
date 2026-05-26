"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { authFetch } from "@/lib/apiFetch";
import { getInitials } from "@/lib/utils";
import { User, Lock, Camera, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import type { User as UserType } from "@/types";
import { BsInstagram, BsTwitter } from "react-icons/bs";
import { FaFacebook } from "react-icons/fa6";


export default function ProfilePage() {
  const { user, loading: authLoading, setUser } = useAuth();
  const router = useRouter();

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  // const [showPw1, setShowPw1] = useState(false);
  // const [showPw2, setShowPw2] = useState(false);
  // const [showPw3, setShowPw3] = useState(false);


  const [profile, setProfile] = useState({
    name: "", bio: "", twitter: "", facebook: "", instagram: "",
  });

  const [pw, setPw] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (user) {
      setProfile({
        name: user.name ?? "",
        bio: user.bio ?? "",
        twitter: user.socialLinks?.twitter ?? "",
        facebook: user.socialLinks?.facebook ?? "",
        instagram: user.socialLinks?.instagram ?? "",
      });
      setAvatarPreview(user.avatar?.url ?? null);
    }
  }, [user, authLoading, router]);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const fd = new FormData();
      fd.append("name", profile.name);
      fd.append("bio", profile.bio);
      fd.append("socialLinks", JSON.stringify({
        twitter: profile.twitter,
        facebook: profile.facebook,
        instagram: profile.instagram,
      }));
      if (avatarFile) fd.append("avatar", avatarFile);

      const { data } = await authFetch<{ user: UserType }>("/users/profile", {
        method: "PATCH",
        body: fd,
      });
      setUser(data.user);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSavingProfile(false);
    }
  };

  // const changePassword = async (e: any) => {
  //   e.preventDefault();
  //   if (pw.newPassword !== pw.confirmPassword) { toast.error("Passwords do not match."); return; }
  //   if (pw.newPassword.length < 8) { toast.error("Password must be at least 8 characters."); return; }
  //   setSavingPw(true);
  //   try {
  //     await authFetch("/auth/reset-password", {
  //       method: "POST",
  //       body: { currentPassword: pw.currentPassword, newPassword: pw.newPassword },
  //     });
  //     toast.success("Password changed!");
  //     setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
  //   } catch (err) {
  //     toast.error(err instanceof Error ? err.message : "Failed.");
  //   } finally {
  //     setSavingPw(false);
  //   }
  // };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-6 py-10">
            <div className="skeleton h-8 w-48 mb-8 rounded" />
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

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-(--color-border) bg-(--color-bg)] tet-ink-900 font-sans text-sm placeholder:text-ink-400 outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/20 transition-all";
  const labelCls = "block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="font-display text-2xl font-bold text-ink-900 mb-8">Account Settings</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile form */}
            <form onSubmit={saveProfile}>
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
                    <input type="text" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Bio</label>
                    <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                      placeholder="Tell readers about yourself…" rows={3} maxLength={500}
                      className={`${inputCls} resize-none`} />
                  </div>

                  <p className={labelCls} style={{ marginBottom: 0 }}>Social Links</p>

                  {[
                    { key: "twitter", icon: BsTwitter, placeholder: "https://twitter.com/…" },
                    { key: "facebook", icon: FaFacebook, placeholder: "https://facebook.com/…" },
                    { key: "instagram", icon: BsInstagram, placeholder: "https://instagram.com/…" },
                  ].map(({ key, icon: Icon, placeholder }) => (
                    <div key={key} className="relative">
                      <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                      <input type="url" placeholder={placeholder}
                        value={profile[key as keyof typeof profile]}
                        onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
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
              {/* Change password */}
              {/* <form onSubmit={changePassword}>
                <div className="bg-white border border-(--color-border) rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Lock size={16} className="text-ink-400" />
                    <h2 className="font-display text-lg font-bold text-ink-900">Change Password</h2>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        key: "currentPassword",
                        label: "Current Password",
                        placeholder: "••••••••",
                        showState: showPw1,
                        setShow: setShowPw1
                      },
                      {
                        key: "newPassword",
                        label: "New Password",
                        placeholder: "Min 8 chars, uppercase, number, special",
                        showState: showPw2,
                        setShow: setShowPw2
                      },
                      {
                        key: "confirmPassword",
                        label: "Confirm Password",
                        placeholder: "••••••••",
                        showState: showPw3,
                        setShow: setShowPw3
                      },
                    ].map(({ key, label, placeholder, showState, setShow }) => (
                      <div key={key}>
                        <label className={labelCls}>{label}</label>

                        <div className="relative">
                          <input
                            type={showState ? "text" : "password"}
                            placeholder={placeholder}
                            value={pw[key as keyof typeof pw]}
                            onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                            className={`${inputCls} pr-12`}
                          />

                          <button
                            type="button"
                            onClick={() => setShow(!showState)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 transition-colors"
                          >
                            {showState ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={savingPw}
                    className="w-full mt-5 py-2.5 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {savingPw ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Updating…
                      </>
                    ) : "Update Password"}
                  </button>
                </div>
              </form> */}

              {/* Account info */}
              <div className="bg-white border border-(--color-border) rounded-2xl p-6">
                <h2 className="font-display text-lg font-bold text-ink-900 mb-4">Account Info</h2>
                <div className="space-y-3">
                  {[
                    { label: "Email", value: user.email },
                    { label: "Role", value: user.role.replace("_", " ") },
                    { label: "Blogs", value: String(user.stats?.totalArticles ?? 0) },
                    { label: "Total Views", value: String(user.stats?.totalViews ?? 0) },
                    { label: "Followers", value: String(user.followersCount ?? 0) },
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
