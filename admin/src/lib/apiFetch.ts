import type { ApiResponse } from "../types";

export const base =
  typeof (import.meta.env.VITE_API_URL as string | undefined) === "string"
    ? (import.meta.env.VITE_API_URL as string).replace(/\/+$/, "")
    : "";

interface ApiFetchOptions {
  getToken?: () => Promise<string | null> | string | null;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: Record<string, unknown> | FormData | string;
  headers?: Record<string, string>;
}

async function apiFetchInner<T>(
  path: string,
  opts: ApiFetchOptions,
  token: string | null
): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers: extraHeaders = {} } = opts;
  const isFormData = body instanceof FormData;

  const headers: Record<string, string> = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  Object.assign(headers, extraHeaders);
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let serialisedBody: BodyInit | undefined;
  if (body !== undefined) {
    serialisedBody = isFormData ? body : typeof body === "string" ? body : JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      headers,
      credentials: "include",
      body: serialisedBody,
    });
  } catch (error) {
    console.error(`[apiFetch] Network error on ${method} ${path}`, error);
    throw new Error("Network error. Please try again.");
  }

  const contentType = response.headers.get("content-type");
  let data: ApiResponse<T>;
  try {
    if (contentType?.includes("application/json")) {
      data = (await response.json()) as ApiResponse<T>;
    } else {
      throw new Error("Non-JSON response from server.");
    }
  } catch (error) {
    console.error(`[apiFetch] JSON parse error on ${method} ${path}`, error);
    throw new Error("Failed to parse server response.");
  }

  if (!response.ok) {
    let safeBody: any = "Redacted for security";
    if (body && !(body instanceof FormData)) {
      try {
        const parsed = typeof body === "string" ? JSON.parse(body) : body;
        safeBody = parsed.password ? { ...parsed, password: "********" } : parsed;
      } catch { safeBody = "Unparsable Body"; }
    }
    console.error("API ERROR:", {
      url: `${base}${path}`, method, status: response.status,
      requestBody: safeBody,
      error: typeof data?.message === "string" ? data.message : response.statusText,
    });
    const message = typeof data?.message === "string" ? data.message : response.statusText;
    throw new Error(message || "Request failed");
  }

  return data;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  const token = opts.getToken ? await opts.getToken() : null;
  try {
    return await apiFetchInner<T>(path, opts, token);
  } catch (err) {
    if (err instanceof Error && err.message.toLowerCase().includes("unauthorized")) {
      const freshToken = await silentRefresh();
      if (freshToken) return apiFetchInner<T>(path, opts, freshToken);
    }
    throw err;
  }
}

let _refreshing: Promise<string | null> | null = null;

export function getStoredToken(): string | null {
  return localStorage.getItem("accessToken");
}

export function setStoredToken(token: string): void {
  localStorage.setItem("accessToken", token);
}

export function clearStoredToken(): void {
  localStorage.removeItem("accessToken");
}

async function silentRefresh(): Promise<string | null> {
  if (!_refreshing) {
    _refreshing = (async () => {
      try {
        const response = await fetch(`${base}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!response.ok) { clearStoredToken(); return null; }
        const data = (await response.json()) as ApiResponse<{ accessToken: string }>;
        const token = data?.data?.accessToken;
        if (!token) { clearStoredToken(); return null; }
        setStoredToken(token);
        return token;
      } catch (error) {
        console.error("[silentRefresh] failed:", error);
        clearStoredToken();
        return null;
      }
    })().finally(() => { _refreshing = null; });
  }
  return _refreshing;
}

export async function getToken(): Promise<string | null> {
  const stored = getStoredToken();
  if (stored) return stored;
  return silentRefresh();
}

export function authFetch<T = unknown>(
  path: string,
  opts: Omit<ApiFetchOptions, "getToken"> = {}
) {
  return apiFetch<T>(path, { ...opts, getToken });
}