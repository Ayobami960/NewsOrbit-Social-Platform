import { NavLink } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { cn, ROLE_LABEL } from "../../lib/utils";
import type { SidebarNavEntry } from "../../types";
import {
  LayoutDashboard, BarChart2, Newspaper, PenSquare,
  BookOpen, Tag, MessageSquare, Users, Mail, Bell,
  Shield, Settings, LogOut, Radio, X,
} from "lucide-react";

const NAV: SidebarNavEntry[] = [
    { section: true, label: "Overview" },
    { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "admin", "writer"], exact: true },
    { to: "/analytics", label: "Analytics", icon: BarChart2, roles: ["super_admin", "admin", "writer"] },

    { section: true, label: "Content" },
    { to: "/articles", label: "Articles", icon: Newspaper, roles: ["admin","writer"] },
    { to: "/New-articles", label: "New Article", icon: PenSquare, roles: [ "writer"] },
    { to: "/blogs", label: "User Blogs", icon: BookOpen, roles: ["super_admin", "admin"] },
    { to: "/categories", label: "Categories", icon: Tag, roles: [ "super_admin", "admin" ] },
    { to: "/comments", label: "Comments", icon: MessageSquare, roles: ["super_admin", "admin"] },

    { section: true, label: "Audience" },
    { to: "/users", label: "Users & Roles", icon: Users, roles: ["super_admin", "admin"] },
    { to: "/newsletter", label: "Newsletter", icon: Mail, roles: ["admin", "writer"] },
    { to: "/push", label: "Push Notify", icon: Bell, roles: ["admin", "writer"] },

    { section: true, label: "System" },
    { to: "/activity", label: "Activity Log", icon: Shield, roles: ["super_admin"] },
    { to: "/settings", label: "Settings", icon: Settings, roles: ["super_admin", "admin", "writer"] },
];
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout, isRole } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "w-60 min-h-screen bg-zinc-950 border-r border-zinc-800/80 flex flex-col fixed top-0 bottom-0 z-50 transition-transform duration-300",
          "lg:translate-x-0", // Always visible on large screens
          isOpen ? "translate-x-0" : "-translate-x-full" // Slide in/out on mobile
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <Radio size={16} className="text-red-500" />
            <span className="font-[Playfair_Display] text-[17px] font-bold text-zinc-100">
              Osun<span className="text-red-500">Gist</span>
            </span>
          </div>

          {/* Close button - Mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden text-zinc-400 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto sidebar">
          {NAV.map((item, i) => {
            if ("section" in item && item.section) {
              return (
                <p key={i} className="px-5 pt-4 pb-1 text-[10px] font-bold uppercase tracking-[.12em] text-zinc-600">
                  {item.label}
                </p>
              );
            }

            const navItem = item as Extract<SidebarNavEntry, { to: string }>;
            if (!navItem.roles.some(r => isRole(r))) return null;
            const Icon = navItem.icon;

            return (
              <NavLink
                key={navItem.to}
                to={navItem.to}
                end={navItem.exact}
                onClick={onClose} // Close sidebar on mobile when link is clicked
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 px-5 py-2.5 text-[13.5px] font-medium transition-all duration-150 border-l-2",
                    isActive
                      ? "bg-red-500/10 text-red-400 border-red-500"
                      : "text-zinc-500 border-transparent hover:text-zinc-200 hover:bg-zinc-800/50"
                  )
                }
              >
                <Icon size={16} strokeWidth={1.8} />
                {navItem.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto px-4 py-4 border-t border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="avatar w-10">
              <div className="ring-primary ring-offset-base-100 w-10 h-10 rounded-full ring-2 ring-offset-2 overflow-hidden">
                <img src="https://img.daisyui.com/images/profile/demo/spiderperson@192.webp" alt="Profile" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-zinc-200 truncate">{user?.name}</p>
              <p className="text-[11px] text-red-400 font-semibold capitalize">
                {user ? ROLE_LABEL[user.role] : ""}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-zinc-600 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-zinc-800"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}