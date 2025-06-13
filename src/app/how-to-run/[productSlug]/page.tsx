
// src/app/how-to-run/[productSlug]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ArrowLeft, BookOpen } from 'lucide-react';
import type { HowToRunGuide } from '@/types';
import Link from 'next/link';

export default function HowToRunGuidePage() {
  const params = useParams();
  const router = useRouter();
  const productSlug = params.productSlug as string;

  const [guide, setGuide] = useState<Pick<HowToRunGuide, 'title' | 'content' | 'product_name'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGuideContent = useCallback(async (slug: string) => {
    if (!slug) {
        setError("Не указан идентификатор товара для инструкции.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/how-to-run-guides/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError(`Инструкция для товара "${slug}" еще не создана или не найдена.`);
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Не удалось загрузить инструкцию.' }));
          throw new Error(errorData.message);
        }
        setGuide(null);
      } else {
        const data: Pick<HowToRunGuide, 'title' | 'content' | 'product_name'> = await response.json();
        setGuide(data);
      }
    } catch (err: any) {
      console.error("Error fetching how-to-run guide:", err);
      setError(err.message || 'Произошла ошибка при загрузке инструкции.');
      setGuide(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (productSlug) {
      fetchGuideContent(productSlug);
    } else {
        setError("Не указан товар для отображения инструкции.");
        setIsLoading(false);
    }
  }, [productSlug, fetchGuideContent]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height)-var(--footer-height))]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Загрузка инструкции...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <section className="relative py-12 md:py-16 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-primary/15 via-primary/5 to-background border-b border-border/20">
        <div className="container mx-auto px-4 text-center relative z-10">
          <BookOpen className="mx-auto h-12 w-12 text-primary mb-3" />
          <h1 className="text-3xl md:text-4xl font-bold text-primary uppercase tracking-wider [text-shadow:_1px_1px_6px_hsl(var(--primary)/0.4)]">
            {guide ? guide.title : (error ? 'Ошибка Загрузки' : 'Инструкция по Запуску')}
          </h1>
           {guide?.product_name && !error && (
             <p className="text-lg text-muted-foreground mt-1">для {guide.product_name}</p>
           )}
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <Button onClick={() => router.back()} variant="outline" className="mb-6 border-primary text-primary hover:bg-primary/10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>

        {error && !guide && (
            <Card className="shadow-lg bg-destructive/10 border-destructive/30">
                <CardHeader>
                    <CardTitle className="text-xl text-destructive-foreground flex items-center">
                        <AlertTriangle className="mr-2 h-6 w-6" /> Ошибка
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive-foreground/90">{error}</p>
                     <Button asChild variant="link" className="mt-4 px-0 text-primary hover:text-primary/80">
                        <Link href="/account">Вернуться в личный кабинет</Link>
                    </Button>
                </CardContent>
            </Card>
        )}

        {guide && !error && (
          <Card className="shadow-lg bg-card border-border/50">
            <CardContent className="p-6 md:p-8">
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-foreground/90"
                dangerouslySetInnerHTML={{ __html: guide.content || '<p>Содержимое инструкции отсутствует.</p>' }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
