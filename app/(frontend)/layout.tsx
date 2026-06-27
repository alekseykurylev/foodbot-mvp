import type { Metadata } from "next";
import Script from "next/script";
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";
import { Header } from "@/components/header/header";
import { Layout, Main } from "@/components/layout/layout";
import { Footer } from "@/components/footer/footer";
import "@mantine/core/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "foodbot-mvp",
  description: "MVP бота для заказа еды",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <Script src="https://st.max.ru/js/max-web-app.js" strategy="beforeInteractive" />
        <MantineProvider>
          <Layout>
            <Header />
            <Main>{children}</Main>
            <Footer />
          </Layout>
        </MantineProvider>
      </body>
    </html>
  );
}
