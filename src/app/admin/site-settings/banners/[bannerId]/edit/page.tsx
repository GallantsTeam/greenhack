
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
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, ImageIcon as ImageIconLucide, EditIcon, Tag, ListOrdered, Type, LinkIcon as LinkLucideIcon, AlignLeft } from 'lucide-react'; // Added AlignLeft
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SiteBanner, Product, Category } from '@/types';
import { Separator } from '@/components/ui/separator';

const bannerEditSchema = z.object({
  title: z.string().min(3, "Заголовок должен быть не менее 3 символов."),
  subtitle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  image_url: z.string().url({ message: "Неверный URL изображения." }),
  image_alt_text: z.string().optional().nullable(),
  button_text: z.string().optional().nullable(),
  button_link: z.string().url({ message: "Неверный URL для кнопки." }).optional().or(z.literal('')).nullable(),
  item_order: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
  hero_image_object_position: z.string().optional().nullable().default('center center'),
  hero_image_hint: z.string().optional().nullable(),
  price_text: z.string().optional().nullable(),
  game_slug: z.string().optional().nullable(),
  related_product_slug_1: z.string().optional().nullable(),
  related_product_slug_2: z.string().optional().nullable(),
  related_product_slug_3: z.string().optional().nullable(),
});

type BannerEditFormValues = z.infer<typeof bannerEditSchema>;
const NONE_VALUE = "__NONE__";

export default function EditBannerPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const bannerId = params.bannerId as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [games, setGames] = useState<Category[]>([]);
  const [isLoadingRelatedData, setIsLoadingRelatedData] = useState(true);


  const form = useForm<BannerEditFormValues>({
    resolver: zodResolver(bannerEditSchema),
    defaultValues: {
        title: '',
        image_url: '',
        item_order: 0,
        is_active: true,
        hero_image_object_position: 'center center',
        subtitle: '',
        description: '',
        image_alt_text: '',
        button_text: '',
        button_link: '',
        price_text: '',
        game_slug: null,
        related_product_slug_1: null,
        related_product_slug_2: null,
        related_product_slug_3: null,
    }
  });
  
  const fetchBannerData = useCallback(async (id: string) => {
    setIsDataLoading(true);
    try {
      const response = await fetch(`/api/admin/site-banners/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch banner data' }));
        throw new Error(errorData.message);
      }
      const data: SiteBanner = await response.json();
      form.reset({
        title: data.title,
        subtitle: data.subtitle || '',
        description: data.description || '',
        image_url: data.image_url,
        image_alt_text: data.image_alt_text || '',
        button_text: data.button_text || '',
        button_link: data.button_link || '',
        item_order: data.item_order,
        is_active: data.is_active,
        hero_image_object_position: data.hero_image_object_position || 'center center',
        hero_image_hint: data.hero_image_hint || '',
        price_text: data.price_text || '',
        game_slug: data.game_slug || null,
        related_product_slug_1: data.related_product_slug_1 || null,
        related_product_slug_2: data.related_product_slug_2 || null,
        related_product_slug_3: data.related_product_slug_3 || null,
      });
    } catch (error: any) {
      toast({ title: "Ошибка", description: `Не удалось загрузить данные баннера: ${error.message}`, variant: "destructive" });
      router.push('/admin/site-settings/banners');
    } finally {
      setIsDataLoading(false);
    }
  }, [form, router, toast]);

  useEffect(() => {
    const fetchData = async () => {
        setIsLoadingRelatedData(true);
        try {
            const [productsRes, gamesRes] = await Promise.all([
                fetch('/api/admin/products'),
                fetch('/api/categories')
            ]);
            if (!productsRes.ok) throw new Error('Failed to fetch products');
            if (!gamesRes.ok) throw new Error('Failed to fetch games/categories');
            
            const productsData = await productsRes.json();
            const gamesData = await gamesRes.json();

            setProducts(productsData);
            setGames(gamesData);

        } catch (error) {
            console.error("Error fetching related data:", error);
            toast({ title: "Ошибка", description: "Не удалось загрузить связанные данные (товары/игры).", variant: "destructive"});
        } finally {
            setIsLoadingRelatedData(false);
        }
    };
    fetchData();
    if (bannerId) {
      fetchBannerData(bannerId);
    }
  }, [bannerId, fetchBannerData, toast]);

  const onSubmit = async (data: BannerEditFormValues) => {
    if (!bannerId) return;
    setIsLoading(true);
     const payload = {
      ...data,
      game_slug: data.game_slug === NONE_VALUE ? null : data.game_slug,
      related_product_slug_1: data.related_product_slug_1 === NONE_VALUE ? null : data.related_product_slug_1,
      related_product_slug_2: data.related_product_slug_2 === NONE_VALUE ? null : data.related_product_slug_2,
      related_product_slug_3: data.related_product_slug_3 === NONE_VALUE ? null : data.related_product_slug_3,
    };
    try {
      const response = await fetch(`/api/admin/site-banners/${bannerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Не удалось обновить баннер.');
      }
      toast({
        title: "Баннер обновлен",
        description: `Баннер "${data.title}" был успешно обновлен.`,
      });
      router.push('/admin/site-settings/banners');
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Произошла ошибка при обновлении баннера.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isDataLoading || isLoadingRelatedData) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Загрузка данных баннера...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary flex items-center">
          <EditIcon className="mr-2 h-6 w-6" />
          Редактировать баннер: {form.getValues("title")}
        </h1>
        <Button onClick={() => router.push('/admin/site-settings/banners')} variant="outline" className="border-primary text-primary hover:bg-primary/10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          К списку баннеров
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="edit-banner-title" className="text-foreground">Заголовок баннера (Название игры)</Label>
                    <Input id="edit-banner-title" {...form.register("title")} placeholder="Warface" className="mt-1" disabled={isLoading} />
                    {form.formState.errors.title && <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>}
                </div>
                 <div>
                    <Label htmlFor="edit-banner-game_slug" className="text-foreground">Связанная игра (для кнопки "Подробнее")</Label>
                    <Controller
                        control={form.control}
                        name="game_slug"
                        render={({ field }) => (
                        <Select onValueChange={(value) => field.onChange(value === NONE_VALUE ? null : value)} value={field.value || NONE_VALUE} disabled={isLoading || isLoadingRelatedData}>
                            <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder={isLoadingRelatedData ? "Загрузка игр..." : "Выберите игру (опционально)"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NONE_VALUE}>Нет</SelectItem>
                                {games.map(game => (
                                    <SelectItem key={game.id} value={game.slug}>{game.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        )}
                    />
                     {form.formState.errors.game_slug && <p className="text-sm text-destructive mt-1">{form.formState.errors.game_slug.message}</p>}
                </div>
            </div>

            <div>
              <Label htmlFor="edit-banner-subtitle" className="text-foreground flex items-center"><Type className="mr-2 h-4 w-4 text-primary/80"/>Подзаголовок</Label>
              <Input id="edit-banner-subtitle" {...form.register("subtitle")} placeholder="Приватные читы для" className="mt-1" disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="edit-banner-description" className="text-foreground flex items-center"><AlignLeft className="mr-2 h-4 w-4 text-primary/80"/>Описание на баннере</Label>
              <Textarea id="edit-banner-description" {...form.register("description")} placeholder="Описание..." className="mt-1 min-h-[80px]" disabled={isLoading} />
            </div>
             <div>
                <Label htmlFor="edit-banner-price_text" className="text-foreground flex items-center"><Tag className="mr-2 h-4 w-4 text-primary/80"/>Текст цены (напр. от 100₽)</Label>
                <Input id="edit-banner-price_text" {...form.register("price_text")} placeholder="от 150₽" className="mt-1" disabled={isLoading} />
            </div>

            <Separator />
            <CardTitle className="text-lg text-foreground pt-2">Изображения</CardTitle>

            <div>
              <Label htmlFor="edit-banner-image_url" className="text-foreground flex items-center"><ImageIconLucide className="mr-2 h-4 w-4 text-primary/80"/>URL фонового изображения баннера</Label>
              <Input id="edit-banner-image_url" {...form.register("image_url")} placeholder="https://example.com/banner.jpg" className="mt-1" disabled={isLoading} />
              {form.formState.errors.image_url && <p className="text-sm text-destructive mt-1">{form.formState.errors.image_url.message}</p>}
            </div>
             <div>
                <Label htmlFor="edit-banner-image_alt_text" className="text-foreground flex items-center"><Type className="mr-2 h-4 w-4 text-primary/80"/>Alt текст для изображения</Label>
                <Input id="edit-banner-image_alt_text" {...form.register("image_alt_text")} placeholder="Баннер игры X" className="mt-1" disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="edit-banner-hero_image_object_position" className="text-foreground flex items-center"><ImageIconLucide className="mr-2 h-4 w-4 text-primary/80"/>Позиционирование фона (CSS object-position)</Label>
              <Input id="edit-banner-hero_image_object_position" {...form.register("hero_image_object_position")} placeholder="center top" className="mt-1" disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="edit-banner-hero_image_hint" className="text-foreground flex items-center"><ImageIconLucide className="mr-2 h-4 w-4 text-primary/80"/>Подсказка для AI (для фона)</Label>
              <Input id="edit-banner-hero_image_hint" {...form.register("hero_image_hint")} placeholder="game wallpaper action" className="mt-1" disabled={isLoading} />
            </div>

            <Separator />
            <CardTitle className="text-lg text-foreground pt-2">Кнопка</CardTitle>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="edit-banner-button_text" className="text-foreground flex items-center"><Type className="mr-2 h-4 w-4 text-primary/80"/>Текст на кнопке</Label>
                    <Input id="edit-banner-button_text" {...form.register("button_text")} placeholder="Подробнее" className="mt-1" disabled={isLoading} />
                </div>
                <div>
                    <Label htmlFor="edit-banner-button_link" className="text-foreground flex items-center"><LinkLucideIcon className="mr-2 h-4 w-4 text-primary/80"/>Ссылка для кнопки</Label>
                    <Input id="edit-banner-button_link" {...form.register("button_link")} placeholder="/games/game-slug" className="mt-1" disabled={isLoading} />
                    {form.formState.errors.button_link && <p className="text-sm text-destructive mt-1">{form.formState.errors.button_link.message}</p>}
                </div>
            </div>

            <Separator />
            <CardTitle className="text-lg text-foreground pt-2">Связанные товары (для отображения на баннере)</CardTitle>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(num => (
                    <div key={num}>
                        <Label htmlFor={`edit-banner-related_product_slug_${num}`} className="text-foreground">Товар {num}</Label>
                         <Controller
                            control={form.control}
                            name={`related_product_slug_${num}` as 'related_product_slug_1' | 'related_product_slug_2' | 'related_product_slug_3'}
                            render={({ field }) => (
                            <Select onValueChange={(value) => field.onChange(value === NONE_VALUE ? null : value)} value={field.value || NONE_VALUE} disabled={isLoading || isLoadingRelatedData}>
                                <SelectTrigger className="w-full mt-1">
                                <SelectValue placeholder={isLoadingRelatedData ? "Загрузка..." : "Выберите товар (опц.)"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NONE_VALUE}>Нет</SelectItem>
                                    {products.map(product => (
                                        <SelectItem key={product.id} value={product.slug}>{product.name} ({product.gameName})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            )}
                        />
                    </div>
                ))}
            </div>


            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                    <Label htmlFor="edit-banner-item_order" className="text-foreground flex items-center"><ListOrdered className="mr-2 h-4 w-4 text-primary/80"/>Порядок сортировки</Label>
                    <Input id="edit-banner-item_order" type="number" {...form.register("item_order")} defaultValue={0} className="mt-1" disabled={isLoading} />
                </div>
                <div className="flex items-center space-x-2 pt-7">
                    <Controller
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                            <Checkbox id="edit-banner-is_active" checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                        )}
                    />
                    <Label htmlFor="edit-banner-is_active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                        Баннер активен
                    </Label>
                </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isLoadingRelatedData || isDataLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Сохранить изменения
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
    
    

    