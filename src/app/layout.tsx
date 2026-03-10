import type { Metadata, Viewport } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import Providers from "@/components/Providers";
import { UserPreferencesProvider, AppTheme, StockColorMode } from '@/contexts/UserPreferencesContext';
import { getUserSettings } from "@/lib/actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "FluxX",
  description: "Personal Asset Management",
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FluxX",
    startupImage: "/icons/apple-touch-icon.png",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#edf0f4" },
    { media: "(prefers-color-scheme: dark)", color: "#121214" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userSettings = await getUserSettings();
  const initialTheme = (userSettings?.appTheme || 'DARK') as AppTheme;

  return (
    <html lang="en" suppressHydrationWarning className={cn(
      GeistSans.variable, 
      GeistMono.variable,
      initialTheme === 'LIGHT' ? "" : "dark",
      initialTheme === 'BLACK' ? "theme-black" : ""
    )}>
      <body
        className="font-sans antialiased"
      >
        <script dangerouslySetInnerHTML={{
          __html: `
          (function() {
            try {
              // Service Worker registration
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('SW registered');
                  }).catch(function(err) {
                    console.log('SW reg error:', err);
                  });
                });
              }

              // Theme initialization sync with server-rendered logic
              // This runs BEFORE hydration to ensure localStorage overrides if different from server
              const savedTheme = localStorage.getItem('app-theme');
              const html = document.documentElement;
              const serverTheme = "${initialTheme}";
              
              const targetTheme = savedTheme || serverTheme;
              
              if (targetTheme === 'BLACK') {
                html.classList.add('dark', 'theme-black');
              } else if (targetTheme === 'LIGHT') {
                html.classList.remove('dark', 'theme-black');
              } else if (targetTheme === 'DARK') {
                html.classList.add('dark');
                html.classList.remove('theme-black');
              }
            } catch (e) {}
          })();
        `}} />
        <Providers>
          <UserPreferencesProvider 
            initialTheme={initialTheme} 
            initialStockColorMode={(userSettings?.stockColorMode || 'KOREA') as StockColorMode}
          >
            {children}
          </UserPreferencesProvider>
        </Providers>
      </body>
    </html>
  );
}
