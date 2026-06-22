"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Radio, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/toast";
 import { ApiError } from "@/lib/apiFetch";


export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const { error } = useToast();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));


const handleSubmit = async (e: any) => {
  e.preventDefault();

  if (form.password !== form.confirmPassword) {
    error("Passwords don't match", "Please try again.");
    return;
  }

  setLoading(true);
  try {
    await register(form.name, form.email, form.password, form.confirmPassword);
    router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
  } catch (err: any) {
    if (err instanceof ApiError && err.errors.length > 0) {
      // Show each field violation as its own toast
      err.errors.forEach(({ field, message: msg }) => {
        const label = field.charAt(0).toUpperCase() + field.slice(1);
        error(`Invalid ${label}`, msg);
      });
    } else {
      error("Registration failed", err?.message ?? "Something went wrong.");
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-bg) px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 justify-center mb-4">
            <div className="w-10 h-10 bg-ember-600 rounded-lg flex items-center justify-center">
              <Radio size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-ink-900">
              News<span className="text-ember-600">Orbit</span>
            </span>
          </Link>
          <h1 className="font-display text-xl font-bold text-ink-900 mb-1">Create account</h1>
          <p className="text-sm text-ink-500 font-sans">Join the NewsOrbit community</p>
        </div>

        <div className="bg-white border border-(--color-border) rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: "name",  label: "Full Name", type: "text",  placeholder: "Your full name" },
              { key: "email", label: "Email",      type: "email", placeholder: "you@example.com" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                  {label}
                </label>
                <input
                  type={type}
                  required
                  value={form[key as keyof typeof form]}
                  onChange={update(key as keyof typeof form)}
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 rounded-xl border bor(--color-border(--color-bg) text-ink-900 font-sans text-sm placeholder:text-ink-400 outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/20 transition-all"
                />
              </div>
            ))}

            <div>
              <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={update("password")}
                  placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                  className="w-full px-3 py-2.5 pr-10 rounded-xl border border-(--color-border) bg-(--color-bg) text-ink-900 font-sans text-sm placeholder:text-ink-400 outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={update("confirmPassword")}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl border border-(--color-border) bg-(--color-bg) text-ink-900 font-sans text-sm placeholder:text-ink-400 outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm font-sans text-ink-500 mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-ember-600 hover:text-ember-700 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}