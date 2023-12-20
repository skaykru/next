import superjson from 'superjson';
import { GetServerSidePropsContext } from 'next';
import { createServerSideHelpers } from '@trpc/react-query/server';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';

import { createContext } from '~/server/context';
import { appRouter } from '~/server/routers/_app';

export const createServerSideTRPCHelpers = async (
  context: CreateNextContextOptions | GetServerSidePropsContext,
) => {
  return createServerSideHelpers({
    router: appRouter,
    ctx: await createContext(context),
    transformer: superjson,
  });
};
