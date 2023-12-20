import superjson from 'superjson';
import { createTRPCNext } from '@trpc/next';
import { httpBatchLink } from '@trpc/client';
import { GetServerSidePropsContext } from 'next';
import { inferRouterOutputs } from '@trpc/server';
import { createServerSideHelpers } from '@trpc/react-query/server';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';

import { createContext } from '~/server/context';
import { AppRouter, appRouter } from '~/server/routers/_app';

const getBaseUrl = () => {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.RENDER_INTERNAL_HOSTNAME)
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

export const trpc = createTRPCNext<AppRouter>({
  config({ ctx }) {
    if (typeof window !== 'undefined') {
      return {
        transformer: superjson,
        links: [
          httpBatchLink({
            url: '/api/trpc',
          }),
        ],
        queryClientConfig: {
          defaultOptions: {
            queries: { retry: false, refetchOnWindowFocus: false },
          },
        },
      };
    }

    return {
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            if (ctx?.req) {
              const { connection: _connection, ...headers } = ctx.req.headers;

              return {
                ...headers,
                'x-ssr': '1',
              };
            }
            return {};
          },
        }),
      ],
    };
  },
  ssr: false,
});

export type RouterOutputs = inferRouterOutputs<AppRouter>;
