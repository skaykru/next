/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

import { trpc } from '~/utils/trpc';
import Button from '~/components/Button';
import GearIcon from '~/assets/svg/gear.svg';
import PlusIcon from '~/assets/svg/plus.svg';
import userAvatarPlaceholderImage from '~/assets/images/user-avatar-placeholder.jpeg';

const ProfilePageLayout = () => {
  const router = useRouter();
  const username = (router.query.username as string).slice(1); // remove @ from username param

  const trpcUtils = trpc.useUtils();

  const { data: currentUser } = trpc.user.getCurrentUser.useQuery();
  const { data: user } = trpc.user.getByUsername.useQuery(username);

  const { mutate: changeFollowStatus, isLoading: isChangingFollowStatus } =
    trpc.user.changeFollowingStatus.useMutation({
      onSuccess: () => trpcUtils.user.getByUsername.invalidate(),
      onError: () => toast('Something went wrong', { type: 'error' }),
    });

  const onChangeFollowStatus = () => {
    if (!user) return;
    if (!currentUser)
      return router.push(`/register?navigateTo=${router.asPath}`);

    changeFollowStatus(user.id);
  };

  if (!user) return null;

  return (
    <>
      <div className="bg-gray-100">
        <div className="mx-auto flex max-w-[950px] flex-col items-center px-5 pb-4 pt-8">
          <img
            src={user.image ? user.image : userAvatarPlaceholderImage.src}
            className="h-[100px] w-[100px] rounded-full"
            alt="User avatar"
          />
          <h2 className="mt-3 text-2xl font-bold">{user.username}</h2>
          {currentUser?.id === user.id ? (
            <Button
              asLink
              href={`/settings`}
              className="mt-2 self-end"
              variantProps={{ variant: 'secondary-outline', size: 'sm' }}
            >
              <GearIcon className="mr-1 h-3" />
              Edit Profile Settings
            </Button>
          ) : (
            <Button
              onClick={onChangeFollowStatus}
              disabled={isChangingFollowStatus}
              className="mt-2 self-end"
              variantProps={{
                size: 'sm',
                variant: user.isFollowing
                  ? 'tertiary-outline'
                  : 'secondary-outline',
                disabled: isChangingFollowStatus,
              }}
            >
              <PlusIcon className="mr-[3px] h-[14px]" />{' '}
              {user.isFollowing ? 'Unfollow' : 'Follow'} {user.username}
            </Button>
          )}
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-[950px] px-5">
        <Link
          className={`inline-block px-4 py-2 ${
            `/@${user.username}` === router.asPath
              ? 'border-b-2 border-green-550 text-green-550'
              : 'text-[#AAAAAA]'
          }`}
          href={`/@${user.username}`}
        >
          My Articles
        </Link>
        <Link
          className={`inline-block px-4 py-2 ${
            `/@${user.username}/favorites` === router.asPath
              ? 'border-b-2 border-green-550 text-green-550'
              : 'text-[#AAAAAA]'
          }`}
          href={`/@${user.username}/favorites`}
        >
          Favorited Articles
        </Link>
        <div className="mt-[-1.5px] border-b border-black border-opacity-10" />
      </div>
    </>
  );
};

export default ProfilePageLayout;
