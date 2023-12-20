import Head from 'next/head';
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
        destination: '/login?navigateTo=/editor',
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

export default function CreateArticlePage() {
  const router = useRouter();

  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const { mutate: createArticle, isLoading } = trpc.article.create.useMutation({
    onSuccess: (createdArticleSlug) => {
      router.push(`/article/${createdArticleSlug}`);
    },
    onError: (e) => {
      if (e.data?.zodError) {
        const errors = JSON.parse(e.message) as Error[];
        const errorMessages = errors.map((error) => error.message);
        setErrorMessages(errorMessages);
        return;
      }

      toast('Something went wrong', { type: 'error' });
    },
  });

  const { handleSubmit, register, getValues } = useForm<{
    title: string;
    description: string;
    body: string;
    tags: string;
  }>();

  const onSubmit = () => {
    const values = getValues();
    const tags = values.tags.split(', ').filter((tag) => Boolean(tag.trim()));
    createArticle({ ...values, tags });
  };

  return (
    <>
      <Head>
        <title>Editor - Conduit</title>
      </Head>
      <div className="mx-auto mb-10 mt-6 max-w-[960px] px-5">
        <ValidationErrors errorMessages={errorMessages} className="mb-4" />
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col"
        >
          <Input
            {...register('title')}
            className="mb-4"
            placeholder="Article Title"
            type="text"
            disabled={isLoading}
            variantProps={{ disabled: isLoading }}
          />
          <Input
            {...register('description')}
            className="mb-4"
            placeholder="What's this article about?"
            type="text"
            disabled={isLoading}
            variantProps={{ size: 'sm', disabled: isLoading }}
          />
          <Textarea
            {...register('body')}
            className="mb-4"
            placeholder="Write your article"
            rows={8}
            disabled={isLoading}
            variantProps={{ size: 'sm', disabled: isLoading }}
          />
          <Input
            {...register('tags')}
            className="mb-4"
            placeholder="Enter tags (separate tags with ',  ')"
            type="text"
            disabled={isLoading}
            variantProps={{ size: 'sm', disabled: isLoading }}
          />
          <Button
            type="submit"
            className="self-end"
            disabled={isLoading}
            variantProps={{ disabled: isLoading }}
          >
            Publish Article
          </Button>
        </form>
      </div>
    </>
  );
}
