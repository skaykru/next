import Head from 'next/head';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { GetServerSidePropsContext } from 'next';
import { useSearchParams } from 'next/navigation';

import { trpc } from '~/utils/trpc';
import Input from '~/components/Input';
import Button from '~/components/Button';
import ValidationErrors from '~/components/ValidationErrors';
import { createServerSideTRPCHelpers } from '~/utils/trpc-ssr-helpers';

type InputName = 'email' | 'password';

const INPUTS: { placeholder: string; type: string; name: InputName }[] = [
  {
    placeholder: 'Email',
    type: 'email',
    name: 'email',
  },
  {
    placeholder: 'Password',
    type: 'password',
    name: 'password',
  },
];

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const trpcHelpers = await createServerSideTRPCHelpers(context);
  await trpcHelpers.user.getCurrentUser.prefetch();
  return { props: { trpcState: trpcHelpers.dehydrate() } };
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const navigateToAfterLogin = searchParams.get('navigateTo');

  const { handleSubmit, register, getValues } =
    useForm<Record<InputName, string>>();
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const utils = trpc.useUtils();

  const { mutate: login, isLoading } = trpc.user.login.useMutation({
    onSuccess: async (res) => {
      Cookies.set('accessToken', res.accessToken);
      await utils.user.getCurrentUser.invalidate();
      router.replace(navigateToAfterLogin ? navigateToAfterLogin : '/');
    },
    onError: (e) => {
      if (
        e.message === 'user with this email does not exist' ||
        e.message === 'password is not correct'
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

  const onSubmit = async () => {
    const values = getValues();
    login(values);
  };

  return (
    <>
      <Head>
        <title>Sign in - Conduit</title>
      </Head>
      <div className="mx-auto mt-5 max-w-[580px] px-5 text-center">
        <h1 className="text-[40px]">Sign in</h1>
        <Link
          href={
            navigateToAfterLogin
              ? `/register?navigateTo=${navigateToAfterLogin}`
              : '/register'
          }
          className="text-green-550 hover:text-green-650 hover:underline"
        >
          Need an account?
        </Link>
        <ValidationErrors errorMessages={errorMessages} className="mb-1 mt-3" />
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 flex flex-col"
        >
          {INPUTS.map(({ type, placeholder, name }) => (
            <Input
              {...register(name)}
              key={name}
              type={type}
              placeholder={placeholder}
              disabled={isLoading}
              variantProps={{ disabled: isLoading }}
              className="mb-4"
            />
          ))}
          <Button
            type="submit"
            disabled={isLoading}
            variantProps={{ disabled: isLoading }}
            className="self-end"
          >
            Sign in
          </Button>
        </form>
      </div>
    </>
  );
}
