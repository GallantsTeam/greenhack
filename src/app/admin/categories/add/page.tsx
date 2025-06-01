
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Layers, Tag, ImageIcon as ImageIconLucide, FileText, Settings2, DollarSign, CogIcon, ListChecks, LayoutList } from 'lucide-react';

const categorySchema = z.object({
  name: z.string().min(3, "Название должно быть не менее 3 символов."),
  slug: z.string().min(3, "Slug должен быть не менее 3 символов.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug может содержать только строчные буквы, цифры и дефисы."),
  description: z.string().optional(),
  min_price: z.coerce.number().min(0, "Минимальная цена не может быть отрицательной.").optional().default(0),
  image_url: z.string().url({ message: "Неверный URL изображения." }).optional().or(z.literal('')),
  logo_url: z.string().url({ message: "Неверный URL логотипа." }).optional().or(z.literal('')),
  banner_url: z.string().url({message: "Неверный URL баннера."}).optional().or(z.literal('')),
  platform: z.string().optional(),
  tags: z.string().optional(), // Comma-separated string
  data_ai_hint: z.string().optional(),
  hero_bullet_points: z.string().optional(), // Stored as newline-separated, presented as array in types
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function AddCategoryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const watchedName = form.watch("name");
  useEffect(() => {
    if (watchedName && !form.formState.dirtyFields.slug) {
      form.setValue("slug", generateSlug(watchedName), { shouldValidate: true });
    }
  }, [watchedName, form]);

  const onSubmit = async (data: CategoryFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data), // hero_bullet_points will be sent as a single string
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Не удалось добавить категорию.');
      }
      toast({
        title: "Категория добавлена",
        description: `Категория "${data.name}" была успешно создана.`,
      });
      router.push('/admin/categories');
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Произошла ошибка при добавлении категории.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary flex items-center">
          <Layers className="mr-2 h-6 w-6" />
          Добавить новую категорию (Игру)
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
                <Label htmlFor="name" className="text-foreground">Название категории</Label>
                <Input id="name" {...form.register("name")} placeholder="Warface" className="mt-1" disabled={isLoading} />
                {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="slug" className="text-foreground">Slug (URL)</Label>
                <Input id="slug" {...form.register("slug")} placeholder="warface" className="mt-1" disabled={isLoading} />
                {form.formState.errors.slug && <p className="text-sm text-destructive mt-1">{form.formState.errors.slug.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-foreground">Описание</Label>
              <Textarea id="description" {...form.register("description")} placeholder="Краткое описание категории/игры..." className="mt-1 min-h-[80px]" disabled={isLoading} />
              {form.formState.errors.description && <p className="text-sm text-destructive mt-1">{form.formState.errors.description.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="min_price" className="text-foreground">Минимальная цена (RUB)</Label>
                    <Input id="min_price" type="number" step="0.01" {...form.register("min_price")} placeholder="100.00" className="mt-1" disabled={isLoading} />
                    {form.formState.errors.min_price && <p className="text-sm text-destructive mt-1">{form.formState.errors.min_price.message}</p>}
                </div>
                 <div>
                    <Label htmlFor="platform" className="text-foreground">Платформа</Label>
                    <Input id="platform" {...form.register("platform")} placeholder="PC, PS5, Xbox" className="mt-1" disabled={isLoading} />
                    {form.formState.errors.platform && <p className="text-sm text-destructive mt-1">{form.formState.errors.platform.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="image_url" className="text-foreground">URL изображения (для карточки)</Label>
                <Input id="image_url" {...form.register("image_url")} placeholder="https://example.com/category-image.jpg" className="mt-1" disabled={isLoading} />
                {form.formState.errors.image_url && <p className="text-sm text-destructive mt-1">{form.formState.errors.image_url.message}</p>}
              </div>
              <div>
                <Label htmlFor="logo_url" className="text-foreground">URL логотипа (иконка)</Label>
                <Input id="logo_url" {...form.register("logo_url")} placeholder="https://example.com/category-logo.png" className="mt-1" disabled={isLoading} />
                {form.formState.errors.logo_url && <p className="text-sm text-destructive mt-1">{form.formState.errors.logo_url.message}</p>}
              </div>
              <div>
                <Label htmlFor="banner_url" className="text-foreground">URL баннера (для страницы игры)</Label>
                <Input id="banner_url" {...form.register("banner_url")} placeholder="https://example.com/category-banner.jpg" className="mt-1" disabled={isLoading} />
                {form.formState.errors.banner_url && <p className="text-sm text-destructive mt-1">{form.formState.errors.banner_url.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="tags" className="text-foreground">Теги (через запятую)</Label>
              <Input id="tags" {...form.register("tags")} placeholder="Шутер, Онлайн, Командная игра" className="mt-1" disabled={isLoading} />
              {form.formState.errors.tags && <p className="text-sm text-destructive mt-1">{form.formState.errors.tags.message}</p>}
            </div>

            <div>
              <Label htmlFor="hero_bullet_points" className="text-foreground">Пункты для Hero-секции (каждый пункт с новой строки)</Label>
              <Textarea id="hero_bullet_points" {...form.register("hero_bullet_points")} placeholder="Рабочие читы\nЦены от X руб\nАктуально для 2025" className="mt-1 min-h-[80px]" disabled={isLoading} />
              {form.formState.errors.hero_bullet_points && <p className="text-sm text-destructive mt-1">{form.formState.errors.hero_bullet_points.message}</p>}
            </div>


            <div>
              <Label htmlFor="data_ai_hint" className="text-foreground">Подсказка для AI (для изображений)</Label>
              <Input id="data_ai_hint" {...form.register("data_ai_hint")} placeholder="warface game icon" className="mt-1" disabled={isLoading} />
              {form.formState.errors.data_ai_hint && <p className="text-sm text-destructive mt-1">{form.formState.errors.data_ai_hint.message}</p>}
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Добавление...' : 'Добавить категорию'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
