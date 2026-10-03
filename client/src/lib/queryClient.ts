import { QueryClient, QueryKey } from "@tanstack/react-query";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type RequestOptions = {
  on401?: "throw" | "returnNull";
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        return getQueryFn()({ queryKey });
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    }
  },
});

export function getQueryFn(options: RequestOptions = {}) {
  return async ({ queryKey }: { queryKey: QueryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (!res.ok) {
      if (res.status === 401 && options.on401 === "returnNull") {
        return null;
      }
      
      if (res.status >= 500) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      throw new Error(`${res.status}: ${await res.text()}`);
    }

    return res.json();
  };
}

export async function apiRequest(method: RequestMethod, url: string, data?: any) {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  };

  if (data && method !== "GET") {
    options.body = JSON.stringify(data);
  }

  return fetch(url, options);
}
