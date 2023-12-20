/* eslint-disable @next/next/no-img-element */
import dayjs from 'dayjs';
import { FC } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

import Button from '~/components/Button';
import HeartIcon from '~/assets/svg/heart.svg';
import { RouterOutputs, trpc } from '~/utils/trpc';
import userAvatarPlaceholderImage from '~/assets/images/user-avatar-placeholder.jpeg';

type Props = {
  articles?: RouterOutputs['article']['listArticles'];
  className?: string;
  isLoading?: boolean;
};

const ArticlesList: FC<Props> = ({ articles, className, isLoading }) => {
  return (
    <ul className={`flex flex-col ${className}`}>
      {isLoading && <p className="mt-4">Loading articles...</p>}
      {!isLoading && articles?.length === 0 && (
        <p className="mt-4">No articles are here... yet.</p>
      )}
      {!isLoading &&
        articles?.map((article) => (
          <ListItem key={article.slug} article={article} />
        ))}
    </ul>
  );
};

export default ArticlesList;

type ListItemProps = {
  article: RouterOutputs['article']['listArticles'][number];
};

const ListItem: FC<ListItemProps> = ({ article }) => {
  const router = useRouter();
  const trpcUtils = trpc.useUtils();

  const { data: currentUser } = trpc.user.getCurrentUser.useQuery();

  const {
    mutate: changeFavoritedStatus,
    isLoading: isChangingFavoritedStatus,
  } = trpc.article.changeFavoritedStatus.useMutation({
    onSuccess: () => {
      trpcUtils.article.listArticles.invalidate();
      trpcUtils.article.getUserFeed.invalidate();
    },
    onError: () => toast('Something went wrong', { type: 'error' }),
  });

  const handleChangeFavoritedStatus = () => {
    if (!currentUser) {
      return router.push(`/register?navigateTo=${router.asPath}`);
    }

    changeFavoritedStatus(article.slug);
  };

  return (
    <li
      className="border-t border-black border-opacity-10 py-6 first:border-none"
      key={article.slug}
    >
      <div className="flex justify-between">
        <div className="flex items-center">
          <Link href={`/@${article?.author.username}`}>
            <img
              src={
                article?.author.image
                  ? article.author.image
                  : userAvatarPlaceholderImage.src
              }
              className="h-8 w-8 rounded-full"
              alt="Author image"
            />
          </Link>
          <div className="ml-2 flex flex-col">
            <Link
              href={`/@${article?.author.username}`}
              className="font-medium leading-4 text-green-550 hover:text-green-650 hover:underline"
            >
              {article?.author.username}
            </Link>
            <p className="text-[13px] font-light leading-4 text-gray-400">
              {dayjs(article?.createdAt).format('MMMM D, YYYY')}
            </p>
          </div>
        </div>
        <Button
          onClick={handleChangeFavoritedStatus}
          disabled={isChangingFavoritedStatus}
          variantProps={{
            size: 'sm',
            variant: article.isFavorited ? 'primary' : 'primary-outline',
            disabled: isChangingFavoritedStatus,
          }}
        >
          <HeartIcon className="mr-[3px] h-3" />
          {article.favoritesCount}
        </Button>
      </div>
      <Link className="inline-block" href={`/article/${article.slug}`}>
        <h4 className="mt-4 break-all text-2xl font-semibold">
          {article.title}
        </h4>
        <p className="break-all font-light leading-5 text-gray-400">
          {article.description}
        </p>
      </Link>
      <div className="mt-4 flex justify-between">
        <Link
          className="text-[13px] font-light text-gray-400"
          href={`/article/${article.slug}`}
        >
          Read more...
        </Link>
        {article.tags.length > 0 && (
          <Link href={`/article/${article.slug}`}>
            <ul className="flex gap-x-1">
              {article.tags.map((tag) => (
                <li
                  className="rounded-full border border-gray-300 px-2 text-[13px] text-gray-400"
                  key={tag}
                >
                  {tag}
                </li>
              ))}
            </ul>
          </Link>
        )}
      </div>
    </li>
  );
};
