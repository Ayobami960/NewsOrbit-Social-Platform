"use client";

import Link from "next/link";
import { useState } from "react";
import { Radio, Mail, ArrowRight } from "lucide-react";
import { useSubscribeNewsletter } from "@/hooks/useData";
import { useCategories } from "@/hooks/useData";
import { BsInstagram, BsTwitter } from "react-icons/bs";
import { FaFacebook } from "react-icons/fa6";

export default function Footer() {
  const { data: categories = [] } = useCategories();
  const subscribeMut = useSubscribeNewsletter();
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    subscribeMut.mutate({ email });
    setEmail("");
  };

  return (
    <footer className="bg-ink-950 text-ink-300 mt-20">
      {/* Newsletter CTA */}
      <div className="bg-ember-600 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-white text-2xl font-bold mb-1">Stay informed. Stay ahead.</h3>
            <p className="text-ember-100 text-sm font-sans">Get Osun's top stories delivered to your inbox every morning.</p>
          </div>
          <form onSubmit={handleSubscribe} className="flex w-full md:w-auto gap-2">
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 md:w-72 px-4 py-2.5 rounded-lg text-ink-900 font-sans text-sm outline-none bg-gray-100 focus:ring-2 focus:ring-white/40"
            />
            <button type="submit" disabled={subscribeMut.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-ink-950 hover:bg-ink-900 text-white font-sans font-semibold text-sm rounded-lg transition-colors disabled:opacity-60">
              Subscribe <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-ember-600 rounded-sm flex items-center justify-center">
              <Radio size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">
              New<span className="text-ember-500">Orbit</span>
            </span>
          </div>
          <p className="text-sm text-ink-400 leading-relaxed mb-5 font-body">
            Your number one source for Osun State news, community stories, and in-depth reporting.
          </p>
          <div className="flex items-center gap-3">
            {[BsTwitter, FaFacebook, BsInstagram, Mail].map((Icon, i) => (
              <a key={i} href="#"
                className="w-8 h-8 rounded-lg bg-ink-800 hover:bg-ember-600 flex items-center justify-center text-ink-400 hover:text-white transition-colors">
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-sans font-bold text-white text-sm uppercase tracking-widest mb-4">Categories</h4>
          <ul className="space-y-2.5">
            {categories.slice(0, 7).map(cat => (
              <li key={cat._id}>
                <Link href={`/news?category=${cat.slug}`}
                  className="text-sm text-ink-400 hover:text-white transition-colors font-body">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-sans font-bold text-white text-sm uppercase tracking-widest mb-4">Navigation</h4>
          <ul className="space-y-2.5">
            {[
              { href: "/",          label: "Home" },
              { href: "/news",      label: "All News" },
              { href: "/blogs",     label: "Community Blogs" },
              { href: "/writers",   label: "Our Writers" },
              { href: "/subscribe", label: "Newsletter" },
              { href: "/login",     label: "Sign In" },
              { href: "/register",  label: "Create Account" },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="text-sm text-ink-400 hover:text-white transition-colors font-body">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-sans font-bold text-white text-sm uppercase tracking-widest mb-4">About</h4>
          <ul className="space-y-2.5">
            {[
              { href: "/about",   label: "About NewOrbit" },
              { href: "/contact", label: "Contact Us" },
              { href: "/privacy", label: "Privacy Policy" },
              { href: "/terms",   label: "Terms of Use" },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="text-sm text-ink-400 hover:text-white transition-colors font-body">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-ink-600 font-sans">© {new Date().getFullYear()} NewOrbit. All rights reserved.</p>
          <p className="text-xs text-ink-600 font-sans">Made with ♥ in Osun State, Nigeria</p>
        </div>
      </div>
    </footer>
  );
}
