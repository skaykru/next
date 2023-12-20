import { z } from 'zod';
import { TRPCError } from '@trpc/server';

import { generateSlug } from '../helpers';
import { privateProcedure, publicProcedure, router } from '../trpc';

export const articleRouter = router({
  create: privateProcedure
    .input(
      z.object({
        title: z.string().min(1, "title can't be blank"),
        description: z.string().min(1, "description can't be blank"),
        body: z.string().min(1, "body can't be blank"),
        tags: z.array(z.string().min(1)).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const slug = generateSlug(input.title);

      const createdArticle = await ctx.prisma.article.create({
        data: {
          ...input,
          slug,
          authorId: ctx.userId,
          tags: {
            connectOrCreate: input.tags?.map((tagName) => ({
              where: { name: tagName },
              create: { name: tagName },
            })),
          },
        },
        select: { slug: true },
      });

      return createdArticle.slug;
    }),
  update: privateProcedure
    .input(
      z.object({
        slug: z.string().min(1),
        title: z.string().optional(),
        description: z.string().optional(),
        body: z.string().optional(),
        tags: z.array(z.string().min(1)).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { slug, tags, ...updatedFields } = input;

      const article = await ctx.prisma.article.findUnique({
        where: { slug },
        select: { title: true, tags: true },
      });

      if (!article) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Article not found',
        });
      }

      // Filter input to avoid fields with empty strings
      const filteredUpdatedFields = Object.fromEntries(
        Object.entries(updatedFields).filter(([_, value]) => Boolean(value)),
      );

      if (
        filteredUpdatedFields.title &&
        article.title !== filteredUpdatedFields.title
      ) {
        filteredUpdatedFields.slug = generateSlug(filteredUpdatedFields.title);
      }

      const updatedArticle = await ctx.prisma.article.update({
        where: { slug: input.slug, authorId: ctx.userId },
        data: {
          ...filteredUpdatedFields,
          tags: {
            disconnect: article.tags.map((tag) => ({ name: tag.name })),
            connectOrCreate: tags?.map((tagName) => ({
              where: { name: tagName },
              create: { name: tagName },
            })),
          },
        },
        select: { slug: true },
      });

      return updatedArticle.slug;
    }),
  delete: privateProcedure
    .input(z.string())
    .mutation(async ({ input: slug, ctx }) => {
      const article = await ctx.prisma.article.findUnique({
        where: {
          slug,
        },
        include: { tags: true },
      });

      if (!article) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Article not found',
        });
      }

      await ctx.prisma.article.update({
        where: { slug },
        data: {
          tags: {
            disconnect: article?.tags.map((tag) => ({
              name: tag.name,
            })),
          },
        },
      });
      await ctx.prisma.article.delete({
        where: { slug, authorId: ctx.userId },
      });
    }),
  changeFavoritedStatus: privateProcedure
    .input(z.string())
    .mutation(async ({ input: slug, ctx }) => {
      const article = await ctx.prisma.article.findUnique({
        where: {
          slug,
        },
        select: { favoritedBy: { where: { id: ctx.userId } } },
      });

      if (!article) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Article not found',
        });
      }

      const isFavorited = Boolean(article.favoritedBy[0]);

      const updatedArticle = await ctx.prisma.article.update({
        where: { slug },
        data: {
          favoritedBy: {
            connect: !isFavorited ? { id: ctx.userId } : undefined,
            disconnect: isFavorited ? { id: ctx.userId } : undefined,
          },
        },
        select: { slug: true },
      });

      return updatedArticle.slug;
    }),
  getBySlug: publicProcedure
    .input(z.string())
    .query(async ({ input: slug, ctx }) => {
      const article = await ctx.prisma.article.findUnique({
        where: { slug },
        include: {
          tags: true,
          author: {
            select: {
              id: true,
              username: true,
              image: true,
              bio: true,
              followedBy: ctx.userId
                ? { where: { id: ctx.userId } }
                : undefined,
            },
          },
          favoritedBy: ctx.userId ? { where: { id: ctx.userId } } : undefined,
          _count: { select: { favoritedBy: true } },
        },
      });

      if (!article) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Article not found',
        });
      }

      return {
        slug: article.slug,
        title: article.title,
        description: article.description,
        body: article.body,
        tags: article.tags.map((tag) => tag.name),
        createdAt: article.createdAt,
        isFavorited: Boolean(article.favoritedBy?.[0]),
        favoritesCount: article._count.favoritedBy,
        author: {
          id: article.author.id,
          username: article.author.username,
          image: article.author.image,
          bio: article.author.bio,
          isFollowing: Boolean(article.author.followedBy?.[0]),
        },
      };
    }),
  listArticles: publicProcedure
    .input(
      z
        .object({
          authorId: z.number().optional(),
          favoritedByUserId: z.number().optional(),
          tag: z.string().min(1).optional(),
        })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      const articles = await ctx.prisma.article.findMany({
        where: {
          authorId: input?.authorId,
          favoritedBy: input?.favoritedByUserId
            ? { some: { id: input?.favoritedByUserId } }
            : undefined,
          tags: input?.tag ? { some: { name: input?.tag } } : undefined,
        },
        include: {
          tags: true,
          author: {
            select: {
              id: true,
              username: true,
              image: true,
              bio: true,
              followedBy: ctx.userId
                ? { where: { id: ctx.userId } }
                : undefined,
            },
          },
          favoritedBy: ctx.userId ? { where: { id: ctx.userId } } : undefined,
          _count: {
            select: { favoritedBy: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return articles.map((article) => ({
        slug: article.slug,
        title: article.title,
        description: article.description,
        body: article.body,
        tags: article.tags.map((tag) => tag.name),
        createdAt: article.createdAt,
        isFavorited: Boolean(article.favoritedBy?.[0]),
        favoritesCount: article._count.favoritedBy,
        author: {
          id: article.author.id,
          username: article.author.username,
          image: article.author.image,
          bio: article.author.bio,
          isFollowing: Boolean(article.author.followedBy?.[0]),
        },
      }));
    }),
  getUserFeed: privateProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      include: { following: { select: { id: true } } },
    });
    const followingUsersIds = user?.following.map((user) => user.id);

    const articles = await ctx.prisma.article.findMany({
      where: {
        authorId: { in: followingUsersIds },
      },
      include: {
        tags: true,
        author: {
          select: {
            id: true,
            username: true,
            image: true,
            bio: true,
            followedBy: ctx.userId ? { where: { id: ctx.userId } } : undefined,
          },
        },
        favoritedBy: ctx.userId ? { where: { id: ctx.userId } } : undefined,
        _count: {
          select: { favoritedBy: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return articles.map((article) => ({
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tags: article.tags.map((tag) => tag.name),
      createdAt: article.createdAt,
      isFavorited: Boolean(article.favoritedBy?.[0]),
      favoritesCount: article._count.favoritedBy,
      author: {
        id: article.author.id,
        username: article.author.username,
        image: article.author.image,
        bio: article.author.bio,
        isFollowing: Boolean(article.author.followedBy?.[0]),
      },
    }));
  }),
});
