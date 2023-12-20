import Head from 'next/head';
import { ReactElement } from 'react';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';

import { trpc } from '~/utils/trpc';
import { NextPageWithLayout } from '~/pages/_app';
import ArticlesList from '~/components/ArticlesList';
import ProfilePageLayout from '~/components/ProfilePageLayout';
import { createServerSideTRPCHelpers } from '~/utils/trpc-ssr-helpers';

export async function getServerSideProps(
  context: GetServerSidePropsContext<{ username: string }>,
) {
  const trpcHelpers = await createServerSideTRPCHelpers(context);
  const username = context.params?.username.slice(1) as string; // remove @ from username param

  try {
    const user = await trpcHelpers.user.getByUsername.fetch(username);

    await Promise.all([
      trpcHelpers.user.getCurrentUser.prefetch(),
      trpcHelpers.article.listArticles.prefetch({ favoritedByUserId: user.id }),
    ]);

    return {
      props: {
        trpcState: trpcHelpers.dehydrate(),
        username: username,
      },
    };
  } catch (e) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
}

const ProfilePage: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = (props) => {
  const { data: user } = trpc.user.getByUsername.useQuery(props.username);

  const { data: articles } = trpc.article.listArticles.useQuery(
    {
      favoritedByUserId: user?.id,
    },
    { refetchOnWindowFocus: false },
  );

  if (!user) return null;

  return (
    <>
      <Head>
        <title>Articles favorited by {user.username} - Conduit</title>
      </Head>
      <ArticlesList
        className="mx-auto max-w-[950px] px-5"
        articles={articles}
      />
    </>
  );
};

export default ProfilePage;

ProfilePage.getLayout = (page: ReactElement) => (
  <>
    <ProfilePageLayout />
    {page}
  </>
);
