
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquareText, Loader2, AlertTriangle, Star, UserCircle, ChevronRight } from 'lucide-react';
import type { Review } from '@/types';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ProductReviewsDisplayProps {
  productId: string; // slug
  productName: string;
  refreshTrigger?: number; // Optional prop to trigger re-fetch
}

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
    <div className="p-4 border border-border/30 rounded-lg bg-muted/20 shadow-sm">
      <div className="flex items-start gap-3">
        <Image 
          src={review.user_avatar_url || `https://placehold.co/40x40.png?text=${review.username ? review.username[0].toUpperCase() : 'U'}`} 
          alt={review.username} 
          width={36} 
          height={36} 
          className="rounded-full" 
          data-ai-hint="user avatar"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm text-foreground">{review.username}</p>
            <StarRating rating={review.rating} />
          </div>
          <p className="text-xs text-muted-foreground">{formatDate(review.approved_at || review.created_at)}</p>
        </div>
      </div>
      <p className="text-sm text-foreground/80 mt-2 whitespace-pre-wrap">{review.text}</p>
       {review.duration_days && (
        <p className="text-xs text-muted-foreground mt-1">
          (Относится к варианту: {review.duration_days} дн.)
        </p>
      )}
    </div>
  );
};


const ProductReviewsDisplay: React.FC<ProductReviewsDisplayProps> = ({ productId, productName, refreshTrigger }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/products/${productId}/reviews`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch reviews for this product' }));
        throw new Error(errorData.message);
      }
      const data: Review[] = await response.json();
      setReviews(data);
    } catch (err: any) {
      setError(err.message || `Не удалось загрузить отзывы для ${productName}.`);
      // toast({ title: "Ошибка загрузки отзывов", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [productId, productName, toast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews, refreshTrigger]); // Re-fetch when refreshTrigger changes

  return (
    <Card className="mt-8 shadow-md border-border/30 bg-card">
      <CardHeader>
        <CardTitle className="text-lg text-primary flex items-center"><MessageSquareText className="mr-2 h-5 w-5"/> Отзывы о "{productName}"</CardTitle>
        {reviews.length > 0 && <CardDescription className="text-muted-foreground">Что говорят другие игроки.</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Загрузка отзывов...</p>
          </div>
        ) : error ? (
          <div className="text-center py-6 text-destructive">
            <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
            <p>{error}</p>
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
             {reviews.length >= 3 && ( // Show link if there are enough reviews to warrant a separate page
                <div className="text-center mt-4">
                    <Button variant="link" asChild className="text-primary hover:text-primary/80">
                        <Link href="/reviews">
                            Все отзывы <ChevronRight className="h-4 w-4 ml-1"/>
                        </Link>
                    </Button>
                </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-6">Отзывов для этого товара пока нет. Будьте первым!</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductReviewsDisplay;
