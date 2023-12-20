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

type InputName = 'username' | 'email' | 'password';

const INPUTS: { placeholder: string; type: string; name: InputName }[] = [
  {
    placeholder: 'Username',
    type: 'text',
    name: 'username',
  },
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

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const navigateToAfterRegister = searchParams.get('navigateTo');

  const { handleSubmit, register, getValues } =
    useForm<Record<InputName, string>>();
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const trpcUtils = trpc.useUtils();

  const { mutate: signUp, isLoading } = trpc.user.register.useMutation({
    onSuccess: async (res) => {
      Cookies.set('accessToken', res.accessToken);
      await trpcUtils.user.getCurrentUser.invalidate();
      router.replace(navigateToAfterRegister ? navigateToAfterRegister : '/');
    },
    onError: (e) => {
      if (
        e.message === 'user with this email already exists' ||
        e.message === 'user with this username already exists'
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
    signUp(values);
  };

  return (
    <>
      <Head>
        <title>Sign up - Conduit</title>
      </Head>
      <div className="mx-auto mt-5 max-w-[580px] px-5 text-center">
        <h1 className="text-[40px]">Sign up</h1>
        <Link
          href={
            navigateToAfterRegister
              ? `/login?navigateTo=${navigateToAfterRegister}`
              : '/login'
          }
          className="text-green-550 hover:text-green-650 hover:underline"
        >
          Have an account?
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
            Sign up
          </Button>
        </form>
      </div>
    </>
  );
}
