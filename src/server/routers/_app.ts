import { router } from '../trpc';
import { tagRouter } from './tag';
import { userRouter } from './user';
import { articleRouter } from './article';
import { commentRouter } from './comment';

export const appRouter = router({
  user: userRouter,
  article: articleRouter,
  comment: commentRouter,
  tag: tagRouter,
});

export type AppRouter = typeof appRouter;
