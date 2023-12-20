import { NextPage } from 'next';
import type { AppProps } from 'next/app';
import 'react-toastify/dist/ReactToastify.css';
import NextNProgress from 'nextjs-progressbar';
import { ReactElement, ReactNode } from 'react';
import { ToastContainer as ToastContainerBase } from 'react-toastify';

import '~/styles/globals.css';
import { trpc } from '~/utils/trpc';
import PageLayout from '~/components/PageLayout';
import { getPageLoadingProgressbarCSS } from '~/styles/get-page-loading-progressbar-css';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const App = ({ Component, pageProps }: AppPropsWithLayout) => {
  const getLayout = Component.getLayout || ((page) => page);

  return (
    <>
      <PageLayout>{getLayout(<Component {...pageProps} />)}</PageLayout>
      <ToastContainer />
      <NextNProgress
        options={{
          showSpinner: false,
        }}
        transformCSS={(defaultCSS) => (
          <style>{getPageLoadingProgressbarCSS(defaultCSS)}</style>
        )}
      />
    </>
  );
};

export default trpc.withTRPC(App);

const ToastContainer = () => (
  <ToastContainerBase
    position="top-right"
    autoClose={5000}
    hideProgressBar={false}
    newestOnTop={false}
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
    theme="light"
  />
);
