import Head from 'next/head';
import Cookies from 'js-cookie';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { GetServerSidePropsContext } from 'next';

import { trpc } from '~/utils/trpc';
import Input from '~/components/Input';
import Button from '~/components/Button';
import Textarea from '~/components/Textarea';
import ValidationErrors from '~/components/ValidationErrors';
import { createServerSideTRPCHelpers } from '~/utils/trpc-ssr-helpers';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const trpcHelpers = await createServerSideTRPCHelpers(context);

  const currentUser = await trpcHelpers.user.getCurrentUser.fetch();

  if (!currentUser) {
    return {
      redirect: {
        destination: '/login?navigateTo=/settings',
        permanent: false,
      },
    };
  }

  return {
    props: {
      trpcState: trpcHelpers.dehydrate(),
    },
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: currentUser } = trpc.user.getCurrentUser.useQuery();

  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const { register, handleSubmit, getValues } = useForm<{
    image: string;
    bio: string;
    username: string;
    email: string;
    password: string;
  }>({
    defaultValues: {
      image: currentUser?.image || undefined,
      bio: currentUser?.bio || undefined,
      username: currentUser?.username,
      email: currentUser?.email,
    },
  });

  const trpcUtils = trpc.useUtils();

  const { isLoading: isUpdatingUser, mutate: updateUser } =
    trpc.user.update.useMutation({
      onSuccess: async () => {
        trpcUtils.user.getCurrentUser.invalidate();
        router.push(`/@${currentUser?.username}`);
      },
      onError: (e) => {
        if (
          e.message === 'email must be unique' ||
          e.message === 'username must be unique'
        ) {
          setErrorMessages([e.message]);
          return;
        }

        if (e.data?.zodError) {
          const errors = JSON.parse(e.message) as Error[];
          const errorMessages = errors.map((error) => error.message);
          setErrorMessages(errorMessages);
          return;
        }

        toast('Something went wrong', { type: 'error' });
      },
    });

  const onSubmit = () => {
    const values = getValues();
    updateUser(values);
  };

  const onLogout = async () => {
    Cookies.remove('accessToken');
    trpcUtils.user.getCurrentUser.reset();
    router.replace('/');
  };

  return (
    <>
      <Head>
        <title>Settings - Conduit</title>
      </Head>
      <div className="mx-auto mb-10 max-w-[580px] px-5">
        <h1 className="mt-6 text-center text-[40px] text-gray-700">
          Your Settings
        </h1>
        <ValidationErrors errorMessages={errorMessages} className="mb-2" />
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col"
        >
          <Input
            {...register('image')}
            className="mb-4"
            placeholder="Url of profile picture"
            type="text"
            disabled={isUpdatingUser}
            variantProps={{ disabled: isUpdatingUser, size: 'sm' }}
          />
          <Input
            {...register('username')}
            className="mb-4"
            placeholder="Username"
            type="text"
            disabled={isUpdatingUser}
            variantProps={{ disabled: isUpdatingUser }}
          />
          <Textarea
            {...register('bio')}
            className="mb-4"
            placeholder="Short bio about you"
            rows={8}
            disabled={isUpdatingUser}
            variantProps={{ disabled: isUpdatingUser }}
          />
          <Input
            {...register('email')}
            className="mb-4"
            placeholder="Email"
            type="email"
            disabled={isUpdatingUser}
            variantProps={{ disabled: isUpdatingUser }}
          />
          <Input
            {...register('password')}
            className="mb-4"
            placeholder="New Password"
            type="password"
            disabled={isUpdatingUser}
            variantProps={{ disabled: isUpdatingUser }}
          />
          <Button
            type="submit"
            className="self-end"
            disabled={isUpdatingUser}
            variantProps={{ disabled: isUpdatingUser }}
          >
            Update Settings
          </Button>
        </form>
        <div className="my-4 border-t border-gray-300" />
        <Button
          onClick={onLogout}
          disabled={isUpdatingUser}
          variantProps={{
            variant: 'danger-outline-1',
            size: 'md',
            disabled: isUpdatingUser,
          }}
        >
          Or click here to logout.
        </Button>
      </div>
    </>
  );
}
