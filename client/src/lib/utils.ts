import { formatDistanceToNow, format } from "date-fns";

export const timeAgo = (date?: string | null): string => {
  if (!date) return "";
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }); }
  catch { return ""; }
};

export const formatDate = (date?: string | null, fmt = "MMM dd, yyyy"): string => {
  if (!date) return "—";
  try { return format(new Date(date), fmt); }
  catch { return "—"; }
};

export const truncate = (str = "", len = 100): string =>
  str.length > len ? str.slice(0, len).trimEnd() + "…" : str;

export const cn = (...classes: (string | undefined | false | null)[]): string =>
  classes.filter(Boolean).join(" ");

export const getInitials = (name = ""): string =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return String(n);
};

export const categoryColor = (color: string) => ({
  backgroundColor: color + "22",
  color,
  borderColor: color + "44",
});
