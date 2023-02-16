import { asset, Head } from "$fresh/runtime.ts";
import type { FunctionComponent } from "preact";
import { Fragment } from "preact";

interface LayoutProps {
  title: string;
  description: string;
}

export const Layout: FunctionComponent<LayoutProps> = function Layout({
  children,
  description,
  title,
}) {
  return (
    <Fragment>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="stylesheet" href={asset("/styles/fonts.css")} />
        <link rel="stylesheet" href={asset("/styles/global.css")} />
        <link rel="icon" href={asset("/favicon.ico")} sizes="any" />
        <link rel="icon" href={asset("/icon.svg")} type="image/svg+xml" />
        <link rel="apple-touch-icon" href={asset("/apple-touch-icon.png")} />
        <link rel="manifest" href={asset("/manifest.webmanifest")} />
        <meta name="theme-color" content="#00e9a3" />
      </Head>
      {children}
    </Fragment>
  );
};
