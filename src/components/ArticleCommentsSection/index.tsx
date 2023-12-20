/* eslint-disable @next/next/no-img-element */
import dayjs from 'dayjs';
import { FC } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';

import Button from '~/components/Button';
import Textarea from '~/components/Textarea';
import TrashIcon from '~/assets/svg/trash.svg';
import { RouterOutputs, trpc } from '~/utils/trpc';
import userAvatarPlaceholderImage from '~/assets/images/user-avatar-placeholder.jpeg';

type Props = {
  className?: string;
  articleSlug: string;
};

const ArticleCommentsSection: FC<Props> = ({ className, articleSlug }) => {
  const router = useRouter();
  const trpcUtils = trpc.useUtils();

  const { data: currentUser } = trpc.user.getCurrentUser.useQuery();

  const { data: comments } =
    trpc.comment.getCommentsByArticleSlug.useQuery(articleSlug);

  const { handleSubmit, reset, register, getValues } = useForm<{
    commentBody: string;
  }>();

  const { mutate: createComment, isLoading: isCreatingComment } =
    trpc.comment.create.useMutation({
      onSuccess: () => {
        trpcUtils.comment.getCommentsByArticleSlug.invalidate();
        reset();
      },
      onError: () => toast('Something went wrong', { type: 'error' }),
    });

  const onSubmit = () => {
    const { commentBody } = getValues();
    if (!commentBody) return;
    createComment({ articleSlug, commentBody });
  };

  return (
    <div className={`w-full max-w-[728px] ${className}`}>
      {currentUser ? (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <Textarea
            {...register('commentBody')}
            rows={3}
            placeholder="Write a comment..."
            className="rounded-b-none border-b-0   p-5 outline-none"
            disabled={isCreatingComment}
            variantProps={{ size: 'sm', disabled: isCreatingComment }}
          />
          <div className="flex items-center justify-between rounded-b border border-gray-300 bg-gray-100 px-5 py-3">
            <img
              src={
                currentUser?.image
                  ? currentUser.image
                  : userAvatarPlaceholderImage.src
              }
              className="h-[30px] w-[30px] rounded-full"
              alt="User avatar"
            />
            <Button
              type="submit"
              className="font-bold"
              disabled={isCreatingComment}
              variantProps={{ size: 'sm', disabled: isCreatingComment }}
            >
              Post Comment
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-center">
          <Link
            href={`/login?navigateTo=${router.asPath}`}
            className="text-green-550 hover:text-green-650 hover:underline"
          >
            Sign in
          </Link>{' '}
          or{' '}
          <Link
            href={`/register?navigateTo=${router.asPath}`}
            className="text-green-550 hover:text-green-650 hover:underline"
          >
            sign up
          </Link>{' '}
          to add comments on this article
        </p>
      )}

      <ul>
        {comments?.map((comment) => (
          <CommentsListItem key={comment.id} comment={comment} />
        ))}
      </ul>
    </div>
  );
};

export default ArticleCommentsSection;

type CommentsListItemProps = {
  comment: RouterOutputs['comment']['getCommentsByArticleSlug'][number];
};

const CommentsListItem: FC<CommentsListItemProps> = ({ comment }) => {
  const { data: currentUser } = trpc.user.getCurrentUser.useQuery();

  const trpcUtils = trpc.useUtils();

  const { mutate: deleteCommentById, isLoading: isDeleting } =
    trpc.comment.deleteById.useMutation({
      onSuccess: () => trpcUtils.comment.getCommentsByArticleSlug.invalidate(),
      onError: () => toast('Something went wrong', { type: 'error' }),
    });

  const onDelete = () => {
    deleteCommentById(comment.id);
  };

  return (
    <li
      key={comment.id}
      className="mt-3 flex flex-col rounded border border-gray-300"
    >
      <div className="break-words p-5">{comment.body}</div>
      <div className="flex items-center justify-between border-t border-gray-300 bg-gray-100 px-5 py-3">
        <div className="flex items-center">
          <Link href={`/@${comment.author.username}`}>
            <img
              src={
                comment.author.image
                  ? comment.author.image
                  : userAvatarPlaceholderImage.src
              }
              className="h-5 w-5 rounded-full"
              alt="Comment's author avatar"
            />
          </Link>
          <Link
            href={`/@${comment.author.username}`}
            className="ml-2 text-[13px] font-light text-green-550 hover:text-green-650 hover:underline"
          >
            {comment.author.username}
          </Link>
          <p className="ml-2 text-[13px] font-light text-gray-400">
            {dayjs(comment.createdAt).format('MMMM D, YYYY')}
          </p>
        </div>
        {currentUser?.id === comment.author.id && (
          <button disabled={isDeleting} onClick={onDelete}>
            <TrashIcon
              className={`h-3 ${
                isDeleting
                  ? 'cursor-not-allowed fill-gray-300'
                  : 'fill-[#959595]'
              }`}
            />
          </button>
        )}
      </div>
    </li>
  );
};
