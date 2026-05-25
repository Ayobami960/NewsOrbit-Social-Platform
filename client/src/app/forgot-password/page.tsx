"use client";

import { useState } from "react";
import Link from "next/link";
import { Radio, ArrowLeft, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import toast from "react-hot-toast";

type Step = "email" | "code" | "done";

export default function ForgotPasswordPage() {
  const [step,     setStep]     = useState<Step>("email");
  const [email,    setEmail]    = useState("");
  const [code,     setCode]     = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/auth/forgot-password", { method: "POST", body: { email } });
      toast.success("Reset code sent! Check your email.");
      setStep("code");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send code.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords do not match."); return; }
    if (password.length < 8)  { toast.error("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: { email, code, password, confirmPassword: confirm },
      });
      setStep("done");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 justify-center mb-4">
            <div className="w-10 h-10 bg-ember-600 rounded-lg flex items-center justify-center">
              <Radio size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-ink-900">
              Osun<span className="text-ember-600">Gist</span>
            </span>
          </Link>
        </div>

        {step === "done" ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h2 className="font-display text-2xl font-bold text-ink-900 mb-2">Password reset!</h2>
            <p className="text-ink-600 font-body mb-6">Your password has been updated successfully.</p>
            <Link href="/login"
              className="px-6 py-3 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold rounded-xl transition-colors">
              Sign In Now
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
            {step === "email" ? (
              <>
                <h1 className="font-display text-xl font-bold text-ink-900 mb-1">Forgot password?</h1>
                <p className="text-sm text-ink-500 font-sans mb-5">
                  Enter your email and we'll send you a 6-digit reset code.
                </p>
                <form onSubmit={sendCode} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                      Email Address
                    </label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-ink-900 font-sans text-sm placeholder:text-ink-400 outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/20 transition-all" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-2.5 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                      : "Send Reset Code"
                    }
                  </button>
                </form>
              </>
            ) : (
              <>
                <h1 className="font-display text-xl font-bold text-ink-900 mb-1">Reset your password</h1>
                <p className="text-sm text-ink-500 font-sans mb-5">
                  Enter the 6-digit code sent to <strong>{email}</strong> and choose a new password.
                </p>
                <form onSubmit={resetPassword} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                      Verification Code
                    </label>
                    <input type="text" required maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-ink-900 font-sans text-sm text-center tracking-[0.5em] placeholder:tracking-normal placeholder:text-ink-400 outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                      New Password
                    </label>
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                      className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-ink-900 font-sans text-sm placeholder:text-ink-400 outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                      Confirm Password
                    </label>
                    <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-ink-900 font-sans text-sm placeholder:text-ink-400 outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/20 transition-all" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-2.5 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Resetting…</>
                      : "Reset Password"
                    }
                  </button>
                  <button type="button" onClick={() => setStep("email")}
                    className="w-full text-sm font-sans text-ink-500 hover:text-ink-800 transition-colors flex items-center justify-center gap-1">
                    <ArrowLeft size={13} /> Use a different email
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        <p className="text-center text-sm font-sans text-ink-500 mt-5">
          Remember your password?{" "}
          <Link href="/login" className="text-ember-600 hover:text-ember-700 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
