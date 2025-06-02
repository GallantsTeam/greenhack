
'use client';

import { Exo_2 } from 'next/font/google'; 
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
// import CustomCursor from '@/components/CustomCursor'; // Temporarily disable custom cursor
import React, { useEffect, useState } from 'react';

const exo2 = Exo_2({ 
  variable: '--font-exo-2',
  subsets: ['latin', 'cyrillic'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], 
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light-theme'); // Default to light-theme for public pages

  useEffect(() => {
    setIsMounted(true);
    // Logic to determine theme based on path
    const isAdminPage = pathname?.startsWith('/admin');
    setCurrentTheme(isAdminPage ? 'dark' : 'light-theme'); // Admin uses 'dark', public uses 'light-theme'
  }, [pathname]);


  const safePathname = pathname || "";

  const isCurrentAdminPage = safePathname.startsWith('/admin');
  const isCurrentAuthPage = safePathname.startsWith('/auth');
  const isHomePage = safePathname === '/';

  const clientShouldShowHeaderFooter = !isCurrentAdminPage && !isCurrentAuthPage;
  const clientFooterSimplified = safePathname.startsWith('/account');
  
  let showPaddingTop = false;
  if (isMounted) {
    showPaddingTop = clientShouldShowHeaderFooter &&
                     !isHomePage &&
                     !safePathname.startsWith('/games') && 
                     safePathname !== '/statuses' &&
                     safePathname !== '/reviews';
  }

  const mainClasses = cn(
    "flex-grow flex flex-col",
    showPaddingTop ? "pt-14" : "", 
    isCurrentAdminPage ? "overflow-y-hidden" : "overflow-y-auto" 
  );

  return (
    // Apply theme class to <html> dynamically
    <html lang="ru" className={cn(isMounted ? currentTheme : 'light-theme', exo2.variable)}> 
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
      </head>
      <body
        className={cn( 
          "antialiased flex flex-col min-h-screen bg-background text-foreground font-sans" 
        )}
      >
        <AuthProvider>
          {/* <CustomCursor /> */} {/* Temporarily disable custom cursor */}
          
          {isMounted && clientShouldShowHeaderFooter && <Header />}

          <main className={mainClasses}>
            {children}
          </main>

          {isMounted && clientShouldShowHeaderFooter && <Footer simplified={clientFooterSimplified} />}
          
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
    

    