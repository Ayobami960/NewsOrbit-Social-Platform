"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, X, Radio } from "lucide-react";

const STORAGE_KEY = "osungist_privacy_accepted";

export default function PrivacyConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Only show once — check localStorage on mount
  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      // Small delay so the page has time to paint before the modal appears
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => {
      setVisible(false);
      setLeaving(false);
    }, 300);
  };

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    dismiss();
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm transition-opacity duration-300 ${
          leaving ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
        className={`
          fixed inset-x-0 bottom-0 z-50
          sm:inset-auto sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2
          w-full sm:w-[580px] sm:max-w-[calc(100vw-2rem)]
          transition-all duration-300
          ${leaving
            ? "opacity-0 translate-y-4"
            : "opacity-100 translate-y-0"}
        `}
      >
        <div className="bg-white border border-(--color-border) shadow-2xl shadow-ink-900/15 rounded-t-2xl sm:rounded-2xl overflow-hidden">

          {/* Top accent bar */}
          <div className="h-1 w-full bg-ember-600" />

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-ember-600/10 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} className="text-ember-600" />
                </div>
                <div>
                  <p
                    id="privacy-modal-title"
                    className="font-display text-base font-black text-ink-900 leading-tight"
                  >
                    We value your privacy
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-4 h-4 bg-ember-600 rounded-[3px] flex items-center justify-center">
                      <Radio size={9} className="text-white" />
                    </div>
                    <span className="font-sans text-[11px] font-semibold text-ink-400">
                      OsunGist
                    </span>
                  </div>
                </div>
              </div>

              {/* Dismiss without accepting (just closes, will show again next visit) */}
              <button
                onClick={dismiss}
                aria-label="Close"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors shrink-0"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <p className="font-body text-[14px] text-ink-600 leading-[1.75] mb-5">
              Before you explore OsunGist — Osun State's digital newsroom — please take a moment to review our{" "}
              <Link
                href="/privacy"
                className="text-ember-600 font-semibold hover:underline underline-offset-2"
              >
                Privacy Policy
              </Link>
              . We collect certain data to personalise your experience and keep the platform running. We do not sell your personal information and we comply with the{" "}
              <strong className="text-ink-700 font-medium">Nigeria Data Protection Act (NDPA) 2023</strong>.
            </p>

            {/* Quick-summary chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                "No data selling",
                "NDPA compliant",
                "You control your data",
                "Secure & encrypted",
              ].map(item => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ink-50 border border-(--color-border) text-[11px] font-sans font-semibold text-ink-600"
                >
                  <span className="w-1 h-1 rounded-full bg-ember-600 shrink-0" />
                  {item}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={accept}
                className="flex-1 h-11 bg-ember-600 hover:bg-ember-700 active:scale-[0.98] text-white font-sans font-semibold text-sm rounded-xl transition-all duration-150 flex items-center justify-center gap-2"
              >
                <ShieldCheck size={15} />
                I understand — continue to OsunGist
              </button>
              <Link
                href="/privacy"
                onClick={accept}
                className="flex-1 sm:flex-none h-11 border border-(--color-border) hover:border-ink-400 text-ink-700 hover:text-ink-900 font-sans font-semibold text-sm rounded-xl transition-all duration-150 flex items-center justify-center px-4 gap-2"
              >
                Read full policy
              </Link>
            </div>

            <p className="text-center text-[11px] font-sans text-ink-400 mt-3 leading-relaxed">
              By continuing you agree to our{" "}
              <Link href="/privacy" className="text-ember-600 hover:underline" onClick={accept}>
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link href="/terms" className="text-ember-600 hover:underline" onClick={accept}>
                Terms of Use
              </Link>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}