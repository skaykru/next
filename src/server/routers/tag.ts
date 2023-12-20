import { publicProcedure, router } from '../trpc';

export const tagRouter = router({
  getPopularTags: publicProcedure.query(async ({ ctx }) => {
    const tags = (await ctx.prisma.$queryRaw`
        SELECT ArticleTag.name FROM ArticleTag
        LEFT JOIN _ArticleToArticleTag ON ArticleTag.id = _ArticleToArticleTag.B
        GROUP BY ArticleTag.name
        HAVING COUNT(*) > 1
        ORDER BY COUNT(*) DESC
        LIMIT 10;
    `) as { name: string }[];

    return tags.map((tag) => tag.name);
  }),
});
