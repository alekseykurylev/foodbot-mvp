import { Geist_Mono, Inter } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

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
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body className="relative">
        <ThemeProvider>
          <div className="isolate flex min-h-svh flex-col">
            <header>header</header>
            <main className="flex min-h-0 flex-1 flex-col">{children}</main>
            <footer>footer</footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
