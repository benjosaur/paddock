import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { fetchAuthSession } from "aws-amplify/auth";
import type { AppRouter } from "../../../shared/index.ts";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:3001/trpc",
      headers: async () => {
        try {
          const session = await fetchAuthSession();
          const idToken = session.tokens?.idToken?.toString();
          return {
            authorization: idToken ? `Bearer ${idToken}` : "",
          };
        } catch (error) {
          return {};
        }
      },
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
