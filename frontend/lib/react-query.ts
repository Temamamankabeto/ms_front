import { QueryClient } from "@tanstack/react-query";

export const reactQueryDefaultOptions = {
  queries: {
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: 0,
  },
} satisfies ConstructorParameters<typeof QueryClient>[0]["defaultOptions"];

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: reactQueryDefaultOptions,
  });
}
