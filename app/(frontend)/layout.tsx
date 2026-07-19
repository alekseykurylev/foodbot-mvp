import { Geist_Mono, Inter } from "next/font/google";

import "@/global/styles/globals.css";
import { ThemeProvider } from "@/shell/providers/theme-provider";
import { cn } from "@/common/utils/cn";
import { Header } from "@/shell/layout/header/header";
import { Footer } from "@/shell/layout/footer/footer";
import { EcommerceProvider } from "@/shell/providers/ecommerce-provider";

const inter = Inter({ subsets: ["cyrillic"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["cyrillic"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={cn("antialiased scroll-smooth", fontMono.variable, "font-sans", inter.variable)}
    >
      <body className="relative bg-sidebar-accent">
        <ThemeProvider>
          <EcommerceProvider>
            <div className="isolate flex min-h-svh flex-col">
              <Header />
              <main className="flex min-h-0 flex-1 flex-col">{children}</main>
              <Footer />
            </div>
          </EcommerceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
