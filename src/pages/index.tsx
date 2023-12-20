import Head from 'next/head';
import Link from 'next/link';
import { GetServerSidePropsContext } from 'next';
import { useSearchParams } from 'next/navigation';

import { trpc } from '~/utils/trpc';
import ArticlesList from '~/components/ArticlesList';
import { createServerSideTRPCHelpers } from '~/utils/trpc-ssr-helpers';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const trpcHelpers = await createServerSideTRPCHelpers(context);

  const tag = context.query['tag'] as string;
  const isGlobalFeed = Boolean(context.query['isGlobalFeed']);

  const activeFeed = isGlobalFeed ? 'global' : tag ? 'tag' : 'user';

  const currentUser = await trpcHelpers.user.getCurrentUser.fetch();

  if (!currentUser && activeFeed === 'user') {
    return {
      redirect: {
        destination: '/?isGlobalFeed=1',
        permanent: false,
      },
    };
  }

  await Promise.all([
    trpcHelpers.tag.getPopularTags.prefetch(),
    activeFeed === 'user' && trpcHelpers.article.getUserFeed.prefetch(),
    activeFeed === 'tag' && trpcHelpers.article.listArticles.prefetch({ tag }),
    activeFeed === 'global' &&
      trpcHelpers.article.listArticles.prefetch({ tag: undefined }),
  ]);

  return {
    props: {
      trpcState: trpcHelpers.dehydrate(),
    },
  };
}

export default function HomePage() {
  const searchParams = useSearchParams();
  const isGlobalFeed = Boolean(searchParams.get('isGlobalFeed'));
  const activeTag = searchParams.get('tag');

  const { data: currentUser } = trpc.user.getCurrentUser.useQuery();
  const { data: popularTags } = trpc.tag.getPopularTags.useQuery();
  const { data: userFeedArticles } = trpc.article.getUserFeed.useQuery();
  const { data: globalFeedArticles } = trpc.article.listArticles.useQuery({
    tag: activeTag || undefined,
  });

  const activeFeed = isGlobalFeed ? 'global' : activeTag ? 'tag' : 'user';
  const articles =
    activeFeed === 'user' ? userFeedArticles : globalFeedArticles;

  return (
    <>
      <Head>
        <title>Home - Conduit</title>
      </Head>
      {!currentUser && (
        <div className="bg-green-550 py-8 text-center text-white shadow-[inset_0_8px_8px_-8px_rgba(0,0,0,0.3),inset_0_-8px_8px_-8px_rgba(0,0,0,0.3)]">
          <h1 className="font-titilium text-[56px] font-bold [text-shadow:0px_1px_3px_rgba(0,0,0,0.3)]">
            conduit
          </h1>
          <h3 className="text-2xl font-light">
            A place to share your knowledge
          </h3>
        </div>
      )}
      <div className="mx-auto mt-8 flex max-w-[1180px] justify-between px-5">
        <div className="grow">
          <div>
            {currentUser && (
              <Link
                href="/"
                className={`relative inline-block border-b-2 px-4 py-2 ${
                  activeFeed === 'user'
                    ? 'border-green-550 text-green-550'
                    : 'border-transparent text-[#AAAAAA]'
                }`}
              >
                Your Feed
              </Link>
            )}
            <Link
              href="/?isGlobalFeed=1"
              className={`relative inline-block border-b-2 px-4 py-2 ${
                activeFeed === 'global'
                  ? 'border-green-550 text-green-550'
                  : 'border-transparent text-[#AAAAAA]'
              }`}
            >
              Global Feed
            </Link>
            {activeFeed === 'tag' && (
              <Link
                href={`/?tag=${activeTag}`}
                className="relative inline-block border-b-2 border-green-550 px-4 py-2 text-green-550"
              >
                #{activeTag}
              </Link>
            )}
            <div className="mt-[-1.5px] border-b border-black border-opacity-10" />
          </div>
          <ArticlesList className="mt-[-1px] grow" articles={articles} />
        </div>
        <div className="ml-8 w-full max-w-[255px] self-start rounded bg-[#F3F3F3] px-[10px] pb-[10px] pt-[5px]">
          <p>Popular Tags</p>
          {popularTags?.length === 0 && (
            <p className="mt-1">There are no tags used yet.</p>
          )}
          {popularTags && popularTags.length !== 0 && (
            <ul className="mt-1 flex flex-wrap gap-[2px]">
              {popularTags.map((tag) => (
                <li key={tag}>
                  <Link
                    className="cursor-pointer rounded-full bg-[#687077] px-2 py-[2px] text-[13px] text-white"
                    href={`/?tag=${tag}`}
                  >
                    {tag}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
