Rebuild the admin because i will be using the 

```json
"@tanstack/react-query": "^5.100.10",
    "axios": "^1.16.0",
    "lucide-react": "^1.14.0",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "react-hot-toast": "^2.6.0",
    "react-router": "^7.15.0",
    "recharts": "^3.8.1",
    "tailwindcss": "^4.2.2"
```


```javascript

const raw = import.meta.env.VITE_API_URL;
const base = typeof raw === "string" ? raw.replace(/\/+$/, "") : ""; // remove trailing slashes

// this is an authenticated fetch req that we use to send reqs to our api
export async function apiFetch(path, opts = {}) {
  const { getToken, method = "GET", body } = opts;
  const headers = { "Content-Type": "application/json" };

  if (getToken) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
   

    throw e;
  }

  const data = await res.json();

  Sentry.addBreadcrumb({
    category: "api",
    message: `${method} ${path}`,
    level: res.ok ? "info" : "warning",
    data: { status: res.status },
  });

  if (!res.ok) {
    const msg = typeof data?.error === "string" ? data.error : res.statusText;
    const err = new Error(typeof msg === "string" ? msg : "Request failed");

    if (res.status >= 500) {
      Sentry.captureException(err, {
        tags: { "api.fetch": "http", "http.status": String(res.status) },
        extra: { path, method, status: res.status },
      });
    }

    throw err;
  }

  return data;
}

```

Not this admin application is typescript, create a type file for good structure