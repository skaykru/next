/* eslint-disable @next/next/no-img-element */
import dayjs from 'dayjs';
import { FC } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';

import Button from '~/components/Button';
import PenIcon from '~/assets/svg/pen.svg';
import PlusIcon from '~/assets/svg/plus.svg';
import TrashIcon from '~/assets/svg/trash.svg';
import HeartIcon from '~/assets/svg/heart.svg';
import { RouterOutputs, trpc } from '~/utils/trpc';
import { createServerSideTRPCHelpers } from '~/utils/trpc-ssr-helpers';
import ArticleCommentsSection from '~/components/ArticleCommentsSection';
import userAvatarPlaceholderImage from '~/assets/images/user-avatar-placeholder.jpeg';

export async function getServerSideProps(
  context: GetServerSidePropsContext<{ slug: string[] }>,
) {
  const trpcHelpers = await createServerSideTRPCHelpers(context);
  const slug = context.params?.slug.join('/') as string;

  try {
    await Promise.all([
      trpcHelpers.article.getBySlug.fetch(slug),
      trpcHelpers.user.getCurrentUser.prefetch(),
      trpcHelpers.comment.getCommentsByArticleSlug.prefetch(slug),
    ]);
    return {
      props: {
        trpcState: trpcHelpers.dehydrate(),
        slug,
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

export default function ArticlePage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const router = useRouter();
  const { data: currentUser } = trpc.user.getCurrentUser.useQuery();

  const trpcUtils = trpc.useUtils();

  const { data: article } = trpc.article.getBySlug.useQuery(props.slug);

  const { mutate: deleteArticle, isLoading: isDeleting } =
    trpc.article.delete.useMutation({
      onSuccess: () => router.replace('/'),
      onError: () => toast('Something went wrong', { type: 'error' }),
    });

  const onDeleteArticle = () => {
    if (!article) return;
    deleteArticle(article.slug);
  };

  const { mutate: changeFollowStatus, isLoading: isChangingFollowStatus } =
    trpc.user.changeFollowingStatus.useMutation({
      onSuccess: () => trpcUtils.article.getBySlug.invalidate(),
      onError: () => toast('Something went wrong', { type: 'error' }),
    });

  const onChangeFollowStatus = () => {
    if (!article) return;
    if (!currentUser)
      return router.push(`/register?navigateTo=${router.asPath}`);
    changeFollowStatus(article.author.id);
  };

  const {
    mutate: changeFavoritedStatus,
    isLoading: isChangingFavoritedStatus,
  } = trpc.article.changeFavoritedStatus.useMutation({
    onSuccess: () => trpcUtils.article.getBySlug.invalidate(),
    onError: () => toast('Something went wrong', { type: 'error' }),
  });

  const onChangeFavoritedStatus = () => {
    if (!article) return;
    if (!currentUser)
      return router.push(`/register?navigateTo=${router.asPath}`);
    changeFavoritedStatus(article.slug);
  };

  if (!article) return null;

  return (
    <>
      <Head>
        <title>{article.title} - Conduit</title>
      </Head>
      <div className="bg-zink-750">
        <div className="mx-auto max-w-[1150px] px-5 py-8">
          <h1 className="text-[44px] font-semibold text-white">
            {article.title}
          </h1>
          <ArticleInfo
            className="mt-8"
            article={article}
            onDeleteArticle={onDeleteArticle}
            isDeleting={isDeleting}
            onChangeFollowStatus={onChangeFollowStatus}
            isChangingFollowStatus={isChangingFollowStatus}
            onChangeFavoritedStatus={onChangeFavoritedStatus}
            isChangingFavoritedStatus={isChangingFavoritedStatus}
          />
        </div>
      </div>
      <div className="mx-auto mb-10 mt-8 flex max-w-[1150px] flex-col px-5">
        <p className="break-all text-[19px] leading-7 text-gray-900">
          {article.body}
        </p>
        {article.tags.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-x-1 gap-y-2">
            {article.tags.map((tag) => (
              <li
                className="rounded-full border border-gray-300 px-[10px] py-[2px] text-[13px] text-gray-400"
                key={tag}
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 border-t border-black border-opacity-10" />
        <ArticleInfo
          className="mt-4 self-center"
          article={article}
          onDeleteArticle={onDeleteArticle}
          isDeleting={isDeleting}
          onChangeFollowStatus={onChangeFollowStatus}
          isChangingFollowStatus={isChangingFollowStatus}
          onChangeFavoritedStatus={onChangeFavoritedStatus}
          isChangingFavoritedStatus={isChangingFavoritedStatus}
          showAuthorUsernameGreen
        />
        <ArticleCommentsSection
          className="mt-12 self-center"
          articleSlug={article.slug}
        />
      </div>
    </>
  );
}

type ArticleInfoProps = {
  onDeleteArticle: () => void;
  isDeleting: boolean;
  onChangeFollowStatus: () => void;
  isChangingFollowStatus: boolean;
  onChangeFavoritedStatus: () => void;
  isChangingFavoritedStatus: boolean;
  article: RouterOutputs['article']['getBySlug'];
  className?: string;
  showAuthorUsernameGreen?: boolean;
};

const ArticleInfo: FC<ArticleInfoProps> = ({
  article,
  className,
  onDeleteArticle,
  isDeleting,
  onChangeFavoritedStatus,
  isChangingFavoritedStatus,
  onChangeFollowStatus,
  isChangingFollowStatus,
  showAuthorUsernameGreen,
}) => {
  const { data: currentUser } = trpc.user.getCurrentUser.useQuery();

  return (
    <div className={`flex items-center ${className}`}>
      <Link href={`/@${article?.author.username}`}>
        <img
          src={
            article.author.image
              ? article.author.image
              : userAvatarPlaceholderImage.src
          }
          className="h-8 w-8 rounded-full"
          alt="Author image"
        />
      </Link>
      <div className="ml-2 flex flex-col">
        <Link
          href={`/@${article.author.username}`}
          className={`font-medium leading-4 ${
            showAuthorUsernameGreen
              ? 'text-green-550 hover:text-green-650 hover:underline'
              : 'text-white hover:text-gray-200 hover:underline'
          }`}
        >
          {article.author.username}
        </Link>
        <p className="text-[13px] font-light leading-4 text-gray-400">
          {dayjs(article?.createdAt).format('MMMM D, YYYY')}
        </p>
      </div>
      {currentUser?.id === article?.author.id ? (
        <>
          <Button
            asLink
            href={`/editor/${article.slug}`}
            className="ml-6"
            variantProps={{ size: 'sm', variant: 'secondary-outline' }}
          >
            <PenIcon className="mr-[3px] h-[11px]" /> Edit Article
          </Button>
          <Button
            onClick={onDeleteArticle}
            disabled={isDeleting}
            className="ml-1"
            variantProps={{
              size: 'sm',
              variant: 'danger-outline-2',
              disabled: isDeleting,
            }}
          >
            <TrashIcon className="mr-[3px] h-[11px]" /> Delete Article
          </Button>
        </>
      ) : (
        <>
          <Button
            onClick={onChangeFollowStatus}
            disabled={isChangingFollowStatus}
            className="ml-6"
            variantProps={{
              size: 'sm',
              variant: article?.author.isFollowing
                ? 'tertiary-outline'
                : 'secondary-outline',
              disabled: isChangingFollowStatus,
            }}
          >
            <PlusIcon className="mr-[3px] h-[14px]" />{' '}
            {article.author.isFollowing ? 'Unfollow' : 'Follow'}{' '}
            {article.author.username}
          </Button>
          <Button
            onClick={onChangeFavoritedStatus}
            disabled={isChangingFavoritedStatus}
            className="ml-1"
            variantProps={{
              size: 'sm',
              variant: 'primary-outline',
              disabled: isChangingFavoritedStatus,
            }}
          >
            <HeartIcon className="mr-[3px] h-[11px]" />{' '}
            {article.isFavorited ? 'Unfavorite' : 'Favorite'} Article (
            {article.favoritesCount})
          </Button>
        </>
      )}
    </div>
  );
};
