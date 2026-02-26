import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import Providers from "@/components/Providers";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "FluxX",
  description: "Personal Asset Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body
        className="font-sans antialiased"
      >
        <script dangerouslySetInnerHTML={{
          __html: `
          (function() {
            var c = document.cookie;
            if (c.indexOf('view-mode=') === -1 && window.innerWidth <= 768) {
              document.cookie = 'view-mode=mobile; path=/; max-age=86400';
              window.location.reload();
            }
          })();
        `}} />
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            themes={["light", "dark", "paper", "cyber", "nature"]}
          >
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
