"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Radio, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/apiFetch";

export default function LoginPage() {
  const { login, isLoggedIn, loading: authLoading } = useAuth();
  const router  = useRouter();
  const { success, error, info } = useToast();
  const redirected = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect already-authenticated users — runs once, no toast race
  useEffect(() => {
    if (authLoading || redirected.current) return;
    if (isLoggedIn) {
      redirected.current = true;
      info("Already signed in", "Taking you back home…");
      router.replace("/");
    }
  }, [authLoading, isLoggedIn]);  

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await login(email, password);
      // Mark redirected so the effect above doesn't fire a second toast
      redirected.current = true;
      success("Welcome back!", "Redirecting you now…");
      router.push("/");
    } catch (err: any) {
    if (err instanceof ApiError && err.errors.length > 0) {
      // Show each field violation as its own toast
      err.errors.forEach(({ field, message: msg }) => {
        const label = field.charAt(0).toUpperCase() + field.slice(1);
        error(`Invalid ${label}`, msg);
      });
    } else {
        error("Login failed", err instanceof Error ? err.message : "Something went wrong.");
    }
  } finally {
    setLoading(false);
  }
  };

  // Don't render the form at all while auth is resolving or redirect is in flight
  if (authLoading || (isLoggedIn && !authLoading)) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-bg) px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 justify-center mb-4">
            <div className="w-10 h-10 bg-ember-600 rounded-lg flex items-center justify-center">
              <Radio size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-ink-900">
              New<span className="text-ember-600">Orbit</span>
            </span>
          </Link>
          <h1 className="font-display text-xl font-bold text-ink-900 mb-1">Sign in</h1>
          <p className="text-sm text-ink-500 font-sans">Welcome back — continue reading</p>
        </div>

        <div className="bg-white border border-(--color-border) rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                Email
              </label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 rounded-xl border border-(--color-border) bg-(--color-bg) text-ink-900 font-sans text-sm placeholder:text-ink-400 outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 rounded-xl border border-(--color-border) bg-(--color-bg) text-ink-900 font-sans text-sm placeholder:text-ink-400 outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/20 transition-all"
                />
                <button
                  type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <Link href="/forgot-password" className="text-xs font-sans text-ember-600 hover:text-ember-700 transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</>
                : "Sign In"
              }
            </button>
          </form>
        </div>

        <p className="text-center text-sm font-sans text-ink-500 mt-5">
          Don't have an account?{" "}
          <Link href="/register" className="text-ember-600 hover:text-ember-700 font-semibold transition-colors">
            Join free
          </Link>
        </p>
      </div>
    </div>
  );
}
