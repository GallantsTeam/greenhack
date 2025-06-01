
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Loader2, AlertTriangle, ThumbsUp, ThumbsDown, Star } from 'lucide-react';
import type { Review } from '@/types';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ReviewCard: React.FC<{ review: Review }> = ({ review }) => {
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={cn("h-4 w-4", rating >= star ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/50")} />
      ))}
    </div>
  );

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow bg-card border-border/50">
      <CardHeader className="flex flex-row items-start gap-3 p-4">
        <Image 
          src={review.user_avatar_url || `https://placehold.co/40x40.png?text=${review.username ? review.username[0].toUpperCase() : 'U'}`} 
          alt={review.username} 
          width={40} 
          height={40} 
          className="rounded-full"
          data-ai-hint="user avatar" 
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground">{review.username}</p>
            <StarRating rating={review.rating} />
          </div>
          <p className="text-xs text-muted-foreground">{formatDate(review.approved_at || review.created_at)}</p>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {review.product_name && (
          <div className="mb-2 p-2 bg-muted/50 rounded-md flex items-center gap-2 border border-border/30">
            <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
              <Image 
                src={review.product_image_url || 'https://placehold.co/80x80.png?text=P'} 
                alt={review.product_name} 
                layout="fill" 
                objectFit="cover"
                data-ai-hint="product icon"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Товар:</p>
              <Link href={`/products/${review.product_slug || review.product_id}`} className="text-sm font-medium text-primary hover:underline truncate">
                {review.product_name}
                {review.duration_days && <span className="text-xs text-muted-foreground"> ({review.duration_days} дн.)</span>}
              </Link>
            </div>
          </div>
        )}
        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{review.text}</p>
      </CardContent>
    </Card>
  );
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'positive' | 'negative'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchReviews = useCallback(async (filter?: 'positive' | 'negative') => {
    setIsLoading(true);
    setError(null);
    let url = '/api/reviews';
    if (filter) {
      url += `?filter=${filter}`;
    }
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch reviews' }));
        throw new Error(errorData.message);
      }
      const data: Review[] = await response.json();
      setReviews(data);
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить отзывы.");
      toast({ title: "Ошибка загрузки", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReviews(activeTab === 'all' ? undefined : activeTab);
  }, [activeTab, fetchReviews]);

  // The main filtering happens during the API call based on `activeTab`.
  // This `filteredReviews` can be used for client-side search/filter in the future if needed.
  // For now, it's simply the data returned from the API for the current tab.
  const filteredReviews = reviews; 

  if (isLoading && reviews.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8 text-center min-h-[calc(100vh-var(--header-height)-var(--footer-height))] flex flex-col justify-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Загрузка отзывов...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <section className="relative py-16 md:py-24 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-primary/20 via-primary/5 to-background border-b border-border/20">
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary uppercase tracking-wider mb-4 md:mb-6 [text-shadow:_1px_1px_8px_hsl(var(--primary)/0.5)]">
              Отзывы наших клиентов
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Узнайте, что говорят другие игроки о наших продуктах и сервисе.
            </p>
          </div>
        </div>
      </section>
      
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex justify-center mb-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'positive' | 'negative')} className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-3 bg-card/80 backdrop-blur-sm border border-border/30 shadow-sm rounded-lg">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-muted-foreground hover:bg-muted/50 rounded-md">Все отзывы</TabsTrigger>
              <TabsTrigger value="positive" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-muted-foreground hover:bg-muted/50 rounded-md flex items-center gap-1.5">
                <ThumbsUp className="h-4 w-4"/> Положительные
              </TabsTrigger>
              <TabsTrigger value="negative" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-muted-foreground hover:bg-muted/50 rounded-md flex items-center gap-1.5">
                <ThumbsDown className="h-4 w-4"/> Отрицательные
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading && filteredReviews.length === 0 ? ( 
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        ) : error ? (
          <div className="text-center py-10 text-destructive">
            <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
            <p className="font-semibold">Не удалось загрузить отзывы</p>
            <p className="text-sm">{error}</p>
            <Button onClick={() => fetchReviews(activeTab === 'all' ? undefined : activeTab)} variant="outline" className="mt-4">Попробовать снова</Button>
          </div>
        ) : reviews.length > 0 ? ( 
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReviews.length > 0 ? filteredReviews.map((review) => ( 
              <ReviewCard key={review.id} review={review} />
            )) : (
                 <div className="md:col-span-2 lg:col-span-3 text-center py-10">
                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg text-muted-foreground">Отзывов по вашему фильтру пока нет.</p>
                     {activeTab !== 'all' && 
                        <Button variant="link" onClick={() => setActiveTab('all')} className="text-primary mt-2">Показать все отзывы</Button>
                    }
                </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">Отзывов пока нет. Будьте первым!</p>
          </div>
        )}
      </div>
    </div>
  );
}
