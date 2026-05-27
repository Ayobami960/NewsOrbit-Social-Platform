"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Radio, Shield, Database, Share2, Cookie,
  Clock, UserCheck, Lock, Baby, Globe,
  RefreshCw, Mail, ChevronDown, ChevronUp,
  ArrowRight, X, CheckCheck, SlidersHorizontal,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const sections = [
  { id: "overview",      label: "Overview",             icon: Shield },
  { id: "collection",    label: "Data we collect",      icon: Database },
  { id: "use",           label: "How we use it",        icon: UserCheck },
  { id: "sharing",       label: "Sharing",              icon: Share2 },
  { id: "cookies",       label: "Cookies",              icon: Cookie },
  { id: "retention",     label: "Retention",            icon: Clock },
  { id: "rights",        label: "Your rights",          icon: UserCheck },
  { id: "security",      label: "Security",             icon: Lock },
  { id: "children",      label: "Children",             icon: Baby },
  { id: "international", label: "Transfers",            icon: Globe },
  { id: "changes",       label: "Policy changes",       icon: RefreshCw },
  { id: "contact",       label: "Contact",              icon: Mail },
];

// ─────────────────────────────────────────────────────────────────────────────
// COOKIE CONSENT BANNER
// ─────────────────────────────────────────────────────────────────────────────

export function CookieConsent() {
  const [visible,   setVisible]   = useState(false);
  const [expanded,  setExpanded]  = useState(false);
  const [prefs, setPrefs] = useState({
    essential:  true,   // always on
    analytics:  false,
    marketing:  false,
  });

  // Show after 800 ms if not already answered
  useEffect(() => {
    const answered = localStorage.getItem("og_cookie_consent");
    if (!answered) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const save = (choice: "all" | "essential" | "custom") => {
    const saved =
      choice === "all"
        ? { essential: true, analytics: true, marketing: true }
        : choice === "essential"
        ? { essential: true, analytics: false, marketing: false }
        : prefs;
    localStorage.setItem("og_cookie_consent", JSON.stringify(saved));
    // fire gtag / analytics consent here if needed
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cookie consent"
      className="fixed inset-0 z-[200] flex items-end sm:items-end justify-center sm:justify-end pointer-events-none px-0 sm:px-6 sm:pb-6"
    >
      {/* Backdrop — only visible on mobile */}
      <div
        className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm sm:hidden pointer-events-auto"
        onClick={() => save("essential")}
      />

      <div
        className="
          relative pointer-events-auto w-full sm:max-w-sm
          bg-white border border-[var(--color-border)] shadow-2xl
          rounded-t-3xl sm:rounded-2xl overflow-hidden
          animate-[slideUp_0.35s_cubic-bezier(0.34,1.56,0.64,1)_both]
        "
        style={{
          animationName: "slideUp",
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>

        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-ember-600 via-ember-500 to-ember-400" />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-ember-600/10 flex items-center justify-center">
                <Cookie size={16} className="text-ember-600" />
              </div>
              <div>
                <h2 className="font-display font-black text-ink-900 text-base leading-tight">
                  Cookie preferences
                </h2>
                <p className="font-sans text-[11px] text-ink-400 mt-0.5">OsunGist · NDPA 2023</p>
              </div>
            </div>
            <button
              onClick={() => save("essential")}
              className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-50 transition-colors"
              aria-label="Close, accept essential only"
            >
              <X size={15} />
            </button>
          </div>

          <p className="font-body text-[13px] text-ink-600 leading-relaxed mb-4">
            We use cookies to personalise content, analyse traffic, and improve your experience. You can choose which cookies you allow.{" "}
            <Link href="/privacy" className="text-ember-600 hover:underline font-semibold">
              Privacy Policy ↗
            </Link>
          </p>

          {/* Expandable preferences */}
          <div className="mb-4">
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1.5 text-[12px] font-sans font-semibold text-ink-500 hover:text-ink-900 transition-colors mb-2"
            >
              <SlidersHorizontal size={12} />
              Manage preferences
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {expanded && (
              <div className="space-y-2 bg-ink-50 rounded-xl p-3 border border-[var(--color-border)]">
                {[
                  {
                    key: "essential",
                    label: "Essential",
                    desc: "Required for the site to work. Always on.",
                    locked: true,
                  },
                  {
                    key: "analytics",
                    label: "Analytics",
                    desc: "Help us understand how you use OsunGist.",
                    locked: false,
                  },
                  {
                    key: "marketing",
                    label: "Marketing",
                    desc: "Used to show relevant content and offers.",
                    locked: false,
                  },
                ].map(({ key, label, desc, locked }) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-sans font-semibold text-ink-800 text-[12px]">{label}</p>
                      <p className="font-sans text-ink-400 text-[11px] leading-tight">{desc}</p>
                    </div>
                    {locked ? (
                      <span className="shrink-0 text-[10px] font-sans font-bold text-ember-600 bg-ember-600/10 px-2 py-0.5 rounded-full">
                        Always on
                      </span>
                    ) : (
                      <button
                        role="switch"
                        aria-checked={prefs[key as keyof typeof prefs]}
                        onClick={() =>
                          setPrefs(p => ({ ...p, [key]: !p[key as keyof typeof p] }))
                        }
                        className={`
                          relative shrink-0 w-9 h-5 rounded-full transition-colors duration-200
                          ${prefs[key as keyof typeof prefs] ? "bg-ember-600" : "bg-ink-200"}
                        `}
                      >
                        <span
                          className={`
                            absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm
                            transition-transform duration-200
                            ${prefs[key as keyof typeof prefs] ? "translate-x-4" : "translate-x-0"}
                          `}
                        />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
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

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-ember-600 shrink-0" />
          <span className="font-body text-[14px] text-ink-600 leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION CARD  — each policy section is a white card
// ─────────────────────────────────────────────────────────────────────────────

function SectionCard({
  id, num, title, icon: Icon, children,
}: {
  id: string;
  num: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className="scroll-mt-32 bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden"
    >
      {/* Card header */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-[var(--color-border)] bg-ink-50/50">
        <div className="w-9 h-9 rounded-xl bg-ember-600/10 flex items-center justify-center shrink-0">
          <Icon size={17} className="text-ember-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-black text-ink-900 text-lg leading-tight">{title}</h2>
        </div>
        <span className="shrink-0 font-mono text-[10px] font-bold text-ember-600 border border-ember-600/25 bg-ember-600/5 rounded-md px-2 py-0.5 tracking-wider">
          {num}
        </span>
      </div>

      {/* Card body */}
      <div className="px-6 py-5 space-y-4 font-body text-[14px] text-ink-600 leading-[1.8]">
        {children}
      </div>
    </div>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <strong className="font-semibold text-ink-800">{children}</strong>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS NAV
// ─────────────────────────────────────────────────────────────────────────────

function ProgressNav({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const activeIdx = sections.findIndex(s => s.id === activeId);
  const progress  = ((activeIdx + 1) / sections.length) * 100;

  return (
    <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-[var(--color-border)]">
      {/* Progress bar */}
      <div className="h-[3px] bg-ink-100">
        <div
          className="h-full bg-ember-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Section pills — horizontal scroll */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2.5">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                onSelect(id);
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`
                flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-[12px] font-sans font-semibold
                transition-all duration-150 shrink-0
                ${activeId === id
                  ? "bg-ember-600 text-white"
                  : "text-ink-500 hover:text-ink-900 hover:bg-ink-50"
                }
              `}
            >
              <Icon size={11} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function PrivacyPage() {
  const [activeId, setActiveId] = useState("overview");

  useEffect(() => {
    const onScroll = () => {
      const offsets = sections.map(({ id }) => {
        const el = document.getElementById(id);
        return { id, top: el ? el.getBoundingClientRect().top : Infinity };
      });
      const current = offsets.filter(o => o.top <= 160).at(-1);
      if (current) setActiveId(current.id);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Cookie banner renders on top of everything */}
      <CookieConsent />

      <div className="min-h-screen flex flex-col bg-ink-50">
        <Navbar />

        <main className="flex-1">

          {/* ── HERO ──────────────────────────────────────────────────────── */}
          <div className="bg-white border-b border-[var(--color-border)] relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg,transparent,transparent 47px,rgba(0,0,0,0.03) 47px,rgba(0,0,0,0.03) 48px)",
              }}
              aria-hidden
            />
            <div className="absolute right-0 bottom-0 pointer-events-none select-none overflow-hidden" aria-hidden>
              <span className="font-display text-[180px] font-black text-ink-900/[0.025] leading-none tracking-tighter whitespace-nowrap">
                Privacy
              </span>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-7 h-7 bg-ember-600 rounded-sm flex items-center justify-center">
                  <Radio size={13} className="text-white" />
                </div>
                <span className="font-sans text-sm font-semibold text-ink-400">OsunGist</span>
                <span className="text-ink-300">/</span>
                <span className="font-sans text-sm font-semibold text-ink-700">Privacy Policy</span>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                {/* Left */}
                <div>
                  <h1 className="font-display text-5xl sm:text-6xl font-black text-ink-900 leading-[1.05] tracking-tight mb-4">
                    Privacy{" "}
                    <span className="relative inline-block">
                      <span className="relative z-10 text-ember-600">Policy</span>
                      <span
                        className="absolute bottom-1 left-0 right-0 h-3 bg-ember-600/12 z-0 -skew-x-2"
                        aria-hidden
                      />
                    </span>
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm font-sans text-ink-500">
                    <span>Effective: <strong className="text-ink-700">1 Jan 2025</strong></span>
                    <span className="w-px h-4 bg-ink-200" />
                    <span>Updated: <strong className="text-ink-700">27 May 2026</strong></span>
                    <span className="w-px h-4 bg-ink-200" />
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      NDPA 2023 compliant
                    </span>
                  </div>
                </div>

                {/* Right — quick stat pills */}
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {[
                    { label: "12 sections", icon: Shield },
                    { label: "No data sales", icon: Lock },
                    { label: "30-day response", icon: Clock },
                  ].map(({ label, icon: Icon }) => (
                    <div
                      key={label}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-[var(--color-border)] rounded-xl text-[13px] font-sans font-semibold text-ink-700"
                    >
                      <Icon size={13} className="text-ember-600" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── PROGRESS NAV ────────────────────────────────────────────────── */}
          <ProgressNav activeId={activeId} onSelect={setActiveId} />

          {/* ── CONTENT ─────────────────────────────────────────────────────── */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex items-start gap-8">

              {/* ── Left sidebar — desktop only ────────────────────────────── */}
              <aside className="hidden xl:flex flex-col w-56 shrink-0 sticky top-[105px] self-start gap-4">
                {/* Mini TOC */}
                <div className="bg-white border border-[var(--color-border)] rounded-2xl p-4">
                  <p className="text-[10px] font-sans font-bold text-ink-400 uppercase tracking-[0.18em] mb-3">
                    On this page
                  </p>
                  <nav>
                    <ul className="space-y-0.5">
                      {sections.map(({ id, label, icon: Icon }) => (
                        <li key={id}>
                          <button
                            onClick={() => {
                              setActiveId(id);
                              document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className={`
                              w-full flex items-center gap-2 py-1.5 px-2 rounded-lg text-[12px] font-sans text-left
                              transition-all duration-150
                              ${activeId === id
                                ? "bg-ember-600/8 text-ember-600 font-semibold"
                                : "text-ink-500 hover:text-ink-900 hover:bg-ink-50"
                              }
                            `}
                          >
                            <Icon size={11} className={activeId === id ? "text-ember-600" : "text-ink-400"} />
                            {label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>

                {/* NDPA card */}
                <div className="bg-ember-600/6 border border-ember-600/15 rounded-2xl p-4">
                  <p className="text-[11px] font-sans font-bold text-ember-700 mb-1.5">🇳🇬 NDPA 2023</p>
                  <p className="text-[11px] font-sans text-ink-600 leading-relaxed">
                    You have rights under Nigerian data law. Contact{" "}
                    <a href="mailto:privacy@osungist.com" className="text-ember-600 font-semibold hover:underline">
                      privacy@osungist.com
                    </a>
                    .
                  </p>
                </div>
              </aside>

              {/* ── Main cards ─────────────────────────────────────────────── */}
              <div className="flex-1 min-w-0 space-y-4">

                {/* Intro card */}
                <div className="bg-ink-950 rounded-2xl p-6">
                  <p className="font-body text-[15px] text-ink-300 leading-[1.85]">
                    At <span className="text-white font-semibold">OsunGist</span>, we are committed to protecting your personal data and respecting your privacy rights. This Privacy Policy explains what information we collect, why we collect it, how we use it, and your rights under the{" "}
                    <span className="text-ember-400 font-semibold">Nigeria Data Protection Act (NDPA) 2023</span>. We encourage you to read it carefully.
                  </p>
                </div>

                {/* §01 */}
                <SectionCard id="overview" num="§01" title="Overview" icon={Shield}>
                  <p>
                    OsunGist ("we", "us", "our") operates as a digital newsroom and community platform serving Osun State and the broader Nigerian public. As the data controller for information collected through our website and mobile applications, we take our obligations under Nigerian data protection law seriously.
                  </p>
                  <p>
                    This policy applies to all users — casual readers, registered members, and community bloggers. It covers our website, mobile apps, newsletters, and all services we provide.
                  </p>
                </SectionCard>

                {/* §02 */}
                <SectionCard id="collection" num="§02" title="Data we collect" icon={Database}>
                  <p><Highlight>Information you provide directly:</Highlight></p>
                  <BulletList items={[
                    "Account registration details: name, email address, username, and password.",
                    "Profile information: profile photo, bio, and any optional details you choose to add.",
                    "Content you create: blog posts, comments, reactions, and messages.",
                    "Communications: emails or messages you send to our support or editorial team.",
                    "Payment information for premium plans — processed securely via third-party providers; we do not store raw card details.",
                  ]} />
                  <p className="pt-1"><Highlight>Information collected automatically:</Highlight></p>
                  <BulletList items={[
                    "Log data: IP address, browser type, pages visited, time and date of visits, and referring URLs.",
                    "Device information: device type, operating system, and unique device identifiers.",
                    "Usage data: articles read, searches performed, features used, and time spent on the platform.",
                    "Cookies and similar tracking technologies (see §05 for details).",
                    "Location data: approximate location derived from your IP address.",
                  ]} />
                </SectionCard>

                {/* §03 */}
                <SectionCard id="use" num="§03" title="How we use your data" icon={UserCheck}>
                  <BulletList items={[
                    "To create and manage your account and provide access to our services.",
                    "To personalise your news feed and content recommendations based on your reading interests.",
                    "To send you newsletters, breaking news alerts, and service notifications (opt out any time).",
                    "To moderate content and enforce our Terms of Use, including detecting fraud and spam.",
                    "To analyse usage patterns and improve our platform, features, and editorial coverage.",
                    "To comply with our legal obligations under Nigerian law.",
                    "To respond to your enquiries and provide customer support.",
                  ]} />
                  <div className="bg-ink-50 border border-[var(--color-border)] rounded-xl p-4 text-[13px]">
                    <p className="font-sans font-semibold text-ink-800 mb-1.5">Legal bases for processing</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["Contractual necessity", "Legitimate interests", "Legal obligation", "Consent"].map(b => (
                        <div key={b} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-ember-600 shrink-0" />
                          <span className="font-sans text-ink-600 text-[12px]">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionCard>

                {/* §04 */}
                <SectionCard id="sharing" num="§04" title="Sharing & disclosure" icon={Share2}>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3 text-[13px]">
                    <span className="text-lg">🔒</span>
                    <p className="font-sans font-semibold text-emerald-800">We do not sell your personal data. Ever.</p>
                  </div>
                  <p className="pt-1">We may share your information only in limited circumstances:</p>
                  <BulletList items={[
                    "Service providers: Trusted vendors (hosting, analytics, email, payments) under strict data processing agreements.",
                    "Legal requirements: When required by law, court order, or lawful government request.",
                    "Safety: To protect the rights, property, or safety of OsunGist, our users, or the public.",
                    "Business transfers: In the event of a merger or acquisition — we will notify you before any change.",
                    "With your explicit consent: For any other purpose, only with your permission.",
                  ]} />
                  <p className="text-[13px] text-ink-500">
                    Public content — published blog posts, username, and profile photo — are visible to all users by design.
                  </p>
                </SectionCard>

                {/* §05 */}
                <SectionCard id="cookies" num="§05" title="Cookies & tracking" icon={Cookie}>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { type: "Essential",   color: "bg-ink-900",      desc: "Required for login and session management. Always on." },
                      { type: "Analytics",   color: "bg-sky-600",      desc: "Help us understand how users interact with the platform." },
                      { type: "Preferences", color: "bg-amber-500",    desc: "Remember your notification and display settings." },
                      { type: "Marketing",   color: "bg-ember-600",    desc: "Show relevant content. Requires your consent." },
                    ].map(({ type, color, desc }) => (
                      <div key={type} className="bg-ink-50 border border-[var(--color-border)] rounded-xl p-3.5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`w-2 h-2 rounded-full ${color}`} />
                          <span className="font-sans font-bold text-ink-800 text-[12px]">{type}</span>
                        </div>
                        <p className="font-body text-[12px] text-ink-500 leading-relaxed">{desc}</p>
                      </div>
                    ))}
                  </div>
                  <p>
                    Control non-essential cookies through your browser settings or our cookie preference centre (accessible from the site footer). Disabling certain cookies may affect functionality.
                  </p>
                </SectionCard>

                {/* §06 */}
                <SectionCard id="retention" num="§06" title="Data retention" icon={Clock}>
                  <div className="space-y-2">
                    {[
                      { period: "Account lifetime",  desc: "Active account data is retained while your account is open." },
                      { period: "30 days",           desc: "Most personal data is deleted within 30 days of account deletion." },
                      { period: "12 – 24 months",    desc: "Log and analytics data retained in aggregated or anonymised form." },
                      { period: "90 days",           desc: "Published content may remain in cache after deletion." },
                      { period: "7 years",           desc: "Financial records retained as required by Nigerian tax law." },
                    ].map(({ period, desc }) => (
                      <div
                        key={period}
                        className="flex items-start gap-4 p-3 bg-ink-50 border border-[var(--color-border)] rounded-xl"
                      >
                        <span className="shrink-0 font-mono text-[11px] font-bold text-ember-600 bg-ember-600/10 px-2 py-1 rounded-lg whitespace-nowrap">
                          {period}
                        </span>
                        <span className="font-body text-[13px] text-ink-600 leading-relaxed">{desc}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* §07 */}
                <SectionCard id="rights" num="§07" title="Your rights (NDPA)" icon={UserCheck}>
                  <p>Under the Nigeria Data Protection Act 2023, you have the following rights:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { right: "Access",            desc: "Request a copy of your personal data." },
                      { right: "Rectification",     desc: "Correct inaccurate or incomplete data." },
                      { right: "Erasure",           desc: "Request deletion, subject to legal obligations." },
                      { right: "Restrict",          desc: "Limit how we use your data in certain cases." },
                      { right: "Portability",       desc: "Receive your data in a machine-readable format." },
                      { right: "Object",            desc: "Object to processing or direct marketing." },
                      { right: "Withdraw consent",  desc: "Withdraw consent at any time without penalty." },
                    ].map(({ right, desc }) => (
                      <div key={right} className="flex items-start gap-3 p-3 bg-white border border-[var(--color-border)] rounded-xl">
                        <span className="mt-0.5 w-4 h-4 rounded bg-ember-600/10 flex items-center justify-center shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-ember-600" />
                        </span>
                        <div>
                          <p className="font-sans font-bold text-ink-800 text-[12px]">{right}</p>
                          <p className="font-body text-ink-500 text-[12px] leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-[13px] font-sans text-sky-800">
                    To exercise any right, email{" "}
                    <a href="mailto:privacy@osungist.com" className="font-bold hover:underline">
                      privacy@osungist.com
                    </a>
                    . We respond within 30 days as required by the NDPA. You may also complain to the{" "}
                    <strong>Nigeria Data Protection Commission (NDPC)</strong>.
                  </div>
                </SectionCard>

                {/* §08 */}
                <SectionCard id="security" num="§08" title="Security" icon={Lock}>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    {[
                      { label: "TLS / HTTPS",        sub: "All data encrypted in transit" },
                      { label: "bcrypt passwords",   sub: "Hashed, never stored in plaintext" },
                      { label: "Access controls",    sub: "Need-to-know basis for all staff" },
                      { label: "Regular audits",     sub: "Vulnerability assessments & pen tests" },
                    ].map(({ label, sub }) => (
                      <div key={label} className="bg-ink-50 border border-[var(--color-border)] rounded-xl p-3.5">
                        <p className="font-sans font-bold text-ink-800 text-[12px] mb-0.5">{label}</p>
                        <p className="font-body text-ink-500 text-[11px] leading-relaxed">{sub}</p>
                      </div>
                    ))}
                  </div>
                  <p>
                    No method of transmission over the internet is 100% secure. In the event of a data breach likely to affect your rights, we will notify you and the NDPC as required by law.
                  </p>
                </SectionCard>

                {/* §09 */}
                <SectionCard id="children" num="§09" title="Children's privacy" icon={Baby}>
                  <p>
                    OsunGist is not directed at children under 13. We do not knowingly collect personal data from children under 13. If you are a parent or guardian and believe your child has provided us with personal information without your consent, contact <a href="mailto:privacy@osungist.com" className="text-ember-600 font-semibold hover:underline">privacy@osungist.com</a> and we will promptly delete such information.
                  </p>
                  <p>
                    Users aged 13–17 may use OsunGist with verifiable parental or guardian consent. We encourage parents to monitor their children's online activity.
                  </p>
                </SectionCard>

                {/* §10 */}
                <SectionCard id="international" num="§10" title="International transfers" icon={Globe}>
                  <p>
                    OsunGist is based in Nigeria and primarily serves a Nigerian audience. Some service providers (cloud hosting, analytics) may process data outside Nigeria. Where we transfer personal data internationally, appropriate safeguards are in place in accordance with the NDPA 2023 — including standard contractual clauses or equivalent protections.
                  </p>
                </SectionCard>

                {/* §11 */}
                <SectionCard id="changes" num="§11" title="Policy changes" icon={RefreshCw}>
                  <p>When we make material changes, we will:</p>
                  <BulletList items={[
                    "Update the Last updated date at the top of this page.",
                    "Display a notice on the platform for at least 14 days.",
                    "Notify registered users via email or in-app alert for significant changes.",
                  ]} />
                  <p>
                    Continued use of OsunGist after the effective date constitutes acceptance of the revised policy.
                  </p>
                </SectionCard>

                {/* §12 */}
                <SectionCard id="contact" num="§12" title="Contact us" icon={Mail}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: "Privacy / DPO",   value: "privacy@osungist.com" },
                      { label: "Support",          value: "support@osungist.com" },
                      { label: "Address",          value: "Osogbo, Osun State, Nigeria" },
                      { label: "Response time",    value: "Within 30 days (NDPA)" },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-ink-50 border border-[var(--color-border)] rounded-xl p-3.5">
                        <p className="text-[10px] font-sans font-bold text-ink-400 uppercase tracking-widest mb-1">
                          {label}
                        </p>
                        <p className="font-sans text-[12px] font-semibold text-ink-800 break-all">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-ink-50 border border-[var(--color-border)] rounded-xl">
                    <span className="text-lg shrink-0">🇳🇬</span>
                    <p className="text-[13px] font-sans text-ink-600 leading-relaxed">
                      <Highlight>Governing law.</Highlight> This Privacy Policy is governed by the Nigeria Data Protection Act (NDPA) 2023. You have the right to lodge a complaint with the <Highlight>Nigeria Data Protection Commission (NDPC)</Highlight>.
                    </p>
                  </div>
                </SectionCard>

                {/* Footer links */}
                <div className="pt-4 pb-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-border)]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-ember-600 rounded-sm flex items-center justify-center">
                      <Radio size={13} className="text-white" />
                    </div>
                    <span className="font-display font-black text-ink-900">
                      Osun<span className="text-ember-600">Gist</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-5 text-sm font-sans text-ink-500">
                    <Link href="/terms" className="hover:text-ember-600 transition-colors">Terms of Use</Link>
                    <Link href="/contact" className="hover:text-ember-600 transition-colors">Contact</Link>
                    <Link href="/" className="hover:text-ember-600 transition-colors">Home</Link>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}