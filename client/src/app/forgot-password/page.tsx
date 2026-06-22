"use client";

import { useState } from "react";
import Link from "next/link";
import { Radio, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { useToast } from "@/components/ui/toast";

type Step = "email" | "code" | "password" | "success";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode]  = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]= useState("");
  const [loading, setLoading] = useState(false);
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const { success, error } = useToast();

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const sendCode = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: { email },
      })
      success("Reset code sent!", "Check your email.");
      setStep("code");
    } catch (err: any) {
      error("Failed to send code", err.message || "Please try again")
      
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const verifyCode = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/auth/verify-reset-code", {
        method: "POST",
        body: { email, code },
      });
      success("Code verified!", "Now set your new password.");
      setStep("password");
    } catch (err: any) {
      error("Verification failed", err.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset password ──────────────────────────────────────────────────
  const resetPassword = async (e: any) => {
    e.preventDefault();

    // Client-side guard — confirmPassword is frontend-only
    if (password !== confirm) {
      error("Passwords don't match", "Please try again.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: { email, code, password }, // no confirmPassword sent to backend
      });
      success("Password reset!", "You can now sign in with your new password.");
      setStep("success");
    } catch (err: any) {
      error("Reset failed", err.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-bg) px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 justify-center mb-4">
            <div className="w-10 h-10 bg-ember-600 rounded-lg flex items-center justify-center">
              <Radio size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-ink-900">
              News<span className="text-ember-600">Orbit</span>
            </span>
          </Link>
        </div>

        {/* ── Success ── */}
        {step === "success" && (
          <div className="text-center bg-white border border-(--color-border) rounded-2xl p-8 shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h2 className="font-display text-2xl font-bold text-ink-900 mb-2">
              Password Reset Successful
            </h2>
            <p className="text-ink-600 font-body mb-6">
              Your password has been updated. You can now sign in.
            </p>
            <Link
              href="/login"
              className="block w-full py-3 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold rounded-xl transition-colors"
            >
              Sign In Now
            </Link>
          </div>
        )}

        {/* ── Steps ── */}
        {step !== "success" && (
          <div className="bg-white border border-(--color-border) rounded-2xl p-6 shadow-sm">

            {/* Step 1 — Email */}
            {step === "email" && (
              <>
                <h1 className="font-display text-xl font-bold text-ink-900 mb-1">
                  Forgot password?
                </h1>
                <p className="text-sm text-ink-500 font-sans mb-5">
                  Enter your email and we'll send you a 6-digit reset code.
                </p>
                <form onSubmit={sendCode} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2.5 rounded-xl border border-(--color-border) bg-(--color-bg) text-ink-900 font-sans text-sm placeholder:text-ink-400 outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/20 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold rounded-xl text-sm transition-colors disabled:opacity-60"
                  >
                    {loading ? "Sending Code…" : "Send Reset Code"}
                  </button>
                  <div className="text-center">
                    <Link
                      href="/login"
                      className="text-sm font-sans text-ink-500 hover:text-ink-800 transition-colors inline-flex items-center gap-1"
                    >
                      <ArrowLeft size={13} /> Back to Sign In
                    </Link>
                  </div>
                </form>
              </>
            )}

            {/* Step 2 — Verify Code */}
            {step === "code" && (
              <>
                <h1 className="font-display text-xl font-bold text-ink-900 mb-1">
                  Enter Verification Code
                </h1>
                <p className="text-sm text-ink-500 font-sans mb-5">
                  We sent a 6-digit code to <strong>{email}</strong>
                </p>
                <form onSubmit={verifyCode} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full px-3 py-2.5 rounded-xl border border-(--color-border) bg-(--color-bg) text-ink-900 font-sans text-sm text-center tracking-[0.5em] placeholder:tracking-normal placeholder:text-ink-400 outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/20 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="w-full py-2.5 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold rounded-xl text-sm transition-colors disabled:opacity-60"
                  >
                    {loading ? "Verifying…" : "Verify Code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCode(""); setStep("email"); }}
                    className="w-full text-sm font-sans text-ink-500 hover:text-ink-800 transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowLeft size={13} /> Use a different email
                  </button>
                </form>
              </>
            )}

            {/* Step 3 — New Password */}
            {step === "password" && (
              <>
                <h1 className="font-display text-xl font-bold text-ink-900 mb-1">
                  Set New Password
                </h1>
                <p className="text-sm text-ink-500 font-sans mb-5">
                  Create a strong new password for <strong>{email}</strong>
                </p>
                <form onSubmit={resetPassword} className="space-y-4">
                  {/* New password */}
                  <div>
                    <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPw1 ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className="w-full px-3 py-2.5 pr-10 rounded-xl border border-(--color-border) bg-(--color-bg) text-ink-900 font-sans text-sm placeholder:text-ink-400 outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw1((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors"
                      >
                        {showPw1 ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPw2 ? "text" : "password"}
                        required
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-3 py-2.5 pr-10 rounded-xl border border-(--color-border) bg-(--color-bg) text-ink-900 font-sans text-sm placeholder:text-ink-400 outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw2((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors"
                      >
                        {showPw2 ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Mismatch hint */}
                  {confirm.length > 0 && password !== confirm && (
                    <p className="text-xs text-red-500 font-sans -mt-2">
                      Passwords do not match
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !password || password !== confirm}
                    className="w-full py-2.5 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold rounded-xl text-sm transition-colors disabled:opacity-60"
                  >
                    {loading ? "Resetting Password…" : "Reset Password"}
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}