import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { AUTH_STORAGE_KEY } from "./authConstants";

export { AUTH_STORAGE_KEY };

function getAuthHeaders(): Record<string, string> {
  try {
    const credentials = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (credentials) return { Authorization: `Basic ${credentials}` };
  } catch {}
  return {};
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(data ? { "Content-Type": "application/json" } : {}),
  };
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (res.status === 401 || res.status === 403) {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      window.location.href = "/login";
    } catch {}
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: getAuthHeaders(),
    });

    if (res.status === 401 || res.status === 403) {
      try {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        window.location.href = "/login";
      } catch {}
      if (unauthorizedBehavior === "returnNull") return null;
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
