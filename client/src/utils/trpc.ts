import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { fetchAuthSession } from 'aws-amplify/auth';
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
          
          // For now, we'll pass role via header (in production, extract from JWT)
          const userRole = localStorage.getItem('userRole') || 'Fundraiser';
          const userEmail = session.tokens?.idToken?.payload?.email as string;
          
          return {
            authorization: idToken ? `Bearer ${idToken}` : '',
            'x-user-role': userRole,
            'x-user-email': userEmail || '',
          };
        } catch (error) {
          return {};
        }
      },
    })
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
