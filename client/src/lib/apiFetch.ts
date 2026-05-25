import type { ApiResponse } from "@/types";

const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1").replace(/\/+$/, "");

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: Record<string, unknown> | FormData | string;
  headers?: Record<string, string>;
  cache?: RequestCache;
  tags?: string[];
}

// ── Core ──────────────────────────────────────────────────────────────────────

async function apiFetchInner<T>(
  path: string,
  opts: ApiFetchOptions,
  token: string | null
): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers: extra = {} } = opts;
  const isFormData = body instanceof FormData;

  const headers: Record<string, string> = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  Object.assign(headers, extra);
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let serialised: BodyInit | undefined;
  if (body !== undefined) {
    serialised = isFormData
      ? body
      : typeof body === "string"
      ? body
      : JSON.stringify(body);
  }

  const fetchOpts: RequestInit = {
    method,
    headers,
    credentials: "include",
    body: serialised,
  };
  if (opts.cache) fetchOpts.cache = opts.cache;
  if (opts.tags)  fetchOpts.next  = { tags: opts.tags } as NextFetchRequestConfig;

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, fetchOpts);
  } catch {
    throw new Error("Network error. Please check your connection.");
  }

  const ct = response.headers.get("content-type");
  let data: ApiResponse<T>;
  try {
    if (ct?.includes("application/json")) {
      data = (await response.json()) as ApiResponse<T>;
    } else {
      throw new Error("Unexpected server response.");
    }
  } catch {
    throw new Error("Failed to parse server response.");
  }

  if (!response.ok) {
    throw new Error(typeof data?.message === "string" ? data.message : response.statusText);
  }
  return data;
}

// ── Public fetch (no token) ───────────────────────────────────────────────────

export async function apiFetch<T = unknown>(
  path: string,
  opts: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  return apiFetchInner<T>(path, opts, null);
}

// ── Auth fetch (attaches stored token) ────────────────────────────────────────

export async function authFetch<T = unknown>(
  path: string,
  opts: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  const token = getStoredToken();
  try {
    return await apiFetchInner<T>(path, opts, token);
  } catch (err) {
    if (err instanceof Error && err.message.toLowerCase().includes("unauthorized")) {
      const fresh = await silentRefresh();
      if (fresh) return apiFetchInner<T>(path, opts, fresh);
    }
    throw err;
  }
}

// ── Token helpers (client-side only) ─────────────────────────────────────────

export const getStoredToken  = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

export const setStoredToken  = (t: string): void => {
  if (typeof window !== "undefined") localStorage.setItem("accessToken", t);
};

export const clearStoredToken = (): void => {
  if (typeof window !== "undefined") localStorage.removeItem("accessToken");
};

// ── Silent refresh ────────────────────────────────────────────────────────────

let _refreshing: Promise<string | null> | null = null;

async function silentRefresh(): Promise<string | null> {
  if (!_refreshing) {
    _refreshing = (async () => {
      try {
        const r = await fetch(`${base}/auth/refresh`, { method: "POST", credentials: "include" });
        if (!r.ok) { clearStoredToken(); return null; }
        const d = (await r.json()) as ApiResponse<{ accessToken: string }>;
        const t = d?.data?.accessToken;
        if (!t) { clearStoredToken(); return null; }
        setStoredToken(t);
        return t;
      } catch {
        clearStoredToken();
        return null;
      }
    })().finally(() => { _refreshing = null; });
  }
  return _refreshing;
}

// Next.js extended fetch type
interface NextFetchRequestConfig {
  revalidate?: number | false;
  tags?: string[];
}
