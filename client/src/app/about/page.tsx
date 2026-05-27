"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Radio, Flame, Users, Shield, MapPin, Newspaper,
  Pencil, Heart, Bell, UserPlus, ArrowRight,
  Quote, CheckCircle2, Eye, BookOpen,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const stats = [
  { value: "12K+",  label: "Monthly readers",    icon: Eye },
  { value: "340+",  label: "Articles published",  icon: Newspaper },
  { value: "80+",   label: "Community bloggers",  icon: Pencil },
  { value: "15+",   label: "News categories",     icon: BookOpen },
];

const features = [
  {
    icon: Flame,
    title: "Breaking news",
    desc: "Live ticker and instant alerts for fast-moving stories across Osun State.",
    accent: "bg-ember-600/10 text-ember-600",
  },
  {
    icon: Newspaper,
    title: "In-depth coverage",
    desc: "Long-form reporting on politics, health, education, and the economy.",
    accent: "bg-ink-900/10 text-ink-900",
  },
  {
    icon: Pencil,
    title: "Community blogs",
    desc: "Any registered member can write, publish, and build a readership.",
    accent: "bg-emerald-600/10 text-emerald-600",
  },
  {
    icon: UserPlus,
    title: "Follow writers",
    desc: "Follow journalists and bloggers to personalise your reading feed.",
    accent: "bg-sky-600/10 text-sky-600",
  },
  {
    icon: Heart,
    title: "React & engage",
    desc: "Like, comment, and share the stories that matter most to you.",
    accent: "bg-rose-600/10 text-rose-600",
  },
  {
    icon: Bell,
    title: "Smart notifications",
    desc: "Real-time alerts for new articles, comments, and writers you follow.",
    accent: "bg-amber-600/10 text-amber-600",
  },
];

const values = [
  {
    num: "01",
    title: "Accuracy first",
    desc: "Every claim is verified before publication. We correct mistakes openly and promptly, with no exceptions.",
    icon: CheckCircle2,
  },
  {
    num: "02",
    title: "Inclusive voices",
    desc: "Osun is diverse. We amplify farmers, traders, students, and elders — not just officials and institutions.",
    icon: Users,
  },
  {
    num: "03",
    title: "Editorial independence",
    desc: "No advertisers or political interests shape our coverage. OsunGist is free from commercial influence.",
    icon: Shield,
  },
  {
    num: "04",
    title: "Hyper-local focus",
    desc: "We go deep where national outlets don't — local government, markets, schools, and grassroots culture.",
    icon: MapPin,
  },
];

const team = [
//   {
//     initials: "AO",
//     name: "Nigerian Youth Assembly Network",
//     role: "For the youth",
//     bio: "NYAN Executive which bring ideas and comiment to the project",
//     color: "bg-ember-600/15 text-ember-700",
//   },
//   {
//     initials: "FK",
//     name: "Fatima Kareem",
//     role: "Head of Community",
//     bio: "Bridges the editorial team and the thousands of community voices on the platform.",
//     color: "bg-sky-600/15 text-sky-700",
//   },
  {
    initials: "AD",
    name: "Adetoye Daniel Kehinde",
    role: "Lead Developer",
    bio: "Full-stack engineer who designed and built the OsunGist platform from the ground up.",
    color: "bg-emerald-600/15 text-emerald-700",
  },
//   {
//     initials: "SA",
//     name: "Sola Adeyemi",
//     role: "Senior Reporter",
//     bio: "Specialises in education, health, and social policy across Osun's 30 local governments.",
//     color: "bg-amber-600/15 text-amber-700",
//   },
//   {
//     initials: "RO",
//     name: "Remi Ogundimu",
//     role: "Photo & Media",
//     bio: "Award-winning photojournalist documenting everyday life and major events across Osun.",
//     color: "bg-rose-600/15 text-rose-700",
//   },
//   {
//     initials: "NA",
//     name: "Ngozi Abubakar",
//     role: "Community Editor",
//     bio: "Reviews and supports community blog posts, ensuring quality and fairness across all voices.",
//     color: "bg-violet-600/15 text-violet-700",
//   },
];

// ─── Fade-in hook ─────────────────────────────────────────────────────────────

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ─── Section wrapper with fade ────────────────────────────────────────────────

function FadeSection({ children, className = "", delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const { ref, visible } = useFadeIn();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center gap-2.5 mb-4">
      <span className="w-6 h-px bg-ember-600" />
      <span className="text-[11px] font-sans font-bold text-ember-600 uppercase tracking-[0.15em]">
        {text}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-(--color-bg)">
      <Navbar />

      <main className="flex-1">

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-(--color-border)">
          {/* Ruled-paper background lines */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(0,0,0,0.04) 47px, rgba(0,0,0,0.04) 48px)",
            }}
          />
          {/* Large ghost wordmark */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none select-none overflow-hidden">
            <span
              className="font-display text-[160px] font-black text-ink-900/3 leading-none tracking-tighter whitespace-nowrap"
              aria-hidden
            >
              OsunGist
            </span>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
            <div className="max-w-2xl">
              <FadeSection>
                <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-ember-600/10 border border-ember-600/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-ember-600 animate-pulse" />
                  <span className="text-[11px] font-sans font-bold text-ember-600 uppercase tracking-widest">
                    Osun State's Independent Voice
                  </span>
                </div>
              </FadeSection>

              <FadeSection delay={100}>
                <h1 className="font-display text-5xl sm:text-6xl font-black text-ink-900 leading-[1.05] tracking-tight mb-6">
                  The pulse of{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 text-ember-600">Osun State</span>
                    <span
                      className="absolute bottom-1 left-0 right-0 h-3 bg-ember-600/15 z-0 -skew-x-2"
                      aria-hidden
                    />
                  </span>
                </h1>
              </FadeSection>

              <FadeSection delay={200}>
                <p className="font-body text-lg text-ink-600 leading-relaxed mb-8 max-w-lg">
                  OsunGist is Osun State's digital newsroom and community platform — bringing together professional journalists and everyday citizens to tell the stories that matter most.
                </p>
              </FadeSection>

              <FadeSection delay={300}>
                <div className="flex items-center gap-3 flex-wrap">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold text-sm rounded-xl transition-colors"
                  >
                    Join OsunGist <ArrowRight size={15} />
                  </Link>
                  <Link
                    href="/news"
                    className="inline-flex items-center gap-2 px-6 py-3 border border-(--color-border) text-ink-700 hover:bg-ink-50 font-sans font-semibold text-sm rounded-xl transition-colors"
                  >
                    Read the news
                  </Link>
                </div>
              </FadeSection>
            </div>
          </div>
        </section>

        {/* ── STATS ─────────────────────────────────────────────────────────── */}
        <section className="border-b border-(--color-border)">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-(--color-border)">
              {stats.map(({ value, label, icon: Icon }, i) => (
                <FadeSection key={label} delay={i * 80}>
                  <div className="flex items-center gap-4 px-6 sm:px-8 py-7">
                    <div className="w-10 h-10 rounded-xl bg-ember-600/10 flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-ember-600" />
                    </div>
                    <div>
                      <p className="font-display text-3xl font-black text-ink-900 leading-none">
                        {value}
                      </p>
                      <p className="text-xs font-sans text-ink-500 mt-1">{label}</p>
                    </div>
                  </div>
                </FadeSection>
              ))}
            </div>
          </div>
        </section>

        {/* ── MISSION ───────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 border-b border-(--color-border)">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <FadeSection>
              <SectionLabel text="Our mission" />
              <h2 className="font-display text-4xl font-black text-ink-900 leading-tight mb-5">
                Informing and connecting every corner of Osun
              </h2>
              <p className="font-body text-ink-600 leading-relaxed mb-5">
                We exist to give every person in Osun State access to accurate, timely, and local news — and a platform to share their own voice. From Osogbo to Ilesa, Ife to Ede, OsunGist covers it all.
              </p>
              <p className="font-body text-ink-600 leading-relaxed">
                Our model is simple: professional journalism combined with an open community platform. Staff reporters handle breaking news and investigations; registered members publish their own blogs and perspectives — no editorial gatekeeping required.
              </p>
            </FadeSection>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Newspaper,
                  title: "Professional journalism",
                  desc: "Verified writers deliver fact-checked, unbiased reporting on the stories shaping Osun.",
                  bg: "bg-ember-600",
                },
                {
                  icon: Users,
                  title: "Community voices",
                  desc: "Any registered member can publish — sharing perspectives and grassroots stories.",
                  bg: "bg-ink-900",
                },
                {
                  icon: Shield,
                  title: "Editorial independence",
                  desc: "No advertisers or political interests shape our coverage. Ever.",
                  bg: "bg-ink-900",
                },
                {
                  icon: MapPin,
                  title: "Hyper-local focus",
                  desc: "We go deep where national outlets don't — local government, markets, schools.",
                  bg: "bg-ember-600",
                },
              ].map(({ icon: Icon, title, desc, bg }, i) => (
                <FadeSection key={title} delay={i * 80}>
                  <div className="bg-white border border-(--color-border) rounded-2xl p-5 hover:shadow-md transition-all duration-300">
                    <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                      <Icon size={16} className="text-white" />
                    </div>
                    <h3 className="font-display font-bold text-ink-900 text-sm mb-1.5">{title}</h3>
                    <p className="font-body text-ink-500 text-xs leading-relaxed">{desc}</p>
                  </div>
                </FadeSection>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ──────────────────────────────────────────────────────── */}
        <section className="bg-ink-950 py-20 border-b border-ink-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <FadeSection>
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2.5 mb-4">
                  <span className="w-6 h-px bg-ember-500" />
                  <span className="text-[11px] font-sans font-bold text-ember-500 uppercase tracking-[0.15em]">
                    Platform features
                  </span>
                  <span className="w-6 h-px bg-ember-500" />
                </div>
                <h2 className="font-display text-4xl font-black text-white leading-tight">
                  Everything in one place
                </h2>
                <p className="font-body text-ink-400 mt-3 max-w-md mx-auto text-sm leading-relaxed">
                  One platform for breaking news, long-form journalism, community stories, and social connection.
                </p>
              </div>
            </FadeSection>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map(({ icon: Icon, title, desc, accent }, i) => (
                <FadeSection key={title} delay={i * 60}>
                  <div className="group bg-ink-900 border border-ink-800 hover:border-ember-600/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5">
                    <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center mb-4`}>
                      <Icon size={18} />
                    </div>
                    <h3 className="font-display font-bold text-white text-sm mb-2">{title}</h3>
                    <p className="font-body text-ink-400 text-xs leading-relaxed">{desc}</p>
                  </div>
                </FadeSection>
              ))}
            </div>
          </div>
        </section>

        {/* ── QUOTE ─────────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 border-b border-(--color-border)">
          <FadeSection>
            <div className="relative max-w-3xl mx-auto text-center">
              <Quote
                size={48}
                className="text-ember-600/20 mx-auto mb-6"
                strokeWidth={1}
              />
              <blockquote className="font-display text-2xl sm:text-3xl font-bold text-ink-900 leading-snug mb-6">
                "Every story in Osun State deserves to be told — by those who live it, work in it, and shape it."
              </blockquote>
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-ember-600/15 flex items-center justify-center text-ember-700 font-bold text-sm">
                  NY
                </div>
                <div className="text-left">
                  <p className="font-sans font-semibold text-ink-900 text-sm">Nigerian Youth Assembly  Network</p>
                  <p className="font-sans text-ink-500 text-xs">Editor-in-Chief, OsunGist</p>
                </div>
              </div>
            </div>
          </FadeSection>
        </section>

        {/* ── VALUES ────────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 border-b border-(--color-border)">
          <FadeSection>
            <div className="text-center mb-12">
              <SectionLabel text="Our values" />
              <h2 className="font-display text-4xl font-black text-ink-900 leading-tight">
                What we stand for
              </h2>
            </div>
          </FadeSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map(({ num, title, desc, icon: Icon }, i) => (
              <FadeSection key={title} delay={i * 80}>
                <div className="flex items-start gap-5 p-6 bg-white border border-(--color-border) rounded-2xl hover:shadow-md transition-all duration-300">
                  <span className="font-display text-4xl font-black text-ember-600/20 leading-none shrink-0 select-none">
                    {num}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={15} className="text-ember-600" />
                      <h3 className="font-display font-bold text-ink-900 text-base">{title}</h3>
                    </div>
                    <p className="font-body text-ink-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>
        </section>

        {/* ── TEAM ──────────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 border-b border-(--color-border)">
          <FadeSection>
            <div className="text-center mb-12">
              <SectionLabel text="The team" />
              <h2 className="font-display text-4xl font-black text-ink-900 leading-tight mb-3">
                The people behind OsunGist
              </h2>
              <p className="font-body text-ink-500 text-sm max-w-md mx-auto leading-relaxed">
                A small, passionate team of journalists, editors, and technologists dedicated to serving Osun State.
              </p>
            </div>
          </FadeSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {team.map(({ initials, name, role, bio, color }, i) => (
              <FadeSection key={name} delay={i * 60}>
                <div className="group bg-white border border-(--color-border) rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center font-display font-black text-lg mb-4`}>
                    {initials}
                  </div>
                  <h3 className="font-display font-bold text-ink-900 text-base mb-0.5">{name}</h3>
                  <p className="text-xs font-sans font-semibold text-ember-600 mb-3">{role}</p>
                  <p className="font-body text-ink-500 text-xs leading-relaxed">{bio}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-ember-600 py-20">
          {/* Diagonal stripe overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 0, transparent 50%)",
              backgroundSize: "20px 20px",
            }}
            aria-hidden
          />
          {/* Ghost text */}
          <div className="absolute right-0 bottom-0 pointer-events-none select-none overflow-hidden leading-none">
            <span className="font-display text-[200px] font-black text-white/5 leading-none tracking-tighter whitespace-nowrap" aria-hidden>
              Gist
            </span>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <FadeSection>
              <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-white/20 border border-white/30">
                <Radio size={12} className="text-white" />
                <span className="text-[11px] font-sans font-bold text-white uppercase tracking-widest">
                  Join the community
                </span>
              </div>
              <h2 className="font-display text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
                Be part of the story
              </h2>
              <p className="font-body text-white/80 text-base max-w-md mx-auto leading-relaxed mb-8">
                Join thousands of Osun residents reading, writing, and connecting on OsunGist. Your voice matters here.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-ember-600 hover:bg-ember-50 font-sans font-bold text-sm rounded-xl transition-colors"
                >
                  <UserPlus size={15} /> Join free
                </Link>
                <Link
                  href="/blogs/create"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 border border-white/30 hover:bg-white/20 text-white font-sans font-bold text-sm rounded-xl transition-colors"
                >
                  <Pencil size={15} /> Start writing
                </Link>
              </div>
            </FadeSection>
          </div>
        </section>

      </main>

      

      <Footer />
    </div>
  );
}