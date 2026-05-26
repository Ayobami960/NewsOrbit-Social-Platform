"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Radio, MailCheck, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/apiFetch";

const CODE_LENGTH = 6;
// How many seconds before the user can request another code
const RESEND_COOLDOWN = 60;

export default function VerifyAccountPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const emailParam   = searchParams.get("email") ?? "";

  const [email, setEmail]       = useState(emailParam);
  const [digits, setDigits]     = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Start cooldown timer on mount so the user can't immediately spam resend
  useEffect(() => {
    setCooldown(RESEND_COOLDOWN);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1_000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Focus first empty box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (idx: number, value: string) => {
    // Allow paste of full code into first box
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, CODE_LENGTH).split("");
      const next = Array(CODE_LENGTH).fill("");
      pasted.forEach((ch, i) => { next[i] = ch; });
      setDigits(next);
      const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
      inputRefs.current[focusIdx]?.focus();
      return;
    }
    const ch = value.replace(/\D/g, "");
    const next = [...digits];
    next[idx] = ch;
    setDigits(next);
    if (ch && idx < CODE_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const code = digits.join("");

  const handleVerify = useCallback(async (e?: any) => {
    e?.preventDefault();
    if (!email) {
      toast.error("Email is missing. Please go back and register again."); return;
    }
    if (code.length < CODE_LENGTH) {
      toast.error("Please enter the full 6-digit code."); return;
    }
    setLoading(true);
    try {
      await apiFetch("/auth/verify-email", {
        method: "POST",
        body: { email, code },
      });
      toast.success("Account verified!");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email, code, router]);

  const handleResend = async () => {
    if (!email) {
      toast.error("Email is missing."); return;
    }
    if (cooldown > 0) return;
    setResending(true);
    try {
      await apiFetch("/auth/resend-verify", {
        method: "POST",
        body: { email },
      });
      toast.success("A new code has been sent to your email.");
      setCooldown(RESEND_COOLDOWN);
      // Clear current digits so user can re-enter
      setDigits(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend code. Try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-bg) px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 justify-center mb-4">
            <div className="w-10 h-10 bg-ember-600 rounded-lg flex items-center justify-center">
              <Radio size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-ink-900">
              Osun<span className="text-ember-600">Gist</span>
            </span>
          </Link>

          <div className="w-14 h-14 bg-ember-50 border border-ember-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MailCheck size={26} className="text-ember-600" />
          </div>

          <h1 className="font-display text-xl font-bold text-ink-900 mb-1">Check your email</h1>
          <p className="text-sm text-ink-500 font-sans">
            We sent a 6-digit code to{" "}
            {email ? (
              <strong className="text-ink-700">{email}</strong>
            ) : (
              "your email address"
            )}
            . Enter it below to activate your account.
          </p>
        </div>

        <div className="bg-white border border-(--color-border) rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleVerify} className="space-y-5">
            {/* Email field — shown when email wasn't passed via query param */}
            {!emailParam && (
              <div>
                <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-(--color-border) bg-(--color-bg)] tet-ink-900 font-sans text-sm placeholder:text-ink-400 outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/20 transition-all"
                />
              </div>
            )}

            {/* OTP boxes */}
            <div>
              <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-3 text-center">
                Verification Code
              </label>
              <div className="flex items-center justify-center gap-2">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6} // allows full paste into first box
                    value={d}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onFocus={e => e.target.select()}
                    className="w-11 h-12 rounded-xl border border-(--color-border) bg-(--color-bg)] tet-ink-900 font-sans font-bold text-lg text-center outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/20 transition-all caret-transparent"
                  />
                ))}
              </div>
            </div>

            {/* Verify button */}
            <button
              type="submit"
              disabled={loading || code.length < CODE_LENGTH}
              className="w-full py-2.5 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying…
                </>
              ) : (
                "Verify Account"
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-4 text-center">
            <p className="text-sm font-sans text-ink-500">
              Didn&apos;t receive the code?{" "}
              {cooldown > 0 ? (
                <span className="text-ink-400">
                  Resend in <strong className="tabular-nums">{cooldown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="inline-flex items-center gap-1 text-ember-600 hover:text-ember-700 font-semibold transition-colors disabled:opacity-60"
                >
                  {resending ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <RefreshCw size={13} />
                  )}
                  Resend code
                </button>
              )}
            </p>
          </div>
        </div>

        <p className="text-center text-sm font-sans text-ink-500 mt-5">
          Already verified?{" "}
          <Link href="/login" className="text-ember-600 hover:text-ember-700 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}