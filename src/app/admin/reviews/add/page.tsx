
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, MessageSquarePlus, User, Package, Star as StarIcon } from 'lucide-react';
import type { User as UserType, Product } from '@/types';

const reviewSchema = z.object({
  user_id: z.coerce.number().min(1, "Выберите пользователя."),
  product_id: z.string().min(1, "Выберите товар."),
  rating: z.coerce.number().min(1, "Рейтинг от 1 до 5.").max(5, "Рейтинг от 1 до 5."),
  text: z.string().min(10, "Текст отзыва должен быть не менее 10 символов.").max(2000, "Текст отзыва не должен превышать 2000 символов."),
  status: z.enum(['pending', 'approved', 'rejected']).default('approved'), // Admin created reviews are auto-approved
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export default function AddReviewPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      status: 'approved',
    },
  });

  const fetchData = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const [usersRes, productsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/products'), // Fetch all products
      ]);
      if (!usersRes.ok) throw new Error('Failed to fetch users');
      if (!productsRes.ok) throw new Error('Failed to fetch products');
      
      const usersData = await usersRes.json();
      const productsData = await productsRes.json();
      setUsers(usersData);
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching data for review form:", error);
      toast({ title: "Ошибка", description: "Не удалось загрузить пользователей или товары.", variant: "destructive" });
    } finally {
      setIsDataLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = async (data: ReviewFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Не удалось добавить отзыв.');
      toast({ title: "Отзыв добавлен", description: `Отзыв успешно создан.` });
      router.push('/admin/reviews');
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isDataLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Загрузка данных...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary flex items-center">
          <MessageSquarePlus className="mr-2 h-6 w-6" />
          Добавить новый отзыв вручную
        </h1>
        <Button onClick={() => router.push('/admin/reviews')} variant="outline" className="border-primary text-primary hover:bg-primary/10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          К списку отзывов
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="user_id" className="text-foreground flex items-center"><User className="mr-2 h-4 w-4"/>Пользователь</Label>
                <Controller
                  control={form.control}
                  name="user_id"
                  render={({ field }) => (
                    <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()} disabled={isLoading || users.length === 0}>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Выберите пользователя" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => <SelectItem key={user.id} value={user.id.toString()}>{user.username} (ID: {user.id})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.user_id && <p className="text-sm text-destructive mt-1">{form.formState.errors.user_id.message}</p>}
              </div>
              <div>
                <Label htmlFor="product_id" className="text-foreground flex items-center"><Package className="mr-2 h-4 w-4"/>Товар</Label>
                 <Controller
                  control={form.control}
                  name="product_id"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || products.length === 0}>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Выберите товар" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {products.map(product => <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.product_id && <p className="text-sm text-destructive mt-1">{form.formState.errors.product_id.message}</p>}
              </div>
            </div>
            <div>
                <Label htmlFor="rating" className="text-foreground flex items-center"><StarIcon className="mr-2 h-4 w-4"/>Рейтинг (1-5)</Label>
                <Input id="rating" type="number" min="1" max="5" {...form.register("rating")} placeholder="5" className="mt-1" disabled={isLoading} />
                {form.formState.errors.rating && <p className="text-sm text-destructive mt-1">{form.formState.errors.rating.message}</p>}
            </div>
            <div>
              <Label htmlFor="text" className="text-foreground">Текст отзыва</Label>
              <Textarea id="text" {...form.register("text")} placeholder="Отличный товар, всем рекомендую!" className="mt-1 min-h-[100px]" disabled={isLoading} />
              {form.formState.errors.text && <p className="text-sm text-destructive mt-1">{form.formState.errors.text.message}</p>}
            </div>
            
            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isDataLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Добавить отзыв
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
