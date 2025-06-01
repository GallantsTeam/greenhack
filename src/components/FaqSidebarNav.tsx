
// src/components/FaqSidebarNav.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FaqSidebarNavItem } from '@/types';
import { Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Added cn import

interface FaqSidebarNavProps {
  items: FaqSidebarNavItem[];
  isLoading: boolean;
  error: string | null;
  onItemClick: (item: FaqSidebarNavItem) => void;
  activeItemHref: string | null;
}

const FaqSidebarNav: React.FC<FaqSidebarNavProps> = ({ items, isLoading, error, onItemClick, activeItemHref }) => {

  if (isLoading) {
    return (
      <Card className="shadow-lg bg-card border-border/50">
        <CardHeader className="p-4"><CardTitle className="text-lg font-semibold text-primary text-center">Простая Навигация</CardTitle></CardHeader>
        <CardContent className="p-4 space-y-3 flex justify-center items-center min-h-[150px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg bg-card border-border/50">
        <CardHeader className="p-4"><CardTitle className="text-lg font-semibold text-destructive text-center">Ошибка</CardTitle></CardHeader>
        <CardContent className="p-4 text-center text-destructive-foreground">
          <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
          {error}
        </CardContent>
      </Card>
    );
  }
  
  if (items.length === 0) {
    return (
         <Card className="shadow-lg bg-card border-border/50">
            <CardHeader className="p-4"><CardTitle className="text-lg font-semibold text-primary text-center">Простая Навигация</CardTitle></CardHeader>
            <CardContent className="p-4 text-center text-muted-foreground">
                Разделы пока не добавлены.
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="shadow-lg bg-card border-border/50">
      <CardHeader className="p-4">
        <CardTitle className="text-lg font-semibold text-primary text-center uppercase tracking-wider">
          Простая Навигация
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {items.map((item) => (
          <button // Changed from <a> to <button> for click handling
            key={item.id}
            onClick={() => onItemClick(item)}
            className={cn(
                "block w-full rounded-lg overflow-hidden shadow-md hover:shadow-primary/30 transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary/50",
                activeItemHref === item.href ? "ring-2 ring-primary/70 scale-[1.01]" : ""
            )}
          >
            <div className="relative w-full aspect-[3/1]">
              <Image
                src={item.image_url}
                alt={item.image_alt_text || item.title}
                layout="fill"
                objectFit="cover"
                data-ai-hint={item.data_ai_hint || 'sidebar item'}
              />
              <div className={cn(
                  "absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2.5 transition-opacity duration-300",
                  activeItemHref === item.href ? "opacity-100" : "opacity-80 group-hover:opacity-95"
                )}>
                <h4 className={cn(
                    "text-white text-xs font-semibold uppercase tracking-wide leading-tight",
                    activeItemHref === item.href ? "text-primary" : ""
                )}>
                  {item.title}
                </h4>
              </div>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
};

export default FaqSidebarNav;
