"use client";

/**
 * CookieConsent
 *
 * Drop this into your root layout.tsx so it appears on every page:
 *
 *   import { CookieConsent } from "@/components/ui/CookieConsent";
 *
 *   export default function RootLayout({ children }) {
 *     return (
 *       <html>
 *         <body>
 *           <CookieConsent />
 *           {children}
 *         </body>
 *       </html>
 *     );
 *   }
 *
 * Behaviour:
 *   - First visit: shows after 800 ms.
 *   - After accepting/declining: saves choice to localStorage ("og_cookie_consent").
 *   - Does NOT show again until localStorage is cleared.
 *   - "Manage preferences" expands toggles for analytics & marketing cookies.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Cookie, X, CheckCheck, SlidersHorizontal,
  ChevronDown, ChevronUp,
} from "lucide-react";

export interface CookiePrefs {
  essential:  true;
  analytics:  boolean;
  marketing:  boolean;
}

const STORAGE_KEY = "og_cookie_consent";

export function CookieConsent() {
  const [visible,  setVisible]  = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs,    setPrefs]    = useState<CookiePrefs>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const already = localStorage.getItem(STORAGE_KEY);
    if (!already) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const save = (choice: "all" | "essential" | "custom") => {
    const saved: CookiePrefs =
      choice === "all"
        ? { essential: true, analytics: true,  marketing: true }
        : choice === "essential"
        ? { essential: true, analytics: false, marketing: false }
        : prefs;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

    // ── Fire your analytics consent signal here ────────────────────────────
    // if (saved.analytics && typeof window.gtag === "function") {
    //   window.gtag("consent", "update", { analytics_storage: "granted" });
    // }
    // ──────────────────────────────────────────────────────────────────────

    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cookie preferences"
      className="fixed inset-0 z-[200] flex items-end sm:items-end justify-center sm:justify-end pointer-events-none px-0 sm:px-6 sm:pb-6"
    >
      {/* Mobile backdrop */}
      <div
        className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm sm:hidden pointer-events-auto"
        onClick={() => save("essential")}
        aria-hidden="true"
      />

      <div
        className="
          relative pointer-events-auto w-full sm:max-w-sm
          bg-white border border-[var(--color-border)]
          shadow-2xl rounded-t-3xl sm:rounded-2xl overflow-hidden
        "
        style={{ animation: "og-cookie-slide 0.35s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <style>{`
          @keyframes og-cookie-slide {
            from { transform: translateY(110%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>

        {/* Top colour bar */}
        <div className="h-1 bg-gradient-to-r from-ember-600 via-ember-500 to-ember-400" />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-ember-600/10 flex items-center justify-center shrink-0">
                <Cookie size={16} className="text-ember-600" />
              </div>
              <div>
                <h2 className="font-display font-black text-ink-900 text-base leading-tight">
                  Cookie preferences
                </h2>
                <p className="font-sans text-[11px] text-ink-400 mt-0.5">
                  OsunGist · NDPA 2023
                </p>
              </div>
            </div>
            <button
              onClick={() => save("essential")}
              className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-50 transition-colors"
              aria-label="Decline non-essential cookies and close"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body text */}
          <p className="font-body text-[13px] text-ink-600 leading-relaxed mb-4">
            We use cookies to personalise content, analyse traffic, and improve your experience.{" "}
            <Link href="/privacy" className="text-ember-600 font-semibold hover:underline">
              Privacy Policy ↗
            </Link>
          </p>

          {/* Expandable toggles */}
          <div className="mb-4">
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1.5 text-[12px] font-sans font-semibold text-ink-500 hover:text-ink-800 transition-colors mb-2"
            >
              <SlidersHorizontal size={12} />
              Manage preferences
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {expanded && (
              <div className="space-y-2.5 bg-ink-50 border border-[var(--color-border)] rounded-xl p-3">
                {([
                  { key: "essential", label: "Essential",  desc: "Required for the site to work. Always on.", locked: true  },
                  { key: "analytics", label: "Analytics",  desc: "Help us understand how you use OsunGist.",  locked: false },
                  { key: "marketing", label: "Marketing",  desc: "Used to show relevant content and offers.", locked: false },
                ] as const).map(({ key, label, desc, locked }) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-sans font-semibold text-ink-800 text-[12px]">{label}</p>
                      <p className="font-sans text-ink-400 text-[11px] leading-tight">{desc}</p>
                    </div>
                    {locked ? (
                      <span className="shrink-0 text-[10px] font-sans font-bold text-ember-600 bg-ember-600/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                        Always on
                      </span>
                    ) : (
                      <button
                        role="switch"
                        aria-checked={prefs[key]}
                        onClick={() =>
                          setPrefs(p => ({ ...p, [key]: !p[key] }))
                        }
                        className={`
                          relative shrink-0 w-9 h-5 rounded-full transition-colors duration-200
                          ${prefs[key] ? "bg-ember-600" : "bg-ink-200"}
                        `}
                      >
                        <span
                          className={`
                            absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm
                            transition-transform duration-200
                            ${prefs[key] ? "translate-x-4" : "translate-x-0"}
                          `}
                        />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => save("essential")}
              className="flex-1 py-2.5 border border-[var(--color-border)] rounded-xl text-[13px] font-sans font-semibold text-ink-700 hover:bg-ink-50 transition-colors"
            >
              Essential only
            </button>
            {expanded ? (
              <button
                onClick={() => save("custom")}
                className="flex-1 py-2.5 bg-ember-600 hover:bg-ember-700 text-white rounded-xl text-[13px] font-sans font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCheck size={13} /> Save choices
              </button>
            ) : (
              <button
                onClick={() => save("all")}
                className="flex-1 py-2.5 bg-ember-600 hover:bg-ember-700 text-white rounded-xl text-[13px] font-sans font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCheck size={13} /> Accept all
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}