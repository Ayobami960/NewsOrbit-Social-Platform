import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { apiFetch } from "../lib/apiFetch";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Step = "verifying_token" | "confirm_email" | "enter_code" | "set_password" | "done" | "invalid";

interface TokenInfo {
  email: string;
  role:  "admin" | "writer";
  name:  string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  admin:  "Admin",
  writer: "Writer",
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex items-center gap-2 mb-10">
      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
        <span className="text-zinc-900 font-bold text-sm">0</span>
      </div>
      <span className="text-zinc-100 font-semibold text-sm tracking-wide">OsunGist</span>
    </div>
  );
}

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex gap-1.5 mb-8">
      {[1, 2, 3].map(n => (
        <div
          key={n}
          className={`h-1 rounded-full transition-all duration-300 ${
            n < current
              ? "w-6 bg-emerald-500"
              : n === current
              ? "w-6 bg-white"
              : "w-3 bg-zinc-700"
          }`}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OTP Input
// ─────────────────────────────────────────────────────────────────────────────

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = digits.map((d, idx) => (idx === i ? "" : d)).join("").padEnd(6, "").slice(0, 6);
        onChange(next.trimEnd());
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
        const next = digits.map((d, idx) => (idx === i - 1 ? "" : d)).join("").padEnd(6, "").slice(0, 6);
        onChange(next.trimEnd());
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < 5) {
      refs.current[i + 1]?.focus();
    }
  };

  const handleChange = (i: number, raw: string) => {
    const char = raw.replace(/\D/g, "").slice(-1);
    const next = digits.map((d, idx) => (idx === i ? char : d)).join("");
    onChange(next.trimEnd());
    if (char && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    refs.current[focusIdx]?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-2.5 justify-center">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          className={`
            w-11 h-13 text-center text-xl font-semibold rounded-xl border transition-all
            bg-zinc-800/60 text-zinc-100 outline-none
            ${digit
              ? "border-zinc-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
              : "border-zinc-700"
            }
            focus:border-white focus:bg-zinc-800
            caret-transparent select-none
          `}
          style={{ height: "3.25rem" }}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const token          = searchParams.get("token") ?? "";

  const [step,       setStep]       = useState<Step>("verifying_token");
  const [tokenInfo,  setTokenInfo]  = useState<TokenInfo | null>(null);
  const [code,       setCode]       = useState("");
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [resendSecs, setResendSecs] = useState(0);

  // ── Step 1: verify token on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!token) { setStep("invalid"); return; }

    apiFetch<TokenInfo>(`/auth/invite/verify-token?token=${token}`)
      .then(r => {
        setTokenInfo(r.data);
        setStep("confirm_email");
      })
      .catch(() => setStep("invalid"));
  }, [token]);

  // ── Resend countdown ──────────────────────────────────────────────────────
  useEffect(() => {
    if (resendSecs <= 0) return;
    const id = setInterval(() => setResendSecs(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [resendSecs]);

  // ── Step 2: send 6-digit code to email ───────────────────────────────────
  const handleSendCode = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await apiFetch("/auth/invite/send-code", {
        method: "POST",
        body:   { token },
      });
      toast.success("Verification code sent!");
      setStep("enter_code");
      setResendSecs(60);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to send code.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: verify 6-digit code ──────────────────────────────────────────
  const handleVerifyCode = async () => {
    if (code.length < 6) { toast.error("Enter all 6 digits."); return; }
    setLoading(true);
    try {
      await apiFetch("/auth/invite/verify-code", {
        method: "POST",
        body:   { token, code },
      });
      setStep("set_password");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Invalid or expired code.");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 4: set password & complete invite ────────────────────────────────
  const handleSetPassword = async () => {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters."); return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match."); return;
    }
    setLoading(true);
    try {
      await apiFetch("/auth/invite/accept", {
        method: "POST",
        body:   { token, code, password },
      });
      setStep("done");
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to complete setup.");
    } finally {
      setLoading(false);
    }
  };

  // ── Auto-submit code when 6 digits filled ─────────────────────────────────
  useEffect(() => {
    if (step === "enter_code" && code.length === 6) {
      handleVerifyCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // ─────────────────────────────────────────────────────────────────────────
  // Layout wrapper
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      {/* Background pattern */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-sm">
        <Logo />

        {/* ── Loading / verifying ─────────────────────────────────────────── */}
        {step === "verifying_token" && (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-2 border-zinc-700 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400 text-sm">Verifying your invite link…</p>
          </div>
        )}

        {/* ── Invalid / expired ──────────────────────────────────────────── */}
        {step === "invalid" && (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h1 className="text-zinc-100 text-xl font-semibold mb-2">Link expired or invalid</h1>
            <p className="text-zinc-500 text-sm leading-relaxed mb-6">
              This invite link has expired or has already been used.<br />
              Please ask your administrator to send a new invitation.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="text-zinc-400 hover:text-zinc-100 text-sm transition-colors underline underline-offset-4"
            >
              Back to login
            </button>
          </div>
        )}

        {/* ── Step 1: Confirm email ──────────────────────────────────────── */}
        {step === "confirm_email" && tokenInfo && (
          <div>
            <StepDots current={1} />

            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                You're invited as {ROLE_LABEL[tokenInfo.role] ?? tokenInfo.role}
              </span>
              <h1 className="text-zinc-100 text-2xl font-semibold leading-snug mb-2">
                Welcome, {tokenInfo.name.split(" ")[0]}
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed">
                We'll send a 6-digit verification code to confirm you own this address.
              </p>
            </div>

            {/* Email display */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-medium mb-0.5">Invite sent to</p>
                <p className="text-zinc-200 text-sm font-medium truncate">{tokenInfo.email}</p>
              </div>
            </div>

            <button
              onClick={handleSendCode}
              disabled={loading}
              className="
                w-full py-3 rounded-xl font-medium text-sm transition-all
                bg-white text-zinc-900 hover:bg-zinc-100 active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              "
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
                  Sending…
                </>
              ) : (
                "Send verification code"
              )}
            </button>

            <p className="text-center text-zinc-600 text-xs mt-5">
              Not your email? Contact your administrator.
            </p>
          </div>
        )}

        {/* ── Step 2: Enter 6-digit code ─────────────────────────────────── */}
        {step === "enter_code" && tokenInfo && (
          <div>
            <StepDots current={2} />

            <div className="mb-7">
              <h1 className="text-zinc-100 text-2xl font-semibold mb-2">Check your inbox</h1>
              <p className="text-zinc-400 text-sm leading-relaxed">
                We sent a 6-digit code to{" "}
                <span className="text-zinc-200 font-medium">{tokenInfo.email}</span>.
                Enter it below to continue.
              </p>
            </div>

            <OtpInput value={code} onChange={setCode} />

            {loading && (
              <div className="flex items-center justify-center gap-2 mt-5 text-zinc-400 text-sm">
                <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                Verifying…
              </div>
            )}

            {/* Resend */}
            <div className="mt-6 text-center">
              {resendSecs > 0 ? (
                <p className="text-zinc-600 text-sm">
                  Resend in <span className="text-zinc-400 tabular-nums">{resendSecs}s</span>
                </p>
              ) : (
                <button
                  onClick={handleSendCode}
                  disabled={loading}
                  className="text-zinc-400 hover:text-zinc-100 text-sm transition-colors underline underline-offset-4 disabled:opacity-40"
                >
                  Resend code
                </button>
              )}
            </div>

            <button
              onClick={() => { setCode(""); setStep("confirm_email"); }}
              className="mt-4 w-full text-center text-zinc-600 hover:text-zinc-400 text-xs transition-colors py-2"
            >
              ← Back
            </button>
          </div>
        )}

        {/* ── Step 3: Set password ───────────────────────────────────────── */}
        {step === "set_password" && tokenInfo && (
          <div>
            <StepDots current={3} />

            <div className="mb-7">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-emerald-400 text-xs font-medium">Email verified</span>
              </div>
              <h1 className="text-zinc-100 text-2xl font-semibold mb-2">Create your password</h1>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Choose a strong password to secure your{" "}
                <span className="text-zinc-200">{ROLE_LABEL[tokenInfo.role]}</span> account.
              </p>
            </div>

            {/* Password field */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="
                    w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 pr-11
                    text-zinc-100 text-sm placeholder-zinc-700 outline-none
                    focus:border-zinc-600 transition-colors
                  "
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showPw ? (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm field */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  onKeyDown={e => e.key === "Enter" && handleSetPassword()}
                  className="
                    w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3
                    text-zinc-100 text-sm placeholder-zinc-700 outline-none
                    focus:border-zinc-600 transition-colors
                  "
                />
                {confirm && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {confirm === password ? (
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Strength hints */}
            {password && (
              <div className="mb-5 flex gap-1.5">
                {[8, 12, 16].map(len => (
                  <div
                    key={len}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      password.length >= len ? "bg-emerald-500" : "bg-zinc-800"
                    }`}
                  />
                ))}
                <span className="text-[11px] text-zinc-600 ml-1 self-center">
                  {password.length < 8 ? "Too short" : password.length < 12 ? "Fair" : password.length < 16 ? "Good" : "Strong"}
                </span>
              </div>
            )}

            <button
              onClick={handleSetPassword}
              disabled={loading || password.length < 8 || password !== confirm}
              className="
                w-full py-3 rounded-xl font-medium text-sm transition-all
                bg-white text-zinc-900 hover:bg-zinc-100 active:scale-[0.98]
                disabled:opacity-40 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              "
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
                  Setting up account…
                </>
              ) : (
                "Complete setup"
              )}
            </button>
          </div>
        )}

        {/* ── Done ──────────────────────────────────────────────────────── */}
        {step === "done" && tokenInfo && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-zinc-100 text-2xl font-semibold mb-2">
              You're all set!
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed mb-1">
              Your <span className="text-zinc-200">{ROLE_LABEL[tokenInfo.role]}</span> account is ready.
            </p>
            <p className="text-zinc-600 text-xs">Redirecting you to login…</p>

            {/* Progress bar */}
            <div className="mt-6 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full animate-[progress_2.5s_linear_forwards]" />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}