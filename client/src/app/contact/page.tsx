"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Radio, Mail, MapPin, Clock, Send,
  MessageSquare, Newspaper, Bug, Users,
  ChevronRight, CheckCircle, ArrowUpRight,
  Phone,
} from "lucide-react";
import { BsInstagram, BsTwitter } from "react-icons/bs";
import { FaFacebook } from "react-icons/fa6";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/apiFetch";

// ─── Data ─────────────────────────────────────────────────────────────────────

const TOPICS = [
  { id: "general",  label: "General enquiry", icon: MessageSquare },
  { id: "editorial", label: "Editorial / tip",  icon: Newspaper },
  { id: "bug", label: "Report a bug", icon: Bug },
  { id: "partnership",   label: "Partnership", icon: Users },
  { id: "press", label: "Press & media", icon: ArrowUpRight },
  { id: "other", label: "Something else", icon: ChevronRight },
] as const;

type TopicId = (typeof TOPICS)[number]["id"];

const CONTACT_CARDS = [
  {
    icon: Mail,
    label: "Email us",
    value: "hello@newsorbit.com",
    sub: "We reply within 2 business days",
    href: "mailto:hello@newsorbit.com",
    accent: "bg-ember-600",
  },
  {
    icon: MapPin,
    label: "Find us",
    value: "Osogbo, Osun State",
    sub: "Nigeria — WAT (UTC +1)",
    href: "#",
    accent: "bg-ink-900",
  },
  {
    icon: Clock,
    label: "Office hours",
    value: "Mon – Fri, 9am – 6pm",
    sub: "West Africa Time (WAT)",
    href: "#",
    accent: "bg-ink-900",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContactPage() {
  const { success, error: toastError } = useToast();
  const [topic,       setTopic]       = useState<TopicId>("general");
  const [name,        setName]        = useState("");
  const [email,       setEmail]       = useState("");
  const [subject,     setSubject]     = useState("");
  const [message,     setMessage]     = useState("");
  const [sending,     setSending]     = useState(false);
  const [sent,        setSent]        = useState(false);
  const [error,       setError]       = useState("");
  const formRef = useRef<HTMLFormElement>(null);


  const isValid =
    name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    subject.trim().length >= 3 &&
    message.trim().length >= 10;


const handleSubmit = async (e: any) => {
  e.preventDefault();
  if (!isValid) return;
  setSending(true);
  try {
    await apiFetch("/contact", {
      method: "POST",
      body: { name, email, subject, message, topic },
    });
    setSent(true);
    success("Message sent!", "We'll get back to you within 2 business days.");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Something went wrong.";
    toastError("Failed to send", msg);
    setError(msg);
  } finally {
    setSending(false);
  }
};

  const inputCls = `
    w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-white
    text-ink-900 font-sans text-sm placeholder:text-ink-300
    outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/15
    transition-all duration-200
  `;

  return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <Navbar />

      <main className="flex-1">

        {/* ── HERO  ──────────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-ink-950 border-b border-ink-800">

          {/* Diagonal grid pattern */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg,rgba(255,255,255,0.03) 0,rgba(255,255,255,0.03) 1px,transparent 0,transparent 50%)",
              backgroundSize: "28px 28px",
            }}
            aria-hidden
          />

          {/* Big ghost text */}
          <div
            className="absolute -right-8 top-1/2 -translate-y-1/2 pointer-events-none select-none"
            aria-hidden
          >
            <span className="font-display text-[160px] font-black leading-none text-white/3 tracking-tighter whitespace-nowrap">
              Contact
            </span>
          </div>

          {/* Red accent bar — left edge */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-ember-600 via-ember-500 to-transparent" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-8">
              <div className="w-7 h-7 bg-ember-600 rounded-sm flex items-center justify-center">
                <Radio size={13} className="text-white" />
              </div>
              <span className="font-sans text-sm font-semibold text-ink-500">NewsOrbit</span>
              <span className="text-ink-700">/</span>
              <span className="font-sans text-sm font-semibold text-ink-200">Contact</span>
            </div>

            

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left */}
              <div>
                {/* Live badge */}
                <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-ember-600/30 bg-ember-600/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-ember-500 animate-pulse" />
                  <span className="text-[11px] font-sans font-bold text-ember-400 uppercase tracking-widest">
                    We're here to help
                  </span>
                </div>

                <h1 className="font-display text-5xl sm:text-6xl font-black text-white leading-[1.04] tracking-tight mb-5">
                  Get in{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 text-ember-500">touch</span>
                    {/* Underline squiggle */}
                    <svg
                      className="absolute -bottom-2 left-0 w-full"
                      height="8" viewBox="0 0 100 8" preserveAspectRatio="none"
                      aria-hidden
                    >
                      <path
                        d="M0 6 Q25 0 50 6 Q75 12 100 6"
                        stroke="#dc2626" strokeWidth="2.5" fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </h1>

                <p className="font-body text-lg text-ink-400 leading-relaxed max-w-md mb-10">
                  Questions, story tips, partnership enquiries, or just saying hello — we read every message and respond personally.
                </p>

                {/* Contact cards */}
                <div className="space-y-3">
                  {CONTACT_CARDS.map(({ icon: Icon, label, value, sub, href, accent }) => (
                    <a
                      key={label}
                      href={href}
                      className="group flex items-center gap-4 p-4 bg-ink-900 border border-ink-800 hover:border-ember-600/40 rounded-2xl transition-all duration-200"
                    >
                      <div className={`${accent} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>
                        <Icon size={17} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-0.5">
                          {label}
                        </p>
                        <p className="font-sans font-semibold text-white text-sm truncate">{value}</p>
                        <p className="font-sans text-ink-500 text-xs">{sub}</p>
                      </div>
                      <ArrowUpRight
                        size={14}
                        className="text-ink-600 group-hover:text-ember-500 transition-colors shrink-0"
                      />
                    </a>
                  ))}
                </div>

                {/* Social row */}
                <div className="flex items-center gap-3 mt-6">
                  <span className="text-[11px] font-sans font-bold text-ink-600 uppercase tracking-widest">
                    Follow us
                  </span>
                  <div className="flex-1 h-px bg-ink-800" />
                  {[
                    { icon: BsTwitter,  href: "https://twitter.com/newsorbit",   label: "Twitter" },
                    { icon: FaFacebook, href: "https://facebook.com/newsorbit",  label: "Facebook" },
                    { icon: BsInstagram,  href: "https://instagram.com/newsorbit", label: "Instagram" },
                  ].map(({ icon: Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="w-9 h-9 rounded-xl bg-ink-900 border border-ink-800 hover:border-ember-600/40 hover:bg-ember-600/10 flex items-center justify-center text-ink-400 hover:text-ember-500 transition-all"
                    >
                      <Icon size={15} />
                    </a>
                  ))}
                </div>
              </div>

              {/* Right — decorative editorial column */}
              <div className="hidden lg:flex flex-col gap-4">
                {[
                  { num: "01", head: "Story tips",   body: "Have a tip about something happening in Osun? Send it to our editorial team." },
                  { num: "02", head: "Partnerships", body: "Looking to work with NewsOrbit? We're open to sponsorships and media partnerships." },
                  { num: "03", head: "Press",        body: "Journalists and media organisations can reach our press team for statements and interviews." },
                  { num: "04", head: "Technical",    body: "Found a bug or have a feature request? Our dev team wants to hear from you." },
                ].map(({ num, head, body }) => (
                  <div
                    key={num}
                    className="flex items-start gap-4 p-4 bg-ink-900/60 border border-ink-800 rounded-xl hover:border-ink-700 transition-colors"
                  >
                    <span className="font-mono text-[11px] font-bold text-ember-600 mt-0.5">{num}</span>
                    <div>
                      <p className="font-sans font-bold text-white text-sm mb-0.5">{head}</p>
                      <p className="font-body text-ink-400 text-xs leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── FORM ───────────────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* Form — takes 2 cols */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-(--color-border) rounded-3xl overflow-hidden shadow-sm">

                {/* Form header */}
                <div className="px-8 py-6 border-b border-(--color-border) flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-2xl font-black text-ink-900">Send us a message</h2>
                    <p className="text-sm font-sans text-ink-400 mt-0.5">
                      All fields marked <span className="text-ember-600">*</span> are required
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-ember-600/10 flex items-center justify-center">
                    <Send size={17} className="text-ember-600" />
                  </div>
                </div>

                {/* Success state */}
                {sent ? (
                  <div className="px-8 py-16 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-5">
                      <CheckCircle size={28} className="text-emerald-500" />
                    </div>
                    <h3 className="font-display text-2xl font-black text-ink-900 mb-2">
                      Message received!
                    </h3>
                    <p className="font-body text-ink-500 text-sm max-w-sm leading-relaxed mb-6">
                      Thanks for reaching out. We'll get back to you at <strong className="text-ink-700">{email}</strong> within 2 business days.
                    </p>
                    <button
                      onClick={() => {
                        setSent(false);
                        setName(""); setEmail(""); setSubject(""); setMessage("");
                        setTopic("general");
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 border border-(--color-border) text-ink-700 hover:bg-ink-50 font-sans font-semibold text-sm rounded-xl transition-colors"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form ref={formRef} onSubmit={handleSubmit} className="px-8 py-7 space-y-6">

                    {/* Topic selector */}
                    <div>
                      <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-3">
                        What's this about? <span className="text-ember-600">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {TOPICS.map(({ id, label, icon: Icon }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setTopic(id)}
                            className={`
                              flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm font-sans font-semibold
                              transition-all duration-150 text-left
                              ${topic === id
                                ? "bg-ember-600 border-ember-600 text-white"
                                : "bg-white border-(--color-border) text-ink-600 hover:border-ember-300 hover:text-ember-600"
                              }
                            `}
                          >
                            <Icon size={13} className="shrink-0" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Name + Email row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                          Your name <span className="text-ember-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Adewale Olatunji"
                          className={inputCls}
                          autoComplete="name"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                          Email address <span className="text-ember-600">*</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className={inputCls}
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                        Subject <span className="text-ember-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="Brief description of your enquiry"
                        className={inputCls}
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                        Message <span className="text-ember-600">*</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Tell us what's on your mind…"
                        rows={5}
                        className={`${inputCls} resize-none`}
                      />
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-[11px] font-sans text-ink-400">Minimum 10 characters</p>
                        <p className={`text-[11px] font-sans ${message.length > 2000 ? "text-red-500" : "text-ink-400"}`}>
                          {message.length}/2000
                        </p>
                      </div>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-sans text-red-700">
                        <span className="w-4 h-4 rounded-full border-2 border-red-500 flex items-center justify-center text-[10px] font-bold shrink-0">!</span>
                        {error}
                      </div>
                    )}

                    {/* Submit */}
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[12px] font-sans text-ink-400 max-w-xs leading-relaxed">
                        By submitting you agree to our{" "}
                        <Link href="/privacy" className="text-ember-600 hover:underline">Privacy Policy</Link>.
                      </p>
                      <button
                        type="submit"
                        disabled={!isValid || sending}
                        className="flex items-center gap-2 px-7 py-3 bg-ember-600 hover:bg-ember-700 text-white font-sans font-bold text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sending ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending…
                          </>
                        ) : (
                          <>
                            <Send size={14} /> Send message
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                )}
              </div>
            </div>

            {/* Right sidebar */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-24">

              {/* FAQ quick links */}
              {/* <div className="bg-white border border-[var(--color-border)] rounded-2xl p-5">
                <p className="text-[11px] font-sans font-bold text-ink-400 uppercase tracking-widest mb-3">
                  Quick answers
                </p>
                <div className="space-y-1">
                  {[
                    { q: "How do I submit a news tip?",     href: "#" },
                    { q: "How do I delete my account?",    href: "/profile" },
                    { q: "Can I advertise on NewsOrbit?",   href: "#" },
                    { q: "How do I report content?",       href: "#" },
                    { q: "Is NewsOrbit free to use?",       href: "/about" },
                  ].map(({ q, href }) => (
                    <Link
                      key={q}
                      href={href}
                      className="group flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-ink-50 transition-colors"
                    >
                      <span className="text-[13px] font-sans text-ink-700 group-hover:text-ember-600 transition-colors leading-snug">
                        {q}
                      </span>
                      <ChevronRight size={13} className="text-ink-300 group-hover:text-ember-600 transition-colors shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>
              </div> */}

              {/* Response times */}
              <div className="bg-ink-950 border border-ink-800 rounded-2xl p-5">
                <p className="text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-3">
                  Response times
                </p>
                <div className="space-y-3">
                  {[
                    { type: "General enquiries",   time: "2 business days",  dot: "bg-emerald-400" },
                    { type: "Editorial tips",      time: "24 hours",         dot: "bg-amber-400" },
                    { type: "Technical / bugs",    time: "48 hours",         dot: "bg-sky-400" },
                    { type: "Press & media",       time: "Same day",         dot: "bg-ember-500" },
                  ].map(({ type, time, dot }) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
                        <span className="text-[12px] font-sans text-ink-400">{type}</span>
                      </div>
                      <span className="text-[12px] font-sans font-semibold text-white">{time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Editorial tip card */}
              <div className="bg-ember-600/8 border border-ember-600/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Newspaper size={14} className="text-ember-600" />
                  <p className="text-[12px] font-sans font-bold text-ember-700">Got a story tip?</p>
                </div>
                <p className="text-[12px] font-body text-ink-600 leading-relaxed mb-3">
                  You can submit tips anonymously. Our editorial team protects sources.
                </p>
                <a
                  href="mailto:tips@newsorbit.com"
                  className="inline-flex items-center gap-1.5 text-[12px] font-sans font-bold text-ember-600 hover:underline"
                >
                  tips@newsorbit.com <ArrowUpRight size={11} />
                </a>
              </div>

            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}