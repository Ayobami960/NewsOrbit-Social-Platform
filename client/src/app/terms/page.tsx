"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Radio, ArrowUp, FileText } from "lucide-react";

// ─── TOC ──────────────────────────────────────────────────────────────────────

const sections = [
  { id: "acceptance",   label: "Acceptance of terms" },
  { id: "eligibility",  label: "Eligibility" },
  { id: "accounts", label: "User accounts" },
  { id: "content", label: "Content & conduct" },
  { id: "ip", label: "Intellectual property" },
  { id: "privacy", label: "Privacy" },
  { id: "third-party", label: "Third-party links" },
  { id: "disclaimer", label: "Disclaimers" },
  { id: "liability", label: "Limitation of liability" },
  { id: "termination", label: "Termination" },
  { id: "changes", label: "Changes to terms" },
  { id: "contact", label: "Contact us" },
];

// ─── Components ───────────────────────────────────────────────────────────────

function SectionTitle({ id, num, children }: {
  id: string; num: string; children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="group flex items-start gap-4 font-display text-2xl font-black text-ink-900 mb-4 scroll-mt-28"
    >
      <span className="shrink-0 font-display text-[11px] font-bold text-ember-600 border border-ember-600/30 bg-ember-600/5 rounded px-1.5 py-0.5 mt-1.5 tracking-widest">
        {num}
      </span>
      <span>{children}</span>
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-body text-[15px] text-ink-600 leading-[1.85] mb-4">
      {children}
    </p>
  );
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="mb-5 space-y-2.5 ml-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-1.75 w-1.5 h-1.5 rounded-full bg-ember-600 shrink-0" />
          <span className="font-body text-[15px] text-ink-600 leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-10">
      <div className="flex-1 h-px bg-(--color-border)" />
      <div className="w-1.5 h-1.5 rounded-full bg-ember-600/40" />
      <div className="flex-1 h-px bg-(--color-border)" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TermsPage() {
  const [activeId, setActiveId]   = useState("acceptance");
//   const [showTop,  setShowTop]    = useState(false);
  const contentRef                = useRef<HTMLDivElement>(null);

//   // Track scroll for active TOC item + back-to-top button
//   useEffect(() => {
//     const onScroll = () => {
//       setShowTop(window.scrollY > 400);

//       const offsets = sections.map(({ id }) => {
//         const el = document.getElementById(id);
//         return { id, top: el ? el.getBoundingClientRect().top : Infinity };
//       });
//       const current = offsets.filter(o => o.top <= 130).at(-1);
//       if (current) setActiveId(current.id);
//     };

//     window.addEventListener("scroll", onScroll, { passive: true });
//     return () => window.removeEventListener("scroll", onScroll);
//   }, []);

  return (
    <div className="min-h-screen flex flex-col bg-(--color-bg)">
      <Navbar />

      <main className="flex-1">

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <div className="border-b border-(--color-border) relative overflow-hidden">
          {/* Ruled lines */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg,transparent,transparent 47px,rgba(0,0,0,0.035) 47px,rgba(0,0,0,0.035) 48px)",
            }}
            aria-hidden
          />
          {/* Ghost wordmark */}
          <div className="absolute right-0 bottom-0 pointer-events-none select-none overflow-hidden" aria-hidden>
            <span className="font-display text-[180px] font-black text-ink-900/2.5 leading-none tracking-tighter whitespace-nowrap">
              Terms
            </span>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-7 h-7 bg-ember-600 rounded-sm flex items-center justify-center">
                <Radio size={13} className="text-white" />
              </div>
              <span className="font-sans text-sm font-semibold text-ink-400">NewsOrbit</span>
              <span className="text-ink-300">/</span>
              <span className="font-sans text-sm font-semibold text-ink-700">Terms of Use</span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl font-black text-ink-900 leading-[1.05] tracking-tight mb-5">
              Terms of{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-ember-600">Use</span>
                <span
                  className="absolute bottom-1 left-0 right-0 h-3 bg-ember-600/12 z-0 -skew-x-2"
                  aria-hidden
                />
              </span>
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm font-sans text-ink-500">
              <span className="flex items-center gap-1.5">
                <FileText size={13} className="text-ink-400" />
                Effective date: <strong className="text-ink-700 font-semibold">1 January 2025</strong>
              </span>
              <span className="flex items-center gap-1.5">
                Last updated: <strong className="text-ink-700 font-semibold">27 May 2026</strong>
              </span>
            </div>
          </div>
        </div>

        {/* ── BODY ──────────────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-start gap-12">

            {/* ── Sticky TOC ────────────────────────────────────────────────── */}
            <aside className="hidden lg:block w-60 shrink-0 sticky top-24 self-start">
              <p className="text-[10px] font-sans font-bold text-ink-400 uppercase tracking-[0.18em] mb-3">
                Contents
              </p>
              <nav aria-label="Table of contents">
                <ul className="space-y-0.5">
                  {sections.map(({ id, label }) => (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        onClick={e => {
                          e.preventDefault();
                          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className={`
                          group flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-[13px] font-sans
                          transition-all duration-150
                          ${activeId === id
                            ? "bg-ember-600/8 text-ember-600 font-semibold"
                            : "text-ink-500 hover:text-ink-900 hover:bg-ink-50"
                          }
                        `}
                      >
                        <span
                          className={`w-1 h-1 rounded-full shrink-0 transition-all ${
                            activeId === id ? "bg-ember-600 scale-125" : "bg-ink-300 group-hover:bg-ink-500"
                          }`}
                        />
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Agreement note */}
              <div className="mt-6 p-3 bg-ember-600/6 border border-ember-600/15 rounded-xl">
                <p className="text-[11px] font-sans text-ink-600 leading-relaxed">
                  By using NewsOrbit you agree to these terms. Questions?{" "}
                  <Link href="/contact" className="text-ember-600 hover:underline font-semibold">
                    Contact us
                  </Link>.
                </p>
              </div>
            </aside>

            {/* ── Content ───────────────────────────────────────────────────── */}
            <article ref={contentRef} className="flex-1 min-w-0 max-w-2xl">

              {/* Intro */}
              <div className="bg-ink-950 rounded-2xl p-6 mb-10">
                <p className="font-body text-[15px] text-ink-300 leading-[1.85]">
                  Welcome to <span className="text-white font-semibold">NewsOrbit</span> — Osun State's digital newsroom and community platform. These Terms of Use govern your access to and use of our website, mobile application, and all related services. Please read them carefully. By accessing or using NewsOrbit, you agree to be bound by these terms.
                </p>
              </div>

              {/* 1 */}
              <SectionTitle id="acceptance" num="§01">
                Acceptance of terms
              </SectionTitle>
              <P>
                By accessing or using the NewsOrbit platform — including our website, mobile applications, and any associated services — you confirm that you have read, understood, and agree to be bound by these Terms of Use and our Privacy Policy. If you do not agree with any part of these terms, you must not use our services.
              </P>
              <P>
                These terms constitute a legally binding agreement between you and NewsOrbit. Your continued use of the platform following any updates to these terms constitutes acceptance of the revised terms.
              </P>

              <Divider />

              {/* 2 */}
              <SectionTitle id="eligibility" num="§02">
                Eligibility
              </SectionTitle>
              <P>
                To use NewsOrbit, you must meet the following eligibility requirements:
              </P>
              <Ul items={[
                "You must be at least 13 years of age to create an account. Users under 18 require parental or guardian consent.",
                "You must provide accurate, complete, and current information during registration.",
                "You must not be prohibited from using our services under applicable laws in Nigeria or any other jurisdiction.",
                "You must not have previously had an account suspended or terminated by NewsOrbit for violations of these terms.",
              ]} />

              <Divider />

              {/* 3 */}
              <SectionTitle id="accounts" num="§03">
                User accounts
              </SectionTitle>
              <P>
                When you register for an account on NewsOrbit, you are responsible for maintaining the confidentiality of your login credentials. You agree to:
              </P>
              <Ul items={[
                "Keep your password secure and not share it with any third party.",
                "Notify NewsOrbit immediately at support@newsorbit.com if you suspect unauthorized access to your account.",
                "Accept responsibility for all activity that occurs under your account.",
                "Not create more than one account per person without our prior written consent.",
                "Not use another person's account without permission.",
              ]} />
              <P>
                NewsOrbit reserves the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or are inactive for an extended period without prior notice.
              </P>

              <Divider />

              {/* 4 */}
              <SectionTitle id="content" num="§04">
                Content &amp; conduct
              </SectionTitle>
              <P>
                NewsOrbit is a platform for news, information, and community expression. You are solely responsible for any content you post, publish, or share — including blog posts, comments, and profile information. By submitting content, you represent that it does not violate any applicable laws or third-party rights.
              </P>
              <P>You agree not to post or transmit content that:</P>
              <Ul items={[
                "Is false, misleading, defamatory, or constitutes misinformation.",
                "Is obscene, pornographic, violent, or otherwise offensive to community standards.",
                "Incites hatred, discrimination, or violence against any individual or group based on race, ethnicity, religion, gender, or other characteristics.",
                "Infringes the intellectual property rights of any third party.",
                "Contains spam, unsolicited advertising, or malicious code.",
                "Violates the privacy of any individual, including publishing personal information without consent.",
                "Impersonates any person or entity, or misrepresents your affiliation.",
              ]} />
              <P>
                NewsOrbit reserves the right — but is not obligated — to monitor, edit, or remove content that violates these guidelines. Repeated violations may result in permanent account termination.
              </P>

              <Divider />

              {/* 5 */}
              <SectionTitle id="ip" num="§05">
                Intellectual property
              </SectionTitle>
              <P>
                All content produced by NewsOrbit's editorial team — including articles, photographs, graphics, and the platform design — is the exclusive property of NewsOrbit and protected under Nigerian copyright law and applicable international treaties.
              </P>
              <P>
                When you publish content on NewsOrbit (such as community blog posts), you retain ownership of your original work. However, you grant NewsOrbit a non-exclusive, royalty-free, worldwide licence to display, distribute, and promote that content on our platform and associated channels.
              </P>
              <P>
                You may not reproduce, republish, or distribute NewsOrbit's editorial content without prior written permission. Fair use quotations with attribution are permitted for journalistic and educational purposes.
              </P>

              <Divider />

              {/* 6 */}
              <SectionTitle id="privacy" num="§06">
                Privacy
              </SectionTitle>
              <P>
                Your use of NewsOrbit is also governed by our Privacy Policy, which is incorporated into these terms by reference. Our Privacy Policy describes how we collect, use, and protect your personal data in accordance with the Nigeria Data Protection Act (NDPA) 2023.
              </P>
              <P>
                By using NewsOrbit, you consent to the collection and use of your information as described in our Privacy Policy. We do not sell your personal data to third parties.
              </P>

              <Divider />

              {/* 7 */}
              <SectionTitle id="third-party" num="§07">
                Third-party links
              </SectionTitle>
              <P>
                NewsOrbit may contain links to third-party websites, social media platforms, or external content. These links are provided for convenience only. We do not endorse, control, or accept responsibility for the content, privacy practices, or accuracy of any third-party site. Accessing third-party links is at your own risk.
              </P>

              <Divider />

              {/* 8 */}
              <SectionTitle id="disclaimer" num="§08">
                Disclaimers
              </SectionTitle>
              <P>
                NewsOrbit provides its platform and content on an "as is" and "as available" basis. While we strive for accuracy in all editorial content, we make no warranties — express or implied — regarding:
              </P>
              <Ul items={[
                "The completeness, accuracy, or timeliness of any news article, blog post, or other content.",
                "The uninterrupted or error-free availability of the platform.",
                "The fitness of our services for any particular purpose.",
                "The accuracy of community-generated blog posts, which reflect the views of individual authors.",
              ]} />
              <P>
                Community blog posts represent the personal views of their authors and do not reflect the editorial position of NewsOrbit. We are not responsible for any errors or omissions in community content.
              </P>

              <Divider />

              {/* 9 */}
              <SectionTitle id="liability" num="§09">
                Limitation of liability
              </SectionTitle>
              <P>
                To the fullest extent permitted by applicable Nigerian law, NewsOrbit and its officers, directors, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from:
              </P>
              <Ul items={[
                "Your use of or inability to access the platform.",
                "Any content posted on the platform by third parties.",
                "Unauthorised access to or alteration of your account or transmissions.",
                "Any errors, inaccuracies, or omissions in content.",
              ]} />
              <P>
                Our total aggregate liability to you for any claims arising under or related to these terms shall not exceed the amount you paid to NewsOrbit, if any, in the twelve months prior to the claim.
              </P>

              <Divider />

              {/* 10 */}
              <SectionTitle id="termination" num="§10">
                Termination
              </SectionTitle>
              <P>
                You may delete your account at any time from your account settings page. Upon deletion, your published blogs will be removed from public view within 48 hours.
              </P>
              <P>
                NewsOrbit reserves the right to suspend or terminate your account at any time, with or without notice, if we reasonably believe you have violated these terms, engaged in harmful conduct, or for any other reason at our sole discretion. Termination does not affect any rights or obligations that arose prior to termination.
              </P>

              <Divider />

              {/* 11 */}
              <SectionTitle id="changes" num="§11">
                Changes to terms
              </SectionTitle>
              <P>
                NewsOrbit reserves the right to modify these Terms of Use at any time. When we make material changes, we will:
              </P>
              <Ul items={[
                "Update the Last updated date at the top of this page.",
                "Display a notice on the platform for at least 14 days following the change.",
                "Send a notification to registered users via email or in-app alert for significant changes.",
              ]} />
              <P>
                Your continued use of NewsOrbit after changes become effective constitutes your acceptance of the revised terms. If you do not agree to any updated terms, you must stop using the platform and may delete your account.
              </P>

              <Divider />

              {/* 12 */}
              <SectionTitle id="contact" num="§12">
                Contact us
              </SectionTitle>
              <P>
                If you have any questions, concerns, or complaints about these Terms of Use, please contact our legal team:
              </P>
              <div className="bg-white border border-(--color-border) rounded-2xl p-6 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Email", value: "legal@newsorbit.com" },
                    { label: "Support", value: "support@newsorbit.com" },
                    { label: "Address", value: "Osogbo, Osun State, Nigeria" },
                    { label: "Response time", value: "Within 5 business days" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-1">
                      <span className="text-[10px] font-sans font-bold text-ink-400 uppercase tracking-widest">
                        {label}
                      </span>
                      <span className="font-sans text-sm font-semibold text-ink-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Governing law note */}
              <div className="flex items-start gap-3 p-4 bg-ink-50 border border-(--color-border) rounded-xl">
                <span className="text-lg shrink-0 mt-0.5">🇳🇬</span>
                <p className="text-[13px] font-sans text-ink-600 leading-relaxed">
                  <strong className="font-semibold text-ink-800">Governing law.</strong> These Terms of Use are governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of Osun State.
                </p>
              </div>

              {/* Footer nav */}
              <div className="mt-12 pt-8 border-t border-(--color-border) flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-ember-600 rounded-sm flex items-center justify-center">
                    <Radio size={13} className="text-white" />
                  </div>
                  <span className="font-display font-black text-ink-900">
                    Osun<span className="text-ember-600">Gist</span>
                  </span>
                </div>
                <div className="flex items-center gap-5 text-sm font-sans text-ink-500">
                  <Link href="/privacy" className="hover:text-ember-600 transition-colors">
                    Privacy Policy
                  </Link>
                  <Link href="/contact" className="hover:text-ember-600 transition-colors">
                    Contact
                  </Link>
                  <Link href="/" className="hover:text-ember-600 transition-colors">
                    Home
                  </Link>
                </div>
              </div>

            </article>
          </div>
        </div>
      </main>

      {/* ── Back to top ───────────────────────────────────────────────────────── */}
      {/* <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className={`fixed bottom-6 right-6 z-50 w-10 h-10 bg-ember-600 hover:bg-ember-700 text-white rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
          showTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <ArrowUp size={16} />
      </button> */}

      <Footer />
    </div>
  );
}