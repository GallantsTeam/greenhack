
import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cn(
        "relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden bg-background",
        "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black" // Dark radial background
      )}>
      <div className="absolute inset-0 z-0 opacity-20"> 
        {/* Optional: Add a subtle pattern or noise texture here if needed */}
        {/* Example with a very subtle noise SVG, or a blurred image */}
      </div>
      <div className="relative z-10 w-full max-w-md"> 
        {children}
      </div>
    </div>
  );
}

