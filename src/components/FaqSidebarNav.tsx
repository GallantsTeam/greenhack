
// src/components/FaqSidebarNav.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link'; // Keep Link for potential future use if href becomes a page path
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FaqSidebarNavItem } from '@/types'; // Use the new type
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FaqSidebarNav: React.FC = () => {
  const [items, setItems] = useState<FaqSidebarNavItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSidebarItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/faq-sidebar-items'); // Fetch from the new API
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Не удалось загрузить элементы боковой панели' }));
        throw new Error(errorData.message);
      }
      const data: FaqSidebarNavItem[] = await response.json();
      setItems(data.filter(item => item.is_active).sort((a, b) => (a.item_order || 0) - (b.item_order || 0)));
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Ошибка загрузки навигации FAQ", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSidebarItems();
  }, [fetchSidebarItems]);

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
          <a // Using <a> for anchor links, Link for page navigation
            key={item.id}
            href={item.href} // Direct anchor link or page path
            className="block rounded-lg overflow-hidden shadow-md hover:shadow-primary/30 transition-shadow transform hover:scale-[1.02]"
            onClick={(e) => {
              if (item.href.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(item.href);
                if (targetElement) {
                  targetElement.scrollIntoView({ behavior: 'smooth' });
                } else {
                  console.warn(`Anchor target ${item.href} not found.`);
                }
              }
              // If it's a full path, default browser navigation or Next Link (if wrapped) will handle it.
            }}
          >
            <div className="relative w-full aspect-[3/1]">
              <Image
                src={item.image_url}
                alt={item.image_alt_text || item.title}
                layout="fill"
                objectFit="cover"
                data-ai-hint={item.data_ai_hint || 'sidebar item'}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2.5">
                <h4 className="text-white text-xs font-semibold uppercase tracking-wide leading-tight">
                  {item.title}
                </h4>
              </div>
            </div>
          </a>
        ))}
      </CardContent>
    </Card>
  );
};

export default FaqSidebarNav;
