import { useState, type FormEvent, type ChangeEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { authFetch } from "@/lib/apiFetch";
import Layout from "@/components/layout/Layout";
import { Card, Btn, Input, Textarea, FormGroup, Toggle, Avatar } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/utils";
import { User, Lock, Shield, Camera } from "lucide-react";
import toast from "react-hot-toast";

export default function Settings() {
  const { user, isRole, setUser } = useAuth();

  const [avatarFile,    setAvatarFile]    = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar?.url ?? null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw,      setSavingPw]      = useState(false);

  const [profile, setProfile] = useState({
    name:      user?.name      ?? "",
    bio:       user?.bio       ?? "",
    twitter:   user?.socialLinks?.twitter   ?? "",
    facebook:  user?.socialLinks?.facebook  ?? "",
    instagram: user?.socialLinks?.instagram ?? "",
  });

  const [pw, setPw] = useState({
    currentPassword: "",
    newPassword:     "",
    confirmPassword: "",
  });

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const fd = new FormData();
      fd.append("name", profile.name);
      fd.append("bio",  profile.bio);
      fd.append("socialLinks[twitter]",   profile.twitter);
      fd.append("socialLinks[facebook]",  profile.facebook);
      fd.append("socialLinks[instagram]", profile.instagram);
      if (avatarFile) fd.append("image", avatarFile);

      const { data } = await authFetch<{ user: typeof user }>("/users/me", {
        method: "PATCH", body: fd, isFormData: true,
      });
      if (data && setUser) setUser(data.user as any);
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (pw.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setSavingPw(true);
    try {
      await authFetch("/auth/me/change-password", {
        method: "POST",
        body: { currentPassword: pw.currentPassword, newPassword: pw.newPassword },
      });
      toast.success("Password changed successfully.");
      setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <Layout title="Settings">
      <div className="grid grid-cols-[1fr_1fr] gap-5">

        {/* ── Profile ── */}
        <form onSubmit={saveProfile}>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <User size={16} className="text-zinc-500" />
              <h2 className="font-[Playfair_Display] text-lg font-semibold text-zinc-100">My Profile</h2>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-zinc-800">
              <div className="relative">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar"
                    className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700" />
                ) : (
                  <Avatar name={user?.name ?? "?"} size={64} />
                )}
                <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-700 transition-colors border-2 border-zinc-900">
                  <Camera size={11} className="text-white" />
                  <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                </label>
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">{user?.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{user?.email}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400">
                  {user ? ROLE_LABEL[user.role] : ""}
                </span>
              </div>
            </div>

            <FormGroup label="Full Name">
              <Input value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
            </FormGroup>

            <FormGroup label="Bio">
              <Textarea rows={3} placeholder="Tell readers about yourself…"
                value={profile.bio} maxLength={500}
                onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
            </FormGroup>

            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Social Links</p>
            {([
              { key: "twitter"   as const, label: "Twitter / X URL" },
              { key: "facebook"  as const, label: "Facebook URL" },
              { key: "instagram" as const, label: "Instagram URL" },
            ]).map(({ key, label }) => (
              <FormGroup key={key} label={label}>
                <Input placeholder={`https://…`}
                  value={profile[key]}
                  onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} />
              </FormGroup>
            ))}

            <Btn type="submit" variant="primary" loading={savingProfile} className="w-full justify-center mt-2">
              Save Profile
            </Btn>
          </Card>
        </form>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-5">

          {/* Change password */}
          <form onSubmit={changePassword}>
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Lock size={16} className="text-zinc-500" />
                <h2 className="font-[Playfair_Display] text-lg font-semibold text-zinc-100">Change Password</h2>
              </div>

              <FormGroup label="Current Password">
                <Input type="password" value={pw.currentPassword} placeholder="••••••••"
                  onChange={e => setPw(p => ({ ...p, currentPassword: e.target.value }))} />
              </FormGroup>
              <FormGroup label="New Password">
                <Input type="password" value={pw.newPassword}
                  placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                  onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))} />
              </FormGroup>
              <FormGroup label="Confirm New Password">
                <Input type="password" value={pw.confirmPassword} placeholder="••••••••"
                  onChange={e => setPw(p => ({ ...p, confirmPassword: e.target.value }))} />
              </FormGroup>

              <Btn type="submit" variant="primary" loading={savingPw} className="w-full justify-center mt-2">
                Update Password
              </Btn>
            </Card>
          </form>

          {/* Platform settings — super_admin only */}
          {isRole("super_admin") && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Shield size={16} className="text-zinc-500" />
                <h2 className="font-[Playfair_Display] text-lg font-semibold text-zinc-100">Platform Settings</h2>
              </div>

              {([
                { label: "Auto-approve Comments",  sub: "Skip manual moderation queue" },
                { label: "Allow Guest Comments",   sub: "Non-registered users can comment" },
                { label: "Newsletter Active",       sub: "Send emails to subscribers" },
                { label: "User Blog Posting",       sub: "Allow users to submit blog posts freely" },
                { label: "Push Notifications",      sub: "Enable browser push for all subscribers" },
              ]).map(({ label, sub }) => (
                <div key={label} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                  <div>
                    <p className="text-sm text-zinc-200 font-medium">{label}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>
                  </div>
                  <Toggle on={true} onChange={() => toast("Platform setting update coming soon.")} />
                </div>
              ))}

              <div className="mt-5 p-4 bg-red-500/8 border border-red-500/20 rounded-xl">
                <p className="text-xs text-red-400 font-bold mb-2">⚠ Danger Zone</p>
                <p className="text-xs text-zinc-500 mb-3">
                  These actions are irreversible. Proceed with caution.
                </p>
                <Btn size="sm" variant="danger"
                  onClick={() => toast.error("Maintenance mode disabled in demo.")}>
                  Enable Maintenance Mode
                </Btn>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
