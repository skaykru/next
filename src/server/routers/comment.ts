import { z } from 'zod';
import { TRPCError } from '@trpc/server';

import { privateProcedure, publicProcedure, router } from '../trpc';

export const commentRouter = router({
  create: privateProcedure
    .input(
      z.object({
        articleSlug: z.string().min(1),
        commentBody: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { articleSlug, commentBody } = input;

      const article = await ctx.prisma.article.findUnique({
        where: { slug: articleSlug },
        select: { id: true },
      });

      if (!article) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Article not found',
        });
      }

      await ctx.prisma.articleComment.create({
        data: {
          body: commentBody,
          authorId: ctx.userId,
          articleId: article.id,
        },
      });
    }),
  deleteById: privateProcedure
    .input(z.number())
    .mutation(async ({ input: commentId, ctx }) => {
      await ctx.prisma.articleComment.delete({
        where: { id: commentId, authorId: ctx.userId },
      });
    }),
  getCommentsByArticleSlug: publicProcedure
    .input(z.string())
    .query(async ({ input: articleSlug, ctx }) => {
      const comments = await ctx.prisma.articleComment.findMany({
        where: { article: { slug: articleSlug } },
        include: {
          author: {
            select: { id: true, username: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
        author: comment.author,
      }));
    }),
});
