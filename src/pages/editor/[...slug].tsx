import Head from 'next/head';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';

import { trpc } from '~/utils/trpc';
import Input from '~/components/Input';
import Button from '~/components/Button';
import Textarea from '~/components/Textarea';
import { createServerSideTRPCHelpers } from '~/utils/trpc-ssr-helpers';

export async function getServerSideProps(
  context: GetServerSidePropsContext<{ slug: string[] }>,
) {
  const trpcHelpers = await createServerSideTRPCHelpers(context);
  const slug = context.params?.slug!.join('/') as string;

  const [currentUser, article] = await Promise.allSettled([
    trpcHelpers.user.getCurrentUser.fetch(),
    trpcHelpers.article.getBySlug.fetch(slug),
  ]);

  if (currentUser.status === 'rejected' || !currentUser.value) {
    return {
      redirect: {
        destination: `/login?navigateTo=/editor/${slug}`,
        permanent: false,
      },
    };
  }

  if (
    article.status === 'rejected' ||
    currentUser.value.id !== article.value.author.id
  ) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {
      slug,
      trpcState: trpcHelpers.dehydrate(),
    },
  };
}

export default function CreateArticlePage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const router = useRouter();

  const { data: article } = trpc.article.getBySlug.useQuery(props.slug);

  const { mutate: updateArticle, isLoading } = trpc.article.update.useMutation({
    onSuccess: (updatedArticleSlug) =>
      router.push(`/article/${updatedArticleSlug}`),
    onError: () => toast('Something went wrong', { type: 'error' }),
  });

  const { handleSubmit, register, getValues } = useForm<{
    title: string;
    description: string;
    body: string;
    tags: string;
  }>({
    defaultValues: {
      title: article?.title,
      description: article?.description,
      body: article?.body,
      tags: article?.tags.join(', '),
    },
  });

  const onSubmit = () => {
    if (!article) return;

    const values = getValues();
    const tags = values.tags.split(', ').filter((tag) => Boolean(tag.trim()));
    updateArticle({ slug: article?.slug, ...values, tags });
  };

  return (
    <>
      <Head>
        <title>Editor - Conduit</title>
      </Head>
      <div className="mx-auto mb-10 mt-6 max-w-[960px] px-5">
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
