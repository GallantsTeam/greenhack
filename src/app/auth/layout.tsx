
import React from 'react';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden">
      <div className="absolute inset-0 z-[-1]">
        <Image
          src="https://i.ytimg.com/vi/gvRUaKW6Uyg/maxresdefault.jpg"
          alt="Abstract background"
          layout="fill"
          objectFit="cover"
          quality={85}
          className="blur-sm scale-105" 
          data-ai-hint="abstract background"
        />
        <div className="absolute inset-0 bg-black/30 backdrop-blur-xs"></div> {/* Optional: Darken and slightly blur overlay */}
      </div>
      {/* The Card component from login/register pages will be centered here */}
      {children}
    </div>
  );
}
