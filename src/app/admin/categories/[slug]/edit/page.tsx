
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, EditIcon as EditCategoryIcon, Tag, ImageIcon as ImageIconLucide, FileText, Settings2, DollarSign, LayoutList } from 'lucide-react';
import type { Category } from '@/types';

const categoryEditSchema = z.object({
  name: z.string().min(3, "Название должно быть не менее 3 символов."),
  slug: z.string().min(3, "Slug должен быть не менее 3 символов.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug может содержать только строчные буквы, цифры и дефисы."),
  description: z.string().optional().nullable(),
  min_price: z.coerce.number().min(0, "Минимальная цена не может быть отрицательной.").optional().default(0),
  image_url: z.string().url({ message: "Неверный URL изображения." }).optional().or(z.literal('')).nullable(),
  logo_url: z.string().url({ message: "Неверный URL логотипа." }).optional().or(z.literal('')).nullable(),
  banner_url: z.string().url({message: "Неверный URL баннера."}).optional().or(z.literal('')).nullable(),
  platform: z.string().optional().nullable(),
  tags: z.string().optional().nullable(), 
  data_ai_hint: z.string().optional().nullable(),
  hero_bullet_points: z.string().optional().nullable(), // Stored as newline-separated, presented as array in types
});

type CategoryEditFormValues = z.infer<typeof categoryEditSchema>;

export default function EditCategoryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const categorySlug = params.slug as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [initialSlug, setInitialSlug] = useState('');

  const form = useForm<CategoryEditFormValues>({
    resolver: zodResolver(categoryEditSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      min_price: 0,
      image_url: '',
      logo_url: '',
      banner_url: '',
      platform: '',
      tags: '',
      data_ai_hint: '',
      hero_bullet_points: '',
    },
  });

  const fetchCategoryData = useCallback(async (slug: string) => {
    setIsDataLoading(true);
    try {
      const response = await fetch(`/api/admin/categories/${slug}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch category data' }));
        throw new Error(errorData.message);
      }
      const data: Category = await response.json();
      form.reset({
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        min_price: data.min_price || 0,
        image_url: data.imageUrl || '',
        logo_url: data.logoUrl || '',
        banner_url: data.banner_url || '',
        platform: data.platform || '',
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
        data_ai_hint: data.dataAiHint || '',
        hero_bullet_points: Array.isArray(data.hero_bullet_points) ? data.hero_bullet_points.join('\n') : '',
      });
      setInitialSlug(data.slug);
    } catch (error: any) {
      console.error("Error fetching category data:", error);
      toast({ title: "Ошибка", description: `Не удалось загрузить данные категории: ${error.message}`, variant: "destructive" });
      router.push('/admin/categories');
    } finally {
      setIsDataLoading(false);
    }
  }, [form, router, toast]);

  useEffect(() => {
    if (categorySlug) {
      fetchCategoryData(categorySlug);
    }
  }, [categorySlug, fetchCategoryData]);

  const onSubmit = async (data: CategoryEditFormValues) => {
    if (!categorySlug) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/categories/${initialSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Не удалось обновить категорию.');
      }
      toast({
        title: "Категория обновлена",
        description: `Категория "${data.name}" была успешно обновлена.`,
      });
      router.push('/admin/categories');
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Произошла ошибка при обновлении категории.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Загрузка данных категории...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary flex items-center">
          <EditCategoryIcon className="mr-2 h-6 w-6" />
          Редактировать категорию: {form.getValues("name")}
        </h1>
        <Button onClick={() => router.push('/admin/categories')} variant="outline" className="border-primary text-primary hover:bg-primary/10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          К списку категорий
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="edit-category-name" className="text-foreground">Название категории</Label>
                <Input id="edit-category-name" {...form.register("name")} className="mt-1" disabled={isLoading} />
                {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="edit-category-slug" className="text-foreground">Slug (URL)</Label>
                <Input id="edit-category-slug" {...form.register("slug")} className="mt-1" disabled={isLoading} />
                {form.formState.errors.slug && <p className="text-sm text-destructive mt-1">{form.formState.errors.slug.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-category-description" className="text-foreground">Описание</Label>
              <Textarea id="edit-category-description" {...form.register("description")} className="mt-1 min-h-[80px]" disabled={isLoading} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="edit-category-min_price" className="text-foreground">Минимальная цена (RUB)</Label>
                    <Input id="edit-category-min_price" type="number" step="0.01" {...form.register("min_price")} className="mt-1" disabled={isLoading} />
                </div>
                 <div>
                    <Label htmlFor="edit-category-platform" className="text-foreground">Платформа</Label>
                    <Input id="edit-category-platform" {...form.register("platform")} className="mt-1" disabled={isLoading} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="edit-category-image_url" className="text-foreground">URL изображения (для карточки)</Label>
                <Input id="edit-category-image_url" {...form.register("image_url")} className="mt-1" disabled={isLoading} />
                 {form.formState.errors.image_url && <p className="text-sm text-destructive mt-1">{form.formState.errors.image_url.message}</p>}
              </div>
              <div>
                <Label htmlFor="edit-category-logo_url" className="text-foreground">URL логотипа (иконка)</Label>
                <Input id="edit-category-logo_url" {...form.register("logo_url")} className="mt-1" disabled={isLoading} />
                {form.formState.errors.logo_url && <p className="text-sm text-destructive mt-1">{form.formState.errors.logo_url.message}</p>}
              </div>
              <div>
                <Label htmlFor="edit-category-banner_url" className="text-foreground">URL баннера (страница игры)</Label>
                <Input id="edit-category-banner_url" {...form.register("banner_url")} className="mt-1" disabled={isLoading} />
                 {form.formState.errors.banner_url && <p className="text-sm text-destructive mt-1">{form.formState.errors.banner_url.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-category-tags" className="text-foreground">Теги (через запятую)</Label>
              <Input id="edit-category-tags" {...form.register("tags")} className="mt-1" disabled={isLoading} />
            </div>

            <div>
              <Label htmlFor="edit-hero_bullet_points" className="text-foreground">Пункты для Hero-секции (каждый с новой строки)</Label>
              <Textarea id="edit-hero_bullet_points" {...form.register("hero_bullet_points")} className="mt-1 min-h-[80px]" disabled={isLoading} />
            </div>

            <div>
              <Label htmlFor="edit-category-data_ai_hint" className="text-foreground">Подсказка для AI (для изображений)</Label>
              <Input id="edit-category-data_ai_hint" {...form.register("data_ai_hint")} className="mt-1" disabled={isLoading} />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isDataLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
