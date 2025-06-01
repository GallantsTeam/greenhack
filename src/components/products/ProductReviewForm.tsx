
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Star, Send, MessageSquare, Loader2, ShoppingCart, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const reviewFormSchema = z.object({
  rating: z.coerce.number().min(1, "Пожалуйста, выберите рейтинг.").max(5),
  text: z.string().min(10, "Отзыв должен содержать не менее 10 символов.").max(2000, "Отзыв не должен превышать 2000 символов."),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

interface ProductReviewFormProps {
  productId: string; // slug
  productName: string;
  onReviewSubmitted?: () => void;
}

const ProductReviewForm: React.FC<ProductReviewFormProps> = ({ productId, productName, onReviewSubmitted }) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasPurchasedProduct, setHasPurchasedProduct] = useState(false);
  const [isCheckingPurchase, setIsCheckingPurchase] = useState(true);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 0,
      text: '',
    },
  });
  const selectedRating = form.watch("rating");

  const checkPurchase = useCallback(async () => {
    if (!currentUser || !productId) {
      setIsCheckingPurchase(false);
      setHasPurchasedProduct(false);
      return;
    }
    setIsCheckingPurchase(true);
    try {
      const response = await fetch(`/api/user/${currentUser.id}/has-purchased/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setHasPurchasedProduct(data.hasPurchased);
      } else {
        setHasPurchasedProduct(false);
      }
    } catch (error) {
      console.error("Error checking purchase status:", error);
      setHasPurchasedProduct(false);
    } finally {
      setIsCheckingPurchase(false);
    }
  }, [currentUser, productId]);

  useEffect(() => {
    checkPurchase();
  }, [checkPurchase]);

  const onSubmit = async (data: ReviewFormValues) => {
    if (!currentUser) {
      toast({ title: "Ошибка", description: "Для оставления отзыва необходимо авторизоваться.", variant: "destructive" });
      return;
    }
    if (!hasPurchasedProduct) {
      toast({ title: "Действие не разрешено", description: `Чтобы оставить отзыв, вам необходимо приобрести подписку на "${productName}".`, variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          rating: data.rating,
          text: data.text,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Не удалось отправить отзыв.');
      }
      toast({
        title: "Отзыв отправлен!",
        description: "Спасибо! Ваш отзыв отправлен на модерацию.",
      });
      form.reset();
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Произошла ошибка при отправке отзыва.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
        <Card className="mt-8 shadow-md border-border/30 bg-card">
            <CardHeader>
                <CardTitle className="text-lg text-primary flex items-center"><MessageSquare className="mr-2 h-5 w-5"/> Оставить отзыв</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Пожалуйста, <Link href="/auth/login" className="text-primary hover:underline">войдите</Link> или <Link href="/auth/register" className="text-primary hover:underline">зарегистрируйтесь</Link>, чтобы оставить отзыв.
                </p>
            </CardContent>
        </Card>
    );
  }

  if (isCheckingPurchase) {
    return (
        <Card className="mt-8 shadow-md border-border/30 bg-card">
            <CardHeader>
                <CardTitle className="text-lg text-primary flex items-center"><MessageSquare className="mr-2 h-5 w-5"/> Оставить отзыв</CardTitle>
            </CardHeader>
            <CardContent className="py-10 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <p className="text-muted-foreground">Проверка ваших покупок...</p>
            </CardContent>
        </Card>
    );
  }

  if (!hasPurchasedProduct) {
    return (
        <Card className="mt-8 shadow-md border-border/30 bg-card">
            <CardHeader>
                <CardTitle className="text-lg text-primary flex items-center"><AlertCircle className="mr-2 h-5 w-5"/> Оставить отзыв</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Чтобы оставить отзыв, вам необходимо приобрести подписку на "{productName}".
                </p>
                <Button asChild className="mt-3 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link href={`/products/${productId}`}>
                        <ShoppingCart className="mr-2 h-4 w-4"/> К покупке
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
  }


  return (
    <Card className="mt-8 shadow-md border-border/30 bg-card">
      <CardHeader>
        <CardTitle className="text-lg text-primary flex items-center"><MessageSquare className="mr-2 h-5 w-5"/> Оставить отзыв о "{productName}"</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label className="text-foreground mb-2 block">Ваша оценка:</Label>
            <div className="flex items-center space-x-1" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-7 w-7 cursor-pointer transition-colors",
                    (hoverRating >= star || selectedRating >= star)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-muted-foreground hover:text-yellow-300"
                  )}
                  onClick={() => form.setValue("rating", star, { shouldValidate: true })}
                  onMouseEnter={() => setHoverRating(star)}
                />
              ))}
            </div>
            {form.formState.errors.rating && <p className="text-sm text-destructive mt-1">{form.formState.errors.rating.message}</p>}
          </div>
          <div>
            <Label htmlFor="reviewText" className="text-foreground">Ваш отзыв:</Label>
            <Textarea
              id="reviewText"
              {...form.register("text")}
              placeholder={`Поделитесь своим мнением о ${productName}...`}
              className="mt-1 min-h-[100px] bg-background"
              disabled={isLoading}
            />
            {form.formState.errors.text && <p className="text-sm text-destructive mt-1">{form.formState.errors.text.message}</p>}
          </div>
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4"/>}
            Отправить отзыв
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProductReviewForm;
