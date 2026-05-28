"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCategories, useNotifications } from "@/hooks/useData";
import { cn, getInitials } from "@/lib/utils";
import { Radio, Search, Bell, X, Menu, ChevronDown, LogOut, User, Settings } from "lucide-react";

export default function Navbar() {
  const { user, logout, isLoggedIn } = useAuth();
  const { data: categories = [] } = useCategories();
  const { data: notifData } = useNotifications();
  const router = useRouter();
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenu, setUserMenu] = useState(false);

  const unread = notifData?.unreadCount ?? 0;

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenu(false);
  }, [pathname]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleSearch = (e: any) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/news?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const navLink = (href: string) =>
    cn(
      "px-3 py-1.5 rounded text-sm font-sans font-medium transition-colors",
      pathname === href || (href !== "/" && pathname.startsWith(href))
        ? "text-ember-600"
        : "text-ink-700 hover:text-ink-900"
    );

  return (
    <>
      {/* Breaking ticker */}
      <div className="bg-ink-950 py-1.5 overflow-hidden">
        <div className="flex items-center">
          <span className="shrink-0 bg-ember-600 text-white font-sans font-bold px-3 py-0.5 text-[10px] uppercase tracking-widest mr-4">
            Breaking
          </span>
          <div className="overflow-hidden flex-1">
            <span className="ticker-scroll text-ink-300 text-xs font-sans">
              Stay updated with the latest Osun State news — politics, culture, economy &nbsp;•&nbsp;
              Follow your favourite writers for personalised updates &nbsp;•&nbsp;
              Subscribe to our newsletter for daily digests &nbsp;•&nbsp;
              Stay updated with the latest Osun State news — politics, culture, economy &nbsp;•&nbsp;
              Follow your favourite writers for personalised updates &nbsp;•&nbsp;
              Subscribe to our newsletter for daily digests
            </span>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <header
        className={cn(
          "sticky top-0 z-50 bg-(--color-bg) border-b border-(--color-border) transition-shadow duration-300",
          scrolled && "shadow-md"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0 mr-auto">
              <div className="w-8 h-8 bg-ember-600 rounded-sm flex items-center justify-center">
                <Radio size={16} className="text-white" />
              </div>
              <span className="font-display font-bold text-xl text-ink-900">
                Osun<span className="text-ember-600">Gist</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1 uppercase">
              <Link href="/" className={navLink("/")}>Home</Link>
              <Link href="/news" className={navLink("/news")}>News</Link>

              <Link href="/blogs" className={navLink("/blogs")}>General Post</Link>

              <Link href="/about" className={navLink("/about")}>About Us</Link>
              <Link href="/contact" className={navLink("/contact")}>Contact</Link>

              {/* Writers — only visible when logged in */}
              {isLoggedIn && (
                <>
                  <Link href="/writers" className={navLink("/writers")}>Writers</Link>
                  <Link href="/blogs/create"
                    className="flex-1 text-center p-2 text-sm font-sans font-semibold text-white bg-ember-600 rounded-lg hover:bg-ember-700 transition-colors">
                    Create post
                  </Link>

                </>


              )}



            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-lg text-ink-600 hover:text-ink-900 hover:bg-ink-100 transition-colors"
              >
                <Search size={18} />
              </button>

              {isLoggedIn ? (
                <>
                  <Link
                    href="/notifications"
                    className="relative p-2 rounded-lg text-ink-600 hover:text-ink-900 hover:bg-ink-100 transition-colors"
                  >
                    <Bell size={18} />
                    {unread > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-ember-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </Link>

                  <div className="relative">
                    <button
                      onClick={() => setUserMenu(o => !o)}
                      className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-ink-100 transition-colors"
                    >
                      {user?.avatar?.url ? (
                        <img src={user.avatar.url} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-ember-600 flex items-center justify-center text-white text-xs font-bold">
                          {getInitials(user?.name ?? "")}
                        </div>
                      )}
                      <ChevronDown size={12} className="text-ink-500" />
                    </button>

                    {userMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} />
                        <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-(--color-border) rounded-xl shadow-xl z-20 py-2">
                          <div className="px-4 py-2 border-b border-(--color-border) mb-1">
                            <p className="font-sans font-semibold text-ink-900 text-sm">{user?.name}</p>
                            <p className="text-xs text-ink-500 capitalize font-sans">{user?.role}</p>
                          </div>
                          <Link href="/profile" className="flex items-center gap-2.5 px-4 py-2 text-sm font-sans text-ink-700 hover:bg-ink-50 transition-colors">
                            <User size={14} /> My Profile
                          </Link>
                          <Link href="/settings" className="flex items-center gap-2.5 px-4 py-2 text-sm font-sans text-ink-700 hover:bg-ink-50 transition-colors">
                            <Settings size={14} /> Settings
                          </Link>
                          <div className="border-t border-(--color-border) mt-1 pt-1">
                            <button
                              onClick={async () => { await logout(); router.push("/"); }}
                              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm font-sans text-ember-600 hover:bg-ember-50 transition-colors"
                            >
                              <LogOut size={14} /> Sign Out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/register"
                    className="px-4 py-1.5 bg-ember-600 hover:bg-ember-700 text-white text-sm font-sans font-semibold rounded-lg transition-colors">
                    Join Free
                  </Link>
                </div>
              )}

              {/* Hamburger */}
              <button
                onClick={() => setMobileOpen(o => !o)}
                className="lg:hidden p-2 rounded-lg text-ink-600 hover:text-ink-900 hover:bg-ink-100 transition-colors"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Category bar */}
        <div className="hidden lg:block border-t border-(--color-border) bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar h-10">
              {categories.map(cat => (
                <Link
                  key={cat._id}
                  href={`/news?category=${cat.slug}`}
                  className="shrink-0 text-[11px] font-sans font-semibold uppercase tracking-wider text-ink-500 hover:text-ink-900 transition-colors whitespace-nowrap"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-(--color-border) bg-white py-4 px-4">
            <nav className="flex flex-col gap-1">
              {[
                { href: "/", label: "Home" },
                { href: "/news", label: "News" },
                { href: "/blogs", label: "General Blog" },
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact" },

                ...(isLoggedIn ? [{ href: "/writers", label: "Writers" }] : []),
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-2.5 rounded-lg uppercase text-sm font-sans font-medium transition-colors",
                    pathname === item.href ? "bg-ember-50 text-ember-600" : "text-ink-700 hover:bg-ink-50"
                  )}
                >
                  {item.label}
                </Link>
              ))}

              <div className="border-t border-(--color-border) mt-3 pt-3">
                <p className="px-4 text-[11px] font-sans font-bold uppercase tracking-widest text-ink-400 mb-2">Topics</p>
                <div className="grid grid-cols-2 gap-1">
                  {categories.slice(0, 8).map(cat => (
                    <Link
                      key={cat._id}
                      href={`/news?category=${cat.slug}`}
                      className="px-3 py-2 rounded-lg text-sm font-sans text-ink-600 hover:bg-ink-50 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              {!isLoggedIn && (
                <div className="flex gap-2 mt-3 border-t border-(--color-border) pt-3">
                  {/* <Link href="/login"
                    className="flex-1 text-center py-2 text-sm font-sans font-medium text-ink-700 border border-(--color-border) rounded-lg hover:bg-ink-50 transition-colors">
                    Sign In
                  </Link> */}
                  <Link href="/register"
                    className="flex-1 text-center py-2 text-sm font-sans font-semibold text-white bg-ember-600 rounded-lg hover:bg-ember-700 transition-colors">
                    Join Free
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-100 bg-ink-950/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-(--color-border) overflow-hidden">
            <form onSubmit={handleSearch} className="flex items-center gap-3 p-4">
              <Search size={20} className="text-ink-400 shrink-0" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search articles, news, writers…"
                className="flex-1 text-lg text-ink-900 placeholder:text-ink-400 outline-none bg-transparent font-body"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-2 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors"
              >
                <X size={18} />
              </button>
            </form>
            <div className="px-4 pb-4">
              <p className="text-xs font-sans text-ink-400 mb-3">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {["Osun Governor", "Education", "Market", "Sports", "Health", "Farming"].map(s => (
                  <button
                    key={s}
                    onClick={() => setSearchQuery(s)}
                    className="px-3 py-1.5 bg-ink-50 hover:bg-ink-100 text-ink-700 text-sm rounded-full transition-colors font-sans"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}