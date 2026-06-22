import type { ApiResponse } from "@/types";

export const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1").replace(/\/+$/, "");

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: Record<string, unknown> | FormData | string;
  headers?: Record<string, string>;
  cache?: RequestCache;
  tags?: string[];
}

// Typed error so consumers can check err.errors[]
export class ApiError extends Error {
  statusCode: number;
  errors: { field: string; message: string }[];

  constructor(message: string, statusCode: number, errors: { field: string; message: string }[] = []) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

async function apiFetchInner<T>(
  path: string,
  opts: ApiFetchOptions,
  token: string | null
): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers: extra = {} } = opts;
  const isFormData = body instanceof FormData;

  const headers: Record<string, string> = { ...extra };
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let serialised: BodyInit | undefined;
  if (body !== undefined) {
    serialised = isFormData ? body : typeof body === "string" ? body : JSON.stringify(body);
  }

  const fetchOpts: RequestInit = {
    method,
    headers,
    credentials: "include",
    body: serialised,
  };

  if (opts.cache) fetchOpts.cache = opts.cache;
  if (opts.tags) fetchOpts.next = { tags: opts.tags } as any;

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, fetchOpts);
  } catch {
    throw new ApiError("Network error. Please check your internet connection.", 0);
  }

  const contentType = response.headers.get("content-type");
  let data: any;

  try {
    data = contentType?.includes("application/json")
      ? await response.json()
      : { message: await response.text() };
  } catch {
    throw new ApiError("Failed to parse server response.", response.status);
  }

  if (!response.ok) {
    // ↓ preserve the errors[] array from the backend instead of discarding it
    throw new ApiError(
      data?.message || response.statusText || "Request failed",
      response.status,
      data?.errors ?? []
    );
  }

  return data as ApiResponse<T>;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  return apiFetchInner<T>(path, opts, null);
}

export async function authFetch<T = unknown>(
  path: string,
  opts: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  const token = getStoredToken();

  if (!token) {
    console.debug(`⚠️ authFetch called to ${path} without token`);
  }

  try {
    return await apiFetchInner<T>(path, opts, token);
  } catch (err: any) {
    if (
      err.message?.toLowerCase().includes("token") ||
      err.message?.toLowerCase().includes("unauthorized") ||
      err.message?.toLowerCase().includes("no token")
    ) {
      const freshToken = await silentRefresh();
      if (freshToken) return apiFetchInner<T>(path, opts, freshToken);
    }
    throw err;
  }
}

export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
};

export const setStoredToken = (token: string): void => {
  if (typeof window !== "undefined") localStorage.setItem("accessToken", token);
};

export const clearStoredToken = (): void => {
  if (typeof window !== "undefined") localStorage.removeItem("accessToken");
};

let _refreshing: Promise<string | null> | null = null;

async function silentRefresh(): Promise<string | null> {
  if (_refreshing) return _refreshing;

  _refreshing = (async () => {
    try {
      const res = await fetch(`${base}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) { clearStoredToken(); return null; }

      const data = (await res.json()) as ApiResponse<{ accessToken: string }>;
      const newToken = data?.data?.accessToken;
      if (newToken) { setStoredToken(newToken); return newToken; }
    } catch (err) {
      console.error("Silent refresh failed:", err);
    }

    clearStoredToken();
    return null;
  })().finally(() => { _refreshing = null; });

  return _refreshing;
}