import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { inferAsyncReturnType } from '@trpc/server';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';

import { prisma } from './prisma';
import { GetServerSidePropsContext } from 'next';

export const createContext = async (
  opts: CreateNextContextOptions | GetServerSidePropsContext,
) => {
  const context: { prisma: PrismaClient; userId?: number } = { prisma };

  const accessToken = opts.req.cookies['accessToken'];

  if (!accessToken) {
    return context;
  }

  try {
    const userId = jwt.verify(accessToken, process.env.JWT_SECRET!);
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
      },
    });
    context.userId = user?.id;
    return context;
  } catch (e) {
    return context;
  }
};

export type Context = inferAsyncReturnType<typeof createContext>;
