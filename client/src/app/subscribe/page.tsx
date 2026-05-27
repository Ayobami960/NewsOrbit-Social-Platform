"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useSubscribeNewsletter } from "@/hooks/useData";
import { Mail, CheckCircle2, Rss, Bell, Newspaper, Clock } from "lucide-react";

export default function SubscribePage() {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [success, setSuccess] = useState(false);

  const subscribeMut = useSubscribeNewsletter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await subscribeMut.mutateAsync({ email, name: name || undefined });
      setSuccess(true);
    } catch {
      // toast shown by hook
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <div className="bg-linear-to-br from-ink-950 via-ink-900 to-ember-950 text-white py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-ember-600/20 border border-ember-600/30 rounded-2xl mb-6">
              <Mail size={28} className="text-ember-400" />
            </div>
            <h1 className="font-display text-5xl font-bold mb-4 leading-tight">
              Osun news,<br />
              <span className="text-ember-400">every morning.</span>
            </h1>
            <p className="text-ink-300 font-body text-lg leading-relaxed max-w-xl mx-auto">
              Join thousands of readers who start their day with the top stories from Osun State — delivered fresh to your inbox.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Form */}
            <div>
              {success ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} className="text-green-600" />
                  </div>
                  <h2 className="font-display text-3xl font-bold text-ink-900 mb-3">You're subscribed!</h2>
                  <p className="text-ink-600 font-body mb-2">
                    Welcome to OsunGist. Check your inbox for a confirmation email.
                  </p>
                  <p className="text-ink-500 font-body text-sm mb-8">
                    Your first daily digest arrives tomorrow morning.
                  </p>
                  <Link href="/"
                    className="px-6 py-3 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold rounded-xl transition-colors">
                    Explore Stories
                  </Link>
                </div>
              ) : (
                <>
                  <h2 className="font-display text-3xl font-bold text-ink-900 mb-2">Subscribe free</h2>
                  <p className="text-ink-600 font-body mb-8">No spam. Unsubscribe anytime.</p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                        Your Name <span className="text-ink-400 normal-case tracking-normal font-normal">(optional)</span>
                      </label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)}
                        placeholder="Adebayo Ojo"
                        className="w-full px-4 py-3 rounded-xl border border-(--color-border) bg-white text-ink-900 font-sans text-sm placeholder:text-ink-400 outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/20 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-sans font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                        Email Address
                      </label>
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-(--color-border) bg-white text-ink-900 font-sans text-sm placeholder:text-ink-400 outline-none focus:border-ember-600 focus:ring-2 focus:ring-ember-600/20 transition-all" />
                    </div>
                    <button type="submit" disabled={subscribeMut.isPending}
                      className="w-full py-3 bg-ember-600 hover:bg-ember-700 text-white font-sans font-semibold rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                      {subscribeMut.isPending
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Subscribing…</>
                        : <><Mail size={15} /> Subscribe for Free</>
                      }
                    </button>
                  </form>

                  <p className="text-xs text-ink-400 font-sans mt-4 leading-relaxed">
                    By subscribing you agree to receive email newsletters from OsunGist. You can unsubscribe at any time via the link in any email.
                  </p>
                </>
              )}
            </div>

            {/* Benefits */}
            <div className="space-y-6">
              <h3 className="font-display text-xl font-bold text-ink-900">What you get</h3>

              {[
                {
                  icon: Clock,
                  title: "Daily Morning Digest",
                  desc: "The top 5 stories from Osun State, curated and delivered to your inbox every morning by 7am.",
                  color: "bg-ember-600/10 text-ember-600",
                },
                {
                  icon: Bell,
                  title: "Breaking News Alerts",
                  desc: "Get notified the moment major stories break — before they trend on social media.",
                  color: "bg-amber-600/10 text-amber-600",
                },
                {
                  icon: Newspaper,
                  title: "Weekly Deep Dives",
                  desc: "Every Sunday, a long-form analysis of the week's most important story from Osun.",
                  color: "bg-blue-600/10 text-blue-600",
                },
                {
                  icon: Rss,
                  title: "Writer Spotlights",
                  desc: "Discover new voices — we feature a different OsunGist writer every week.",
                  color: "bg-green-600/10 text-green-600",
                },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 className="font-sans font-semibold text-ink-900 text-sm mb-0.5">{title}</h4>
                    <p className="text-ink-500 font-body text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}

              {/* Social proof */}
              <div className="mt-8 pt-8 border-t border-(--color-border)">
                <p className="text-[11px] font-sans font-bold uppercase tracking-widest text-ink-400 mb-4">
                  Trusted by readers across Osun
                </p>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-amber-500 text-sm">★</span>
                  ))}
                  <span className="text-xs font-sans text-ink-500 ml-2">4.9 / 5 from 2,400+ readers</span>
                </div>
                <p className="text-sm font-body italic text-ink-600">
                  "The best way to stay on top of Osun news without spending hours scrolling."
                </p>
                <p className="text-xs font-sans text-ink-400 mt-1">— Kemi A., Osogbo</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
