"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { apiFetch } from "@/lib/apiFetch";
import {
  Radio, Flame, Users, Shield, MapPin, Newspaper,
  Pencil, Heart, Bell, UserPlus, ArrowRight,
  CheckCircle2, Eye, BookOpen, Megaphone,
  GraduationCap, Vote, ArrowUpRight,
} from "lucide-react";
import { BsInstagram, BsTwitterX } from "react-icons/bs";
import { FaFacebook } from "react-icons/fa6";

// ─── Data ─────────────────────────────────────────────────────────────────────

type StatItem = {
  value: string;
  label: string;
  icon: typeof Eye;
};

const initialStats: StatItem[] = [
  { value: "12K+", label: "Monthly readers",   icon: Eye },
  { value: "340+", label: "Articles published", icon: Newspaper },
  { value: "80+",  label: "Community bloggers", icon: Pencil },
  { value: "15+",  label: "News categories",    icon: BookOpen },
];

const objectives = [
  {
    icon: Radio,
    title: "Platform updates",
    desc: "Official updates on the activities, programs, and resolutions of NYAN Osun State Chapter — straight from the source.",
  },
  {
    icon: Megaphone,
    title: "Youth advocacy",
    desc: "Promoting youth advocacy, leadership development, and civic responsibility across Osun State.",
  },
  {
    icon: GraduationCap,
    title: "Education & empowerment",
    desc: "Educating and empowering young people through informative articles, opportunities, and accessible resources.",
  },
  {
    icon: Users,
    title: "Amplifying voices",
    desc: "Giving young people a platform to speak on the issues affecting their communities and the nation at large.",
  },
  {
    icon: Vote,
    title: "Democratic participation",
    desc: "Encouraging active involvement in democratic processes and driving sustainable development from the ground up.",
  },
];

const features = [
  {
    icon: Flame,
    title: "Breaking news",
    desc: "Live ticker and instant alerts for fast-moving stories across Osun State.",
    accent: "bg-ember-600",
  },
  {
    icon: Newspaper,
    title: "In-depth coverage",
    desc: "Long-form reporting on politics, health, education, and the economy.",
    accent: "bg-ink-800",
  },
  {
    icon: Pencil,
    title: "Community blogs",
    desc: "Any registered member can write, publish, and build a readership.",
    accent: "bg-emerald-600",
  },
  {
    icon: UserPlus,
    title: "Follow writers",
    desc: "Follow journalists and bloggers to personalise your reading feed.",
    accent: "bg-sky-600",
  },
  {
    icon: Heart,
    title: "React & engage",
    desc: "Like, comment, and share the stories that matter most to you.",
    accent: "bg-rose-600",
  },
  {
    icon: Bell,
    title: "Smart notifications",
    desc: "Real-time alerts for new articles, comments, and writers you follow.",
    accent: "bg-amber-600",
  },
];

const values = [
  {
    icon: CheckCircle2,
    title: "Accuracy first",
    desc: "Every claim is verified before publication. We correct mistakes openly and promptly, with no exceptions.",
  },
  {
    icon: Users,
    title: "Inclusive voices",
    desc: "Osun is diverse. We amplify farmers, traders, students, and elders — not just officials and institutions.",
  },
  {
    icon: Shield,
    title: "Editorial independence",
    desc: "No advertisers or political interests shape our coverage. NewsOrbit is free from commercial influence.",
  },
  {
    icon: MapPin,
    title: "Hyper-local focus",
    desc: "We go deep where national outlets don't — local government, markets, schools, and grassroots culture.",
  },
];

const team = [
  {
    initials: "NY",
    name: "National Youth Assembly of Nigeria",
    role: "Founding Organisation · Osun State Chapter",
    bio: "NYAN Osun State Chapter is the organisation that brought NewsOrbit into existence — driven by a commitment to youth advocacy, civic engagement, and amplifying the voices of young people across Osun State and Nigeria.",
    color: "bg-ember-600/15 text-ember-700",
    social: {
      twitter:   "https://twitter.com",
      facebook:  "https://facebook.com",
      instagram: "https://instagram.com",
    },
  },
  {
    initials: "DO",
    name: "Comrade David Ojewale (D'Senator)",
    role: "Speaker, NYAN Osun State Chapter",
    bio: "As Speaker of NYAN Osun State Chapter, David leads the Assembly, coordinates legislative discussions, and represents the interests of young people — the driving force behind NewsOrbit's founding vision.",
    color: "bg-amber-600/15 text-amber-700",
    social: {
      twitter:   "https://twitter.com",
      facebook:  "https://facebook.com",
      instagram: "https://instagram.com",
    },
  },
  {
    initials: "AD",
    name: "Adetoye Daniel Kehinde",
    role: "Lead Developer",
    bio: "Full-stack engineer who designed and built the NewsOrbit platform from the ground up — architecting every layer from the API to the interface.",
    color: "bg-emerald-600/15 text-emerald-700",
    social: {
      twitter:   "https://twitter.com",
      facebook:  null,
      instagram: null,
    },
  },
];

// ─── Intersection fade hook ───────────────────────────────────────────────────

function useFadeIn(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Fade({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const { ref, visible } = useFadeIn();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Reusable section eyebrow ─────────────────────────────────────────────────

function Eyebrow({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center gap-2 mb-4">
      <span className="w-5 h-px bg-ember-600" />
      <span className="text-[10px] font-sans font-bold text-ember-600 uppercase tracking-[0.18em]">
        {text}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const [stats, setStats] = useState<StatItem[]>(initialStats);

  const formatCount = (value: number) => {
    if (value >= 1000) return `${Math.round(value / 1000)}K+`;
    return value.toString();
  };

  useEffect(() => {
    let active = true;

    apiFetch<{
      stats: {
        monthlyReaders: number;
        articlesPublished: number;
        communityBloggers: number;
        newsCategories: number;
      };
    }>("/stats", { cache: "no-store" })
      .then(({ data }) => {
        if (!active) return;
        setStats([
          { value: formatCount(data.stats.monthlyReaders), label: "Monthly readers", icon: Eye },
          { value: formatCount(data.stats.articlesPublished), label: "Articles published", icon: Newspaper },
          { value: formatCount(data.stats.communityBloggers), label: "Community bloggers", icon: Pencil },
          { value: formatCount(data.stats.newsCategories), label: "News categories", icon: BookOpen },
        ]);
      })
      .catch(() => {
        // Keep fallback stats if the backend call fails
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-(--color-bg)">
      <Navbar />

      <main className="flex-1">

        {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-ink-950">

          {/* Subtle grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)",
              backgroundSize: "48px 48px",
            }}
            aria-hidden
          />

          {/* Left ember bar */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-ember-600" aria-hidden />

          <div className="relative max-w-7xl mx-auto px-6 sm:px-10 py-24 sm:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

              {/* Left */}
              <div>
                <Fade>
                  <div className="inline-flex items-center gap-2 mb-7 px-3 py-1.5 rounded-full border border-ember-600/30 bg-ember-600/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-ember-500 animate-pulse" />
                    <span className="text-[10px] font-sans font-bold text-ember-400 uppercase tracking-widest">
                      Osun State's Independent Voice
                    </span>
                  </div>
                </Fade>

                <Fade delay={80}>
                  <h1 className="font-display text-5xl sm:text-6xl font-black text-white leading-[1.03] tracking-tight mb-6">
                    The pulse of<br />
                    <span className="text-ember-500">Osun State</span>
                  </h1>
                </Fade>

                <Fade delay={160}>
                  <p className="font-body text-ink-400 text-lg leading-relaxed mb-8 max-w-lg">
                    NewsOrbit is Osun State's digital newsroom and community platform — founded by youth, built for everyone, covering the stories that shape our state.
                  </p>
                </Fade>

                <Fade delay={220}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold text-sm rounded-xl transition-colors"
                    >
                      Join NewsOrbit <ArrowRight size={14} />
                    </Link>
                    <Link
                      href="/news"
                      className="inline-flex items-center gap-2 px-6 py-3 border border-ink-700 text-ink-300 hover:border-ink-500 hover:text-white font-sans font-semibold text-sm rounded-xl transition-colors"
                    >
                      Read the news
                    </Link>
                  </div>
                </Fade>
              </div>

              {/* Right — founder card */}
              <Fade delay={300}>
                <div className="bg-ink-900 border border-ink-800 rounded-2xl p-7">
                  <p className="text-[10px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-5">
                    Founded by
                  </p>

                  {/* Org */}
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-ink-800">
                    <div className="w-14 h-14 rounded-2xl bg-ember-600/15 border border-ember-600/20 flex items-center justify-center font-display font-black text-ember-500 text-sm shrink-0 text-center leading-tight px-1">
                      NYAN
                    </div>
                    <div>
                      <p className="font-sans font-bold text-white text-sm leading-snug">
                        National Youth Assembly of Nigeria
                      </p>
                      <p className="font-sans text-ember-500 text-xs mt-0.5">
                        Osun State Chapter
                      </p>
                      <p className="font-sans text-ink-500 text-xs mt-0.5">
                        The organisation that brought NewsOrbit into existence
                      </p>
                    </div>
                  </div>

                  {/* Speaker */}
                  {/* <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-ink-800 flex items-center justify-center font-display font-black text-ink-400 text-xs shrink-0">
                      DO
                    </div>
                    <div>
                      <p className="font-sans font-semibold text-ink-300 text-xs leading-snug">
                        Comrade David Ojewale (D'Senator)
                      </p>
                      <p className="font-sans text-ink-500 text-[11px] mt-0.5">
                        Speaker, NYAN Osun State Chapter
                      </p>
                    </div>
                  </div> */}

                  <blockquote className="font-body text-ink-300 text-sm leading-relaxed border-l-2 border-ember-600/40 pl-4">
                    "Through this platform, we are committed to fostering informed, responsible, and impactful youth leadership while advancing the collective interests of young people across Osun State and Nigeria."
                  </blockquote>
                </div>
              </Fade>

            </div>
          </div>
        </section>

        {/* ══ STATS ═════════════════════════════════════════════════════════════ */}
        <section className="border-y border-(--color-border)">
          <div className="max-w-7xl mx-auto px-6 sm:px-10">
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {stats.map(({ value, label, icon: Icon }, i) => (
                <Fade key={label} delay={i * 70}>
                  <div className={`flex items-center gap-4 py-8 px-6 ${i < 3 ? "sm:border-r border-(--color-border)" : ""} ${i < 2 ? "border-b sm:border-b-0 border-(--color-border)" : ""}`}>
                    <div className="w-10 h-10 rounded-xl bg-ember-600/10 flex items-center justify-center shrink-0">
                      <Icon size={17} className="text-ember-600" />
                    </div>
                    <div>
                      <p className="font-display text-3xl font-black text-ink-900 leading-none">{value}</p>
                      <p className="text-xs font-sans text-ink-500 mt-1">{label}</p>
                    </div>
                  </div>
                </Fade>
              ))}
            </div>
          </div>
        </section>

        {/* ══ WHY WE EXIST ══════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-6 sm:px-10 py-20 border-b border-(--color-border)">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-start">

            {/* Left */}
            <Fade>
              <Eyebrow text="Why we exist" />
              <h2 className="font-display text-4xl font-black text-ink-900 leading-tight mb-5">
                Built with purpose,{" "}
                <span className="text-ember-600">driven by youth</span>
              </h2>
              <p className="font-body text-ink-600 leading-relaxed mb-4">
                NewsOrbit was founded by Comrade David Ojewale (D'Senator), Speaker of the National Youth Assembly of Nigeria (NYAN), Osun State Chapter — with a clear and deliberate mission.
              </p>
              <p className="font-body text-ink-600 leading-relaxed mb-4">
                This platform was established as an official medium for communication, information sharing, and youth engagement. It exists to ensure that the voices of young people across Osun State are heard, celebrated, and acted upon.
              </p>
              <p className="font-body text-ink-600 leading-relaxed">
                The goal is simple: foster informed, responsible, and impactful youth leadership — while advancing the collective interests of every young person in Osun State and beyond.
              </p>
            </Fade>

            {/* Right — objectives */}
            <div className="space-y-3">
              <Fade>
                <p className="text-[10px] font-sans font-bold text-ink-400 uppercase tracking-widest mb-4">
                  Platform objectives
                </p>
              </Fade>
              {objectives.map(({ icon: Icon, title, desc }, i) => (
                <Fade key={title} delay={i * 60}>
                  <div className="group flex items-start gap-4 p-4 bg-white border border-(--color-border) rounded-xl hover:border-ember-600/25 hover:shadow-sm transition-all duration-200">
                    <div className="w-8 h-8 rounded-lg bg-ember-600/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-ember-600/15 transition-colors">
                      <Icon size={15} className="text-ember-600" />
                    </div>
                    <div>
                      <p className="font-sans font-bold text-ink-900 text-sm mb-0.5">{title}</p>
                      <p className="font-body text-ink-500 text-xs leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </Fade>
              ))}
            </div>

          </div>
        </section>

        {/* ══ MISSION ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-6 sm:px-10 py-20 border-b border-(--color-border)">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">

            <Fade>
              <Eyebrow text="Our mission" />
              <h2 className="font-display text-4xl font-black text-ink-900 leading-tight mb-5">
                Informing every corner of Osun
              </h2>
              <p className="font-body text-ink-600 leading-relaxed mb-4">
                We exist to give every person in Osun State access to accurate, timely, and local news — and a platform to share their own voice. From Osogbo to Ilesa, Ife to Ede, NewsOrbit covers it all.
              </p>
              <p className="font-body text-ink-600 leading-relaxed">
                Professional journalism combined with an open community platform. Staff reporters handle breaking news and investigations; registered members publish their own blogs and perspectives — no editorial gatekeeping required.
              </p>
            </Fade>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Newspaper, title: "Professional journalism", desc: "Verified writers deliver fact-checked, unbiased reporting on the stories shaping Osun.", bg: "bg-ember-600" },
                { icon: Users,     title: "Community voices",        desc: "Any registered member can publish — sharing perspectives and grassroots stories.",         bg: "bg-ink-900" },
                { icon: Shield,    title: "Editorial independence",   desc: "No advertisers or political interests shape our coverage. Ever.",                         bg: "bg-ink-900" },
                { icon: MapPin,    title: "Hyper-local focus",        desc: "We go deep where national outlets don't — local government, markets, schools.",           bg: "bg-ember-600" },
              ].map(({ icon: Icon, title, desc, bg }, i) => (
                <Fade key={title} delay={i * 70}>
                  <div className="bg-white border border-(--color-border) rounded-2xl p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                    <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                      <Icon size={15} className="text-white" />
                    </div>
                    <h3 className="font-sans font-bold text-ink-900 text-sm mb-1.5">{title}</h3>
                    <p className="font-body text-ink-500 text-xs leading-relaxed">{desc}</p>
                  </div>
                </Fade>
              ))}
            </div>

          </div>
        </section>

        {/* ══ FEATURES ══════════════════════════════════════════════════════════ */}
        <section className="bg-ink-950 py-20 border-b border-ink-800">
          <div className="max-w-7xl mx-auto px-6 sm:px-10">

            <Fade>
              <div className="max-w-xl mb-12">
                <Eyebrow text="Platform features" />
                <h2 className="font-display text-4xl font-black text-white leading-tight">
                  Everything in one place
                </h2>
                <p className="font-body text-ink-400 mt-3 text-sm leading-relaxed">
                  One platform for breaking news, long-form journalism, community stories, and social connection.
                </p>
              </div>
            </Fade>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map(({ icon: Icon, title, desc, accent }, i) => (
                <Fade key={title} delay={i * 55}>
                  <div className="group bg-ink-900 border border-ink-800 hover:border-ember-600/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5">
                    <div className={`w-9 h-9 rounded-xl ${accent} flex items-center justify-center mb-4`}>
                      <Icon size={16} className="text-white" />
                    </div>
                    <h3 className="font-sans font-bold text-white text-sm mb-2">{title}</h3>
                    <p className="font-body text-ink-400 text-xs leading-relaxed">{desc}</p>
                  </div>
                </Fade>
              ))}
            </div>

          </div>
        </section>

        {/* ══ VALUES ════════════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-6 sm:px-10 py-20 border-b border-(--color-border)">
          <Fade>
            <div className="max-w-xl mb-12">
              <Eyebrow text="Our values" />
              <h2 className="font-display text-4xl font-black text-ink-900 leading-tight">
                What we stand for
              </h2>
            </div>
          </Fade>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {values.map(({ icon: Icon, title, desc }, i) => (
              <Fade key={title} delay={i * 70}>
                <div className="flex items-start gap-5 p-6 bg-white border border-(--color-border) rounded-2xl hover:shadow-md transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-ember-600/10 flex items-center justify-center shrink-0">
                    <Icon size={17} className="text-ember-600" />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-ink-900 text-sm mb-1.5">{title}</h3>
                    <p className="font-body text-ink-500 text-xs leading-relaxed">{desc}</p>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </section>

        {/* ══ TEAM ══════════════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-6 sm:px-10 py-20 border-b border-(--color-border)">
          <Fade>
            <div className="max-w-xl mb-12">
              <Eyebrow text="The team" />
              <h2 className="font-display text-4xl font-black text-ink-900 leading-tight mb-3">
                The people behind NewsOrbit
              </h2>
              <p className="font-body text-ink-500 text-sm leading-relaxed">
                A small, passionate team of advocates, journalists, and technologists dedicated to serving Osun State.
              </p>
            </div>
          </Fade>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map(({ initials, name, role, bio, color, social }, i) => (
              <Fade key={name} delay={i * 80}>
                <div className="bg-white border border-(--color-border) rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full">
                  <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center font-display font-black text-lg mb-5`}>
                    {initials}
                  </div>
                  <h3 className="font-display font-bold text-ink-900 text-base leading-snug mb-0.5">{name}</h3>
                  <p className="text-xs font-sans font-semibold text-ember-600 mb-3">{role}</p>
                  <p className="font-body text-ink-500 text-xs leading-relaxed flex-1">{bio}</p>

                  {/* Social links */}
                  {/* <div className="flex items-center gap-2 mt-5 pt-4 border-t border-(--color-border)">
                    {social.twitter && (
                      <a href={social.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter"
                        className="w-8 h-8 rounded-lg border border-(--color-border) flex items-center justify-center text-ink-400 hover:text-ink-900 hover:border-ink-300 transition-colors">
                        <BsTwitterX size={13} />
                      </a>
                    )}
                    {social.facebook && (
                      <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                        className="w-8 h-8 rounded-lg border border-(--color-border) flex items-center justify-center text-ink-400 hover:text-ink-900 hover:border-ink-300 transition-colors">
                        <FaFacebook size={13} />
                      </a>
                    )}
                    {social.instagram && (
                      <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                        className="w-8 h-8 rounded-lg border border-(--color-border) flex items-center justify-center text-ink-400 hover:text-ink-900 hover:border-ink-300 transition-colors">
                        <BsInstagram size={13} />
                      </a>
                    )}
                    <a href="/contact" className="ml-auto inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-ink-400 hover:text-ember-600 transition-colors">
                      Get in touch <ArrowUpRight size={11} />
                    </a>
                  </div> */}
                </div>
              </Fade>
            ))}
          </div>
        </section>

        {/* ══ CTA ═══════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-ember-600 py-20">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(-45deg,rgba(255,255,255,0.04) 0,rgba(255,255,255,0.04) 1px,transparent 0,transparent 50%)",
              backgroundSize: "20px 20px",
            }}
            aria-hidden
          />
          <div className="absolute right-0 bottom-0 pointer-events-none select-none overflow-hidden leading-none" aria-hidden>
            <span className="font-display text-[200px] font-black text-white/5 leading-none tracking-tighter whitespace-nowrap">
              Gist
            </span>
          </div>

          <div className="relative max-w-7xl mx-auto px-6 sm:px-10 text-center">
            <Fade>
              <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-white/15 border border-white/25">
                <Radio size={11} className="text-white" />
                <span className="text-[10px] font-sans font-bold text-white uppercase tracking-widest">
                  Join the community
                </span>
              </div>
              <h2 className="font-display text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
                Be part of the story
              </h2>
              <p className="font-body text-white/75 text-base max-w-md mx-auto leading-relaxed mb-8">
                Join thousands of Osun residents reading, writing, and connecting on NewsOrbit. Your voice matters here.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-ember-600 hover:bg-ember-50 font-sans font-bold text-sm rounded-xl transition-colors"
                >
                  <UserPlus size={14} /> Join free
                </Link>
                <Link
                  href="/blogs/create"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 border border-white/25 hover:bg-white/20 text-white font-sans font-bold text-sm rounded-xl transition-colors"
                >
                  <Pencil size={14} /> Start writing
                </Link>
              </div>
            </Fade>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}