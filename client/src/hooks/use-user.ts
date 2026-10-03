import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NewUser, User } from "@db/schema";

type RequestResult = {
  ok: true;
  user: User;
} | {
  ok: false;
  message: string;
};

async function handleAuthRequest(
  url: string,
  method: string,
  body?: NewUser
): Promise<RequestResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      const message = await response.text();
      return { ok: false, message };
    }

    const user = await response.json();
    return { ok: true, user };
  } catch (error) {
    return { ok: false, message: String(error) };
  }
}

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/user"],
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (userData: NewUser) =>
      handleAuthRequest("/api/login", "POST", userData),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.setQueryData(["/api/user"], result.user);
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: NewUser) =>
      handleAuthRequest("/api/register", "POST", userData),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.setQueryData(["/api/user"], result.user);
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => handleAuthRequest("/api/logout", "POST"),
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
  };
}
