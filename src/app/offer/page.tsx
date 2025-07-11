
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, Loader2 } from 'lucide-react';
import type { SiteSettings } from '@/types';
import Image from 'next/image'; // Import Image

export default function OfferPage() {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOfferContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/site-settings-public');
      if (!response.ok) throw new Error('Failed to fetch offer content');
      const data: Partial<SiteSettings> = await response.json();
      setContent(data.offer_page_content || '<p>Текст публичной оферты еще не опубликован.</p>');
    } catch (error) {
      console.error("Error fetching offer content:", error);
      setContent('<p>Не удалось загрузить текст публичной оферты. Пожалуйста, попробуйте позже.</p>');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOfferContent();
  }, [fetchOfferContent]);

  return (
    <div className="flex flex-col">
       <section className="relative py-12 md:py-16 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-primary/15 via-primary/5 to-background border-b border-border/20">
        <div className="container mx-auto px-4 text-center relative z-10">
           <ShieldCheck className="mx-auto h-12 w-12 text-primary mb-3" />
          <h1 className="text-3xl md:text-4xl font-bold text-primary uppercase tracking-wider [text-shadow:_1px_1px_6px_hsl(var(--primary)/0.4)]">
            Публичная оферта
          </h1>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <Card className="shadow-lg bg-card border-border/50">
          <CardContent className="p-6 md:p-8">
            {isLoading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-foreground/90"
                dangerouslySetInnerHTML={{ __html: content || '' }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
    