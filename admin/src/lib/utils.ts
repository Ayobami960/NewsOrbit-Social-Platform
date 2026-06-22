import { formatDistanceToNow, format } from "date-fns";
import type { Role } from "../types";

export const timeAgo = (date?: string | null): string => {
  if (!date) return "";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatDate = (date?: string | null, fmt = "MMM dd, yyyy"): string => {
  if (!date) return "—";
  return format(new Date(date), fmt);
};

export const getInitials = (name = ""): string =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export const truncate = (str = "", len = 100): string =>
  str.length > len ? str.slice(0, len).trimEnd() + "…" : str;

export const cn = (...classes: (string | undefined | false | null)[]): string =>
  classes.filter(Boolean).join(" ");

// Role utilities
export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  manager: "manager",
  admin: "Admin",
  writer: "Writer",
  user: "User",
};

export const ROLE_COLOR: Record<Role, string> = {
  super_admin: "text-red-400 bg-red-500/15",
  manager: "text-yellow-200 bg-white/15",
  admin:  "text-blue-400 bg-blue-500/15",
  writer: "text-green-400 bg-green-500/15",
  user: "text-zinc-400 bg-zinc-500/15",
};

// Roles a given role can create
export const CREATABLE_ROLES: Partial<Record<Role, Role[]>> = {
  super_admin: ["admin"],
  admin:       ["writer"],
};

export const canCreateRole = (creatorRole: Role, targetRole: Role): boolean => {
  return CREATABLE_ROLES[creatorRole]?.includes(targetRole) ?? false;
};

// Status colors
export const STATUS_COLOR: Record<string, string> = {
  published: "text-green-400 bg-green-500/15",
  draft:     "text-zinc-400 bg-zinc-500/15",
  scheduled: "text-amber-400 bg-amber-500/15",
  archived:  "text-zinc-500 bg-zinc-600/15",
  pending:   "text-amber-400 bg-amber-500/15",
  approved:  "text-green-400 bg-green-500/15",
  rejected:  "text-red-400 bg-red-500/15",
  spam:      "text-zinc-500 bg-zinc-600/15",
  active:    "text-green-400 bg-green-500/15",
  banned:    "text-red-400 bg-red-500/15",
  info:      "text-blue-400 bg-blue-500/15",
  warning:   "text-amber-400 bg-amber-500/15",
  critical:  "text-red-400 bg-red-500/15",
};
