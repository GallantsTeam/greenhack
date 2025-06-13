
// src/app/admin/editor/how-to-run-editor/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookOpen, Package, Save, Trash2, AlertTriangle, EditIcon } from 'lucide-react';
import type { HowToRunGuide, Product } from '@/types';

const guideSchema = z.object({
  product_slug: z.string().min(1, "Необходимо выбрать товар."),
  title: z.string().min(5, "Заголовок должен быть не менее 5 символов.").max(255),
  content: z.string().min(50, "Содержимое инструкции должно быть не менее 50 символов."),
});

type GuideFormValues = z.infer<typeof guideSchema>;

export default function AdminHowToRunEditorPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductSlug, setSelectedProductSlug] = useState<string>('');
  const [currentGuide, setCurrentGuide] = useState<HowToRunGuide | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingGuide, setIsLoadingGuide] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<GuideFormValues>({
    resolver: zodResolver(guideSchema),
    defaultValues: {
      product_slug: '',
      title: '',
      content: '<p>Начните писать инструкцию здесь...</p>',
    },
  });

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const response = await fetch('/api/admin/products'); 
      if (!response.ok) throw new Error('Failed to fetch products');
      const data: Product[] = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({ title: "Ошибка", description: "Не удалось загрузить список товаров.", variant: "destructive" });
    } finally {
      setIsLoadingProducts(false);
    }
  }, [toast]);

  const fetchGuide = useCallback(async (slug: string) => {
    if (!slug) {
      setCurrentGuide(null);
      form.reset({ product_slug: slug, title: '', content: '<p>Начните писать инструкцию здесь...</p>' });
      return;
    }
    setIsLoadingGuide(true);
    try {
      const response = await fetch(`/api/admin/how-to-run-guides/${slug}`);
      if (response.ok) {
        const data: HowToRunGuide = await response.json();
        setCurrentGuide(data);
        form.reset({
          product_slug: data.product_slug,
          title: data.title,
          content: data.content,
        });
      } else if (response.status === 404) {
        setCurrentGuide(null);
        const selectedProduct = products.find(p => p.slug === slug);
        form.reset({
          product_slug: slug,
          title: selectedProduct ? `Инструкция для ${selectedProduct.name}` : '',
          content: '<p>Начните писать инструкцию здесь...</p>',
        });
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch guide for this product.' }));
        throw new Error(errorData.message);
      }
    } catch (error: any) {
      console.error("Error fetching guide:", error);
      toast({ title: "Ошибка", description: `Не удалось загрузить инструкцию для ${slug}.`, variant: "destructive" });
      setCurrentGuide(null);
      const selectedProductOnFailure = products.find(p => p.slug === slug);
      form.reset({ 
        product_slug: slug, 
        title: selectedProductOnFailure ? `Инструкция для ${selectedProductOnFailure.name}` : '', 
        content: '<p>Начните писать инструкцию здесь...</p>' 
      });
    } finally {
      setIsLoadingGuide(false);
    }
  }, [form, toast, products]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (selectedProductSlug) {
      fetchGuide(selectedProductSlug);
    } else {
      setCurrentGuide(null);
      form.reset({ product_slug: '', title: '', content: '<p>Начните писать инструкцию здесь...</p>' });
    }
  }, [selectedProductSlug, fetchGuide, form]);

  const handleProductSelect = (slug: string) => {
    setSelectedProductSlug(slug);
    form.setValue('product_slug', slug, {shouldValidate: true});
  };

  const onSubmit = async (data: GuideFormValues) => {
    if (!data.product_slug) {
        toast({ title: "Ошибка", description: "Пожалуйста, выберите товар для инструкции.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/how-to-run-guides/${data.product_slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Не удалось сохранить инструкцию.');
      toast({ title: "Успех", description: "Инструкция успешно сохранена." });
      setCurrentGuide(result.guide); 
    } catch (error: any) {
      toast({ title: "Ошибка сохранения", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProductSlug || !currentGuide) {
        toast({ title: "Ошибка", description: "Нет инструкции для удаления.", variant: "destructive" });
        return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/how-to-run-guides/${selectedProductSlug}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({message: 'Failed to delete guide'}));
        throw new Error(errorData.message);
      }
      toast({ title: "Удалено", description: "Инструкция успешно удалена." });
      setCurrentGuide(null);
      const selectedProduct = products.find(p => p.slug === selectedProductSlug);
      form.reset({ 
          product_slug: selectedProductSlug, 
          title: selectedProduct ? `Инструкция для ${selectedProduct.name}` : '', 
          content: '<p>Начните писать инструкцию здесь...</p>' 
      });
    } catch (error: any) {
      toast({ title: "Ошибка удаления", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-primary flex items-center">
            <BookOpen className="mr-2 h-5 w-5" />
            Редактор Инструкций по Запуску
        </CardTitle>
        <CardDescription className="text-muted-foreground">
            Создавайте и редактируйте инструкции по запуску для ваших товаров.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="product_slug" className="text-foreground flex items-center"><Package className="mr-2 h-4 w-4 text-primary/80"/>Товар</Label>
            <Select
              value={selectedProductSlug}
              onValueChange={handleProductSelect}
              disabled={isLoadingProducts || isSaving || isDeleting}
            >
              <SelectTrigger id="product_slug" className="w-full mt-1">
                <SelectValue placeholder={isLoadingProducts ? "Загрузка товаров..." : "Выберите товар..."} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingProducts ? (
                  <div className="flex items-center justify-center p-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Загрузка...
                  </div>
                ) : products.length > 0 ? (
                  products.map(product => (
                    <SelectItem key={product.slug} value={product.slug}>
                      {product.name} ({product.gameName || 'N/A'})
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Товары не найдены.
                  </div>
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.product_slug && <p className="text-sm text-destructive mt-1">{form.formState.errors.product_slug.message}</p>}
          </div>

          {isLoadingGuide && selectedProductSlug && (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Загрузка инструкции...</p>
            </div>
          )}

          {!isLoadingGuide && selectedProductSlug && (
            <>
              <div>
                <Label htmlFor="title" className="text-foreground flex items-center"><EditIcon className="mr-2 h-4 w-4 text-primary/80"/>Заголовок инструкции</Label>
                <Input id="title" {...form.register("title")} placeholder="Как запустить [Название Товара]" className="mt-1" disabled={isSaving || isDeleting}/>
                {form.formState.errors.title && <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>}
              </div>
              <div>
                <Label htmlFor="content" className="text-foreground">HTML-контент инструкции</Label>
                 <Textarea
                  id="content"
                  {...form.register("content")}
                  placeholder="<p>Шаг 1: ...</p>"
                  className="mt-1 min-h-[300px] font-mono text-sm bg-muted/30 border-border"
                  disabled={isSaving || isDeleting}
                />
                {form.formState.errors.content && <p className="text-sm text-destructive mt-1">{form.formState.errors.content.message}</p>}
              </div>
              <div className="flex justify-between items-center pt-4">
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSaving || isDeleting || !selectedProductSlug}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                  {isSaving ? 'Сохранение...' : 'Сохранить инструкцию'}
                </Button>
                {currentGuide && (
                    <Button 
                        type="button" 
                        variant="destructive" 
                        onClick={handleDelete} 
                        disabled={isDeleting || isSaving}
                        className="bg-destructive/90 hover:bg-destructive text-destructive-foreground"
                    >
                      {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />}
                      {isDeleting ? 'Удаление...' : 'Удалить'}
                    </Button>
                )}
              </div>
            </>
          )}
           {!selectedProductSlug && !isLoadingProducts && (
               <div className="text-center py-10 text-muted-foreground">
                   <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
                   <p>Пожалуйста, выберите товар, чтобы создать или отредактировать инструкцию.</p>
               </div>
           )}
        </form>
      </CardContent>
    </Card>
  );
}
    
    
