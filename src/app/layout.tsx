
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

// This wrapper component is needed to use usePathname in a Server Component context (RootLayout)
function RootLayoutClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isAdminPage = isMounted && pathname?.startsWith('/admin');
  const isAuthPage = isMounted && pathname?.startsWith('/auth');
  const isHomePage = isMounted && pathname === '/';

  const clientShouldShowHeaderFooter = !isAdminPage && !isAuthPage;
  const clientFooterSimplified = isMounted && pathname?.startsWith('/account');
  
  let showPaddingTop = false;
  if (isMounted) {
    showPaddingTop = clientShouldShowHeaderFooter &&
                     !isHomePage &&
                     !pathname?.startsWith('/games') && 
                     pathname !== '/statuses' &&
                     pathname !== '/reviews';
  }

  const mainClasses = cn(
    "flex-grow flex flex-col",
    showPaddingTop ? "pt-14" : "", 
    isAdminPage ? "overflow-y-hidden" : "overflow-y-auto" 
  );
  
  return (
    <html lang="ru" className={cn(exo2.variable, isAdminPage ? "dark" : "")}> 
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
          {/* <CustomCursor /> */} {/* Custom cursor is currently commented out globally */}
          
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


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RootLayoutClientWrapper>{children}</RootLayoutClientWrapper>;
}
    
    
    