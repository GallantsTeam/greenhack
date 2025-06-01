
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Palette, Tag, ImageIcon as ImageIconLucide, FileTextIcon, Settings2, CreditCardIcon, CogIcon, ListChecksIcon, Trash2, PlusCircle, EditIcon as EditProductIcon, X, VenetianMask, Eye, Sparkles, EyeOff, KeyRound, Download, MessageSquare } from 'lucide-react';
import type { Product, Category, ProductPricingOption } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';


const pricingOptionSchema = z.object({
  id: z.number().optional(),
  duration_days: z.coerce.number().min(1, "Длительность должна быть не менее 1 дня."),
  price_rub: z.coerce.number().min(0, "Цена RUB не может быть отрицательной."),
  price_gh: z.coerce.number().min(0, "Цена GH не может быть отрицательной."),
  is_rub_payment_visible: z.boolean().optional().default(true),
  is_gh_payment_visible: z.boolean().optional().default(true),
  custom_payment_1_label: z.string().max(100).optional().nullable(),
  custom_payment_1_price_rub: z.coerce.number().min(0).optional().nullable(),
  custom_payment_1_link: z.string().url({ message: "Неверный URL для пользовательского способа 1."}).optional().or(z.literal('')).nullable(),
  custom_payment_1_is_visible: z.boolean().optional().default(false),
  custom_payment_2_label: z.string().max(100).optional().nullable(),
  custom_payment_2_price_rub: z.coerce.number().min(0).optional().nullable(),
  custom_payment_2_link: z.string().url({ message: "Неверный URL для пользовательского способа 2."}).optional().or(z.literal('')).nullable(),
  custom_payment_2_is_visible: z.boolean().optional().default(false),
  mode_label: z.string().optional().nullable(),
});

const productEditSchema = z.object({
  name: z.string().min(1, "Название обязательно."),
  slug: z.string().min(1, "Slug обязателен.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug может содержать только строчные буквы, цифры и дефисы."),
  game_slug: z.string().min(1, "Категория (игра) обязательна."),
  status: z.enum(['safe', 'updating', 'risky', 'unknown'], { required_error: "Статус обязателен." }),
  status_text: z.string().optional().nullable(),
  price_text: z.string().optional().nullable(),
  short_description: z.string().optional().nullable(),
  long_description: z.string().optional().nullable(),
  image_url: z.string().url({ message: "Неверный URL изображения." }).optional().or(z.literal('')).nullable(),
  data_ai_hint: z.string().optional().nullable(),
  mode: z.enum(['PVE', 'PVP', 'BOTH']).nullable().optional(),
  gallery_image_urls: z.string().optional().nullable(),
  
  functions_aim_title: z.string().optional().nullable(),
  functions_aim: z.string().optional().nullable(),
  functions_aim_description: z.string().optional().nullable(),

  functions_esp_title: z.string().optional().nullable(),
  functions_wallhack: z.string().optional().nullable(),
  functions_esp_description: z.string().optional().nullable(),

  functions_misc_title: z.string().optional().nullable(),
  functions_misc: z.string().optional().nullable(),
  functions_misc_description: z.string().optional().nullable(),

  system_os: z.string().optional().nullable(),
  system_build: z.string().optional().nullable(),
  system_gpu: z.string().optional().nullable(),
  system_cpu: z.string().optional().nullable(),

  retrieval_modal_intro_text: z.string().optional().nullable(),
  retrieval_modal_antivirus_text: z.string().optional().nullable(),
  retrieval_modal_antivirus_link_text: z.string().max(255).optional().nullable(),
  retrieval_modal_antivirus_link_url: z.string().url({ message: "Неверный URL" }).optional().or(z.literal('')).nullable(),
  retrieval_modal_launcher_text: z.string().optional().nullable(),
  retrieval_modal_launcher_link_text: z.string().max(255).optional().nullable(),
  retrieval_modal_launcher_link_url: z.string().url({ message: "Неверный URL" }).optional().or(z.literal('')).nullable(),
  retrieval_modal_key_paste_text: z.string().optional().nullable(),
  retrieval_modal_support_text: z.string().optional().nullable(),
  retrieval_modal_support_link_text: z.string().max(255).optional().nullable(),
  retrieval_modal_support_link_url: z.string().url({ message: "Неверный URL" }).optional().or(z.literal('')).nullable(),
  retrieval_modal_how_to_run_link: z.string().url({ message: "Неверный URL" }).optional().or(z.literal('')).nullable(),
  
  // New fields for activation type
  activation_type: z.enum(['key_request', 'info_modal', 'direct_key']).default('info_modal'),
  loader_download_url: z.string().url({message: "Неверный URL для лоадера"}).optional().or(z.literal('')).nullable(),
  info_modal_content_html: z.string().optional().nullable(),
  info_modal_support_link_text: z.string().max(255).optional().nullable(),
  info_modal_support_link_url: z.string().url({message: "Неверный URL для ссылки поддержки в инфо-модале"}).optional().or(z.literal('')).nullable(),
  
  pricing_options: z.array(pricingOptionSchema).optional().default([]),
}).refine(data => {
    if (data.activation_type === 'key_request' && (!data.loader_download_url || data.loader_download_url.trim() === '')) {
        return false;
    }
    if (data.activation_type === 'info_modal' && (!data.info_modal_content_html || data.info_modal_content_html.trim() === '')) {
         return false;
    }
    return true;
}, {
    message: "Для типа 'Запрос ключа' нужен URL лоадера. Для 'Инфо-окно' нужен HTML контент.",
    path: ["activation_type"],
});


type ProductEditFormValues = z.infer<typeof productEditSchema>;
const NULL_VALUE_STRING = "__NULL_VALUE__";

export default function EditProductPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const productSlugFromUrl = params.slug as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isProductLoading, setIsProductLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [productData, setProductData] = useState<Product | null>(null);

  const [currentAimFunction, setCurrentAimFunction] = useState('');
  const [aimFunctions, setAimFunctions] = useState<string[]>([]);
  const [currentWhFunction, setCurrentWhFunction] = useState('');
  const [whFunctions, setWhFunctions] = useState<string[]>([]);
  const [currentMiscFunction, setCurrentMiscFunction] = useState('');
  const [miscFunctions, setMiscFunctions] = useState<string[]>([]);

  const form = useForm<ProductEditFormValues>({
    resolver: zodResolver(productEditSchema),
    defaultValues: {
      name: '',
      slug: productSlugFromUrl,
      game_slug: '',
      status: 'unknown',
      pricing_options: [],
      functions_aim_title: 'Aimbot Функции',
      functions_aim_description: '',
      functions_esp_title: 'ESP/Wallhack Функции',
      functions_esp_description: '',
      functions_misc_title: 'Прочие Функции (Misc)',
      functions_misc_description: '',
      mode: null,
      activation_type: 'info_modal',
    },
  });

  const { fields: pricingFields, append: appendPricingOption, remove: removePricingOption, replace: replacePricingOptions } = useFieldArray({
    control: form.control,
    name: "pricing_options",
  });
  const watchedActivationType = form.watch("activation_type");

  const fetchCategories = useCallback(async () => {
    setIsCategoriesLoading(true);
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({ title: "Ошибка", description: "Не удалось загрузить категории.", variant: "destructive" });
    } finally {
      setIsCategoriesLoading(false);
    }
  }, [toast]);

  const fetchProductData = useCallback(async (slug: string) => {
    setIsProductLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${slug}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch product' }));
        throw new Error(errorData.message || 'Failed to fetch product');
      }
      const data: Product = await response.json();
      setProductData(data);

      const parseFunctions = (funcData: string[] | string | null | undefined): string[] => {
        if (Array.isArray(funcData)) return funcData.map(f => f.trim()).filter(f => f);
        if (typeof funcData === 'string') return funcData.split(',').map(f => f.trim()).filter(f => f);
        return [];
      };
      
      setAimFunctions(parseFunctions(data.functions_aim));
      setWhFunctions(parseFunctions(data.functions_wallhack));
      setMiscFunctions(parseFunctions(data.functions_misc));

      form.reset({
        name: data.name,
        slug: data.slug,
        game_slug: data.game_slug,
        status: data.status,
        status_text: data.status_text || '',
        price_text: data.price_text || '',
        short_description: data.short_description || '',
        long_description: data.long_description || '',
        image_url: data.image_url || '',
        data_ai_hint: data.data_ai_hint || '',
        mode: data.mode || null,
        gallery_image_urls: Array.isArray(data.gallery_image_urls) ? data.gallery_image_urls.join(',') : (data.gallery_image_urls || ''),
        
        functions_aim_title: data.functions_aim_title || 'Aimbot Функции',
        functions_aim: Array.isArray(data.functions_aim) ? data.functions_aim.join(',') : (data.functions_aim || ''),
        functions_aim_description: data.functions_aim_description || '',

        functions_esp_title: data.functions_esp_title || 'ESP/Wallhack Функции',
        functions_wallhack: Array.isArray(data.functions_wallhack) ? data.functions_wallhack.join(',') : (data.functions_wallhack || ''),
        functions_esp_description: data.functions_esp_description || '',

        functions_misc_title: data.functions_misc_title || 'Прочие Функции (Misc)',
        functions_misc: Array.isArray(data.functions_misc) ? data.functions_misc.join(',') : (data.functions_misc || ''),
        functions_misc_description: data.functions_misc_description || '',

        system_os: data.system_os || '',
        system_build: data.system_build || '',
        system_gpu: data.system_gpu || '',
        system_cpu: data.system_cpu || '',

        retrieval_modal_intro_text: data.retrieval_modal_intro_text || '',
        retrieval_modal_antivirus_text: data.retrieval_modal_antivirus_text || '',
        retrieval_modal_antivirus_link_text: data.retrieval_modal_antivirus_link_text || '',
        retrieval_modal_antivirus_link_url: data.retrieval_modal_antivirus_link_url || '',
        retrieval_modal_launcher_text: data.retrieval_modal_launcher_text || '',
        retrieval_modal_launcher_link_text: data.retrieval_modal_launcher_link_text || '',
        retrieval_modal_launcher_link_url: data.retrieval_modal_launcher_link_url || '',
        retrieval_modal_key_paste_text: data.retrieval_modal_key_paste_text || '',
        retrieval_modal_support_text: data.retrieval_modal_support_text || '',
        retrieval_modal_support_link_text: data.retrieval_modal_support_link_text || '',
        retrieval_modal_support_link_url: data.retrieval_modal_support_link_url || '',
        retrieval_modal_how_to_run_link: data.retrieval_modal_how_to_run_link || '',
        
        activation_type: data.activation_type || 'info_modal',
        loader_download_url: data.loader_download_url || '',
        info_modal_content_html: data.info_modal_content_html || '',
        info_modal_support_link_text: data.info_modal_support_link_text || 'Поддержка',
        info_modal_support_link_url: data.info_modal_support_link_url || '',

        pricing_options: data.pricing_options?.map(opt => ({
            ...opt, 
            is_rub_payment_visible: opt.is_rub_payment_visible === undefined ? true : opt.is_rub_payment_visible,
            is_gh_payment_visible: opt.is_gh_payment_visible === undefined ? true : opt.is_gh_payment_visible,
            custom_payment_1_label: opt.custom_payment_1_label || '',
            custom_payment_1_price_rub: opt.custom_payment_1_price_rub || 0,
            custom_payment_1_link: opt.custom_payment_1_link || '',
            custom_payment_1_is_visible: opt.custom_payment_1_is_visible === undefined ? false : opt.custom_payment_1_is_visible,
            custom_payment_2_label: opt.custom_payment_2_label || '',
            custom_payment_2_price_rub: opt.custom_payment_2_price_rub || 0,
            custom_payment_2_link: opt.custom_payment_2_link || '',
            custom_payment_2_is_visible: opt.custom_payment_2_is_visible === undefined ? false : opt.custom_payment_2_is_visible,
            mode_label: opt.mode_label || ''
        })) || [],
      });
      if(data.pricing_options) {
        replacePricingOptions(data.pricing_options.map(opt => ({
            ...opt, 
            is_rub_payment_visible: opt.is_rub_payment_visible === undefined ? true : opt.is_rub_payment_visible,
            is_gh_payment_visible: opt.is_gh_payment_visible === undefined ? true : opt.is_gh_payment_visible,
            custom_payment_1_label: opt.custom_payment_1_label || '',
            custom_payment_1_price_rub: opt.custom_payment_1_price_rub || 0,
            custom_payment_1_link: opt.custom_payment_1_link || '',
            custom_payment_1_is_visible: opt.custom_payment_1_is_visible === undefined ? false : opt.custom_payment_1_is_visible,
            custom_payment_2_label: opt.custom_payment_2_label || '',
            custom_payment_2_price_rub: opt.custom_payment_2_price_rub || 0,
            custom_payment_2_link: opt.custom_payment_2_link || '',
            custom_payment_2_is_visible: opt.custom_payment_2_is_visible === undefined ? false : opt.custom_payment_2_is_visible,
            mode_label: opt.mode_label || ''
        })));
      }

    } catch (error: any) {
      console.error("Error fetching product data:", error);
      toast({ title: "Ошибка", description: `Не удалось загрузить данные товара: ${error.message}`, variant: "destructive" });
      router.push('/admin/products');
    } finally {
      setIsProductLoading(false);
    }
  }, [toast, form, router, replacePricingOptions]);

  useEffect(() => {
    fetchCategories();
    if (productSlugFromUrl) {
      fetchProductData(productSlugFromUrl);
    }
  }, [fetchCategories, fetchProductData, productSlugFromUrl]);

  useEffect(() => { form.setValue('functions_aim', aimFunctions.join(',')) }, [aimFunctions, form]);
  useEffect(() => { form.setValue('functions_wallhack', whFunctions.join(',')) }, [whFunctions, form]);
  useEffect(() => { form.setValue('functions_misc', miscFunctions.join(',')) }, [miscFunctions, form]);

  const handleAddFunction = (type: 'aim' | 'wh' | 'misc') => {
    if (type === 'aim' && currentAimFunction.trim()) {
      if (!aimFunctions.includes(currentAimFunction.trim())) setAimFunctions(prev => [...prev, currentAimFunction.trim()]);
      setCurrentAimFunction('');
    } else if (type === 'wh' && currentWhFunction.trim()) {
      if (!whFunctions.includes(currentWhFunction.trim())) setWhFunctions(prev => [...prev, currentWhFunction.trim()]);
      setCurrentWhFunction('');
    } else if (type === 'misc' && currentMiscFunction.trim()) {
      if (!miscFunctions.includes(currentMiscFunction.trim())) setMiscFunctions(prev => [...prev, currentMiscFunction.trim()]);
      setCurrentMiscFunction('');
    }
  };

  const handleRemoveFunction = (type: 'aim' | 'wh' | 'misc', index: number) => {
    if (type === 'aim') setAimFunctions(prev => prev.filter((_, i) => i !== index));
    if (type === 'wh') setWhFunctions(prev => prev.filter((_, i) => i !== index));
    if (type === 'misc') setMiscFunctions(prev => prev.filter((_, i) => i !== index));
  };

  const renderFunctionInputSection = (
    functions: string[],
    currentFunction: string,
    setCurrentFunction: React.Dispatch<React.SetStateAction<string>>,
    type: 'aim' | 'wh' | 'misc',
    titleFieldName: 'functions_aim_title' | 'functions_esp_title' | 'functions_misc_title',
    descriptionFieldName: 'functions_aim_description' | 'functions_esp_description' | 'functions_misc_description'
  ) => (
    <div className="space-y-3 p-4 border border-border/30 rounded-md bg-card/50 shadow-sm">
      <div>
        <Label htmlFor={titleFieldName} className="text-foreground font-semibold">Заголовок секции</Label>
        <Input 
          id={titleFieldName} 
          {...form.register(titleFieldName)} 
          placeholder={
            titleFieldName === 'functions_aim_title' ? 'Aimbot Функции' : 
            titleFieldName === 'functions_esp_title' ? 'ESP/Wallhack Функции' : 
            'Прочие Функции (Misc)'
          } 
          className="mt-1 h-9" 
          disabled={isLoading} 
        />
      </div>
       <div>
        <Label htmlFor={descriptionFieldName} className="text-foreground">Описание секции</Label>
        <Textarea 
          id={descriptionFieldName} 
          {...form.register(descriptionFieldName)} 
          placeholder="Краткое описание этой группы функций..." 
          className="mt-1 min-h-[60px]" 
          disabled={isLoading} 
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Добавить функцию</Label>
        <div className="flex gap-2 items-center">
          <Input 
            value={currentFunction}
            onChange={(e) => setCurrentFunction(e.target.value)}
            placeholder="Новая функция"
            className="flex-grow h-9"
            disabled={isLoading}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFunction(type);}}}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => handleAddFunction(type)} disabled={isLoading || !currentFunction.trim()} className="h-9 border-primary text-primary hover:bg-primary/10">
            Добавить
          </Button>
        </div>
      </div>
      {functions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 p-2 border border-input rounded-md min-h-[40px] bg-background">
          {functions.map((func, index) => (
            <Badge key={`${type}-${index}-${func}`} variant="outline" className="text-sm py-1 px-2 flex items-center border-primary/50 text-foreground">
              {func}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-1.5 h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemoveFunction(type, index)}
                disabled={isLoading}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );

  const onSubmit = async (formData: ProductEditFormValues) => {
    if (!productData || !productSlugFromUrl) return;
    setIsLoading(true);
    
    const payload = {
        ...formData,
        mode: formData.mode === NULL_VALUE_STRING ? null : formData.mode,
        functions_aim: aimFunctions.join(','),
        functions_wallhack: whFunctions.join(','),
        functions_misc: miscFunctions.join(','),
        gallery_image_urls: formData.gallery_image_urls ? formData.gallery_image_urls.split(',').map(url => url.trim()).filter(url => url) : [],
        pricing_options: formData.pricing_options?.map(opt => ({
            ...opt,
            custom_payment_1_price_rub: opt.custom_payment_1_price_rub || null,
            custom_payment_2_price_rub: opt.custom_payment_2_price_rub || null,
        }))
    };

    try {
      const response = await fetch(`/api/admin/products/${productSlugFromUrl}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Не удалось обновить товар.');
      }
      toast({
        title: "Товар обновлен",
        description: `Товар "${formData.name}" был успешно обновлен.`,
      });
      router.push('/admin/products');
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Произошла ошибка при обновлении товара.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isProductLoading || isCategoriesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Загрузка данных товара...</p>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Не удалось загрузить товар для редактирования.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary flex items-center">
          <EditProductIcon className="mr-2 h-6 w-6" />
          Редактировать товар: {form.getValues("name")}
        </h1>
        <Button onClick={() => router.push('/admin/products')} variant="outline" className="border-primary text-primary hover:bg-primary/10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          К списку товаров
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)}>
             <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-7 mb-6"> {/* Adjusted for new tab */}
                <TabsTrigger value="general"><ListChecksIcon className="mr-1.5 h-4 w-4"/>Общие</TabsTrigger>
                <TabsTrigger value="gallery"><ImageIconLucide className="mr-1.5 h-4 w-4"/>Галерея</TabsTrigger>
                <TabsTrigger value="description"><FileTextIcon className="mr-1.5 h-4 w-4"/>Описание</TabsTrigger>
                <TabsTrigger value="features"><Palette className="mr-1.5 h-4 w-4"/>Функции</TabsTrigger>
                <TabsTrigger value="os"><CogIcon className="mr-1.5 h-4 w-4"/>ОС</TabsTrigger>
                <TabsTrigger value="activation"><KeyRound className="mr-1.5 h-4 w-4"/>Активация</TabsTrigger> {/* New Tab */}
                <TabsTrigger value="pricing"><CreditCardIcon className="mr-1.5 h-4 w-4"/>Стоимость</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <CardHeader className="px-0 py-2">
                  <CardTitle className="text-xl text-foreground flex items-center">
                     <ListChecksIcon className="mr-2 h-5 w-5 text-primary"/> Основная информация
                  </CardTitle>
                </CardHeader>
                <div>
                  <Label htmlFor="edit-name" className="text-foreground">Название товара</Label>
                  <Input id="edit-name" {...form.register("name")} placeholder="UnitHack для Warface" className="mt-1" disabled={isLoading} />
                  {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-slug" className="text-foreground">Slug (URL)</Label>
                  <Input id="edit-slug" {...form.register("slug")} placeholder="unithack-warface" className="mt-1" disabled={isLoading} />
                  {form.formState.errors.slug && <p className="text-sm text-destructive mt-1">{form.formState.errors.slug.message}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-game_slug" className="text-foreground">Категория (Игра)</Label>
                  <Controller
                    control={form.control}
                    name="game_slug"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ""} disabled={isLoading || isCategoriesLoading}>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder={isCategoriesLoading ? "Загрузка категорий..." : "Выберите игру"} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.game_slug && <p className="text-sm text-destructive mt-1">{form.formState.errors.game_slug.message}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-status" className="text-foreground">Статус</Label>
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Выберите статус" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="safe">Безопасен (safe)</SelectItem>
                          <SelectItem value="updating">На обновлении (updating)</SelectItem>
                          <SelectItem value="risky">Рискованно (risky)</SelectItem>
                          <SelectItem value="unknown">Неизвестно (unknown)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.status && <p className="text-sm text-destructive mt-1">{form.formState.errors.status.message}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-status_text" className="text-foreground">Текст статуса (опционально)</Label>
                  <Input id="edit-status_text" {...form.register("status_text")} placeholder="Например, Безопасен с 01.01.2024" className="mt-1" disabled={isLoading} />
                </div>
                <div>
                  <Label htmlFor="edit-price_text" className="text-foreground">Текст цены (напр. "от 100₽")</Label>
                  <Input id="edit-price_text" {...form.register("price_text")} placeholder="от 150₽" className="mt-1" disabled={isLoading} />
                  {form.formState.errors.price_text && <p className="text-sm text-destructive mt-1">{form.formState.errors.price_text.message}</p>}
                </div>
              </TabsContent>
              <TabsContent value="gallery" className="space-y-4">
                 <CardHeader className="px-0 py-2">
                  <CardTitle className="text-xl text-foreground flex items-center">
                     <ImageIconLucide className="mr-2 h-5 w-5 text-primary"/> Медиафайлы
                  </CardTitle>
                </CardHeader>
                <div>
                  <Label htmlFor="edit-image_url" className="text-foreground">URL основного изображения</Label>
                  <Input id="edit-image_url" {...form.register("image_url")} placeholder="https://example.com/image.jpg" className="mt-1" disabled={isLoading} />
                  {form.formState.errors.image_url && <p className="text-sm text-destructive mt-1">{form.formState.errors.image_url.message}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-data_ai_hint" className="text-foreground">Подсказка для AI (для фото)</Label>
                  <Input id="edit-data_ai_hint" {...form.register("data_ai_hint")} placeholder="warface cheat icon" className="mt-1" disabled={isLoading} />
                </div>
                <div>
                  <Label htmlFor="edit-gallery_image_urls" className="text-foreground">URL изображений галереи (через запятую)</Label>
                  <Textarea id="edit-gallery_image_urls" {...form.register("gallery_image_urls")} placeholder="url1.jpg,url2.png,url3.webp" className="mt-1 min-h-[60px]" disabled={isLoading} />
                </div>
              </TabsContent>
              <TabsContent value="description" className="space-y-4">
                <CardHeader className="px-0 py-2">
                  <CardTitle className="text-xl text-foreground flex items-center">
                     <FileTextIcon className="mr-2 h-5 w-5 text-primary"/> Описание
                  </CardTitle>
                   <CardDescription className="text-muted-foreground">
                    Эти поля являются общими для товара. PVE/PVP специфичные детали можно указать в описании ниже или создать отдельные товары.
                  </CardDescription>
                </CardHeader>
                <div>
                  <Label htmlFor="edit-short_description" className="text-foreground">Краткое описание</Label>
                  <Textarea id="edit-short_description" {...form.register("short_description")} placeholder="Краткое описание товара..." className="mt-1 min-h-[60px]" disabled={isLoading} />
                  {form.formState.errors.short_description && <p className="text-sm text-destructive mt-1">{form.formState.errors.short_description.message}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-long_description" className="text-foreground">Полное описание (Поддержка HTML)</Label>
                  <Textarea id="edit-long_description" {...form.register("long_description")} placeholder="Детальное описание товара, его особенности и преимущества..." className="mt-1 min-h-[120px]" disabled={isLoading} />
                </div>
              </TabsContent>
              <TabsContent value="features" className="space-y-6">
                <CardHeader className="px-0 py-2">
                  <CardTitle className="text-xl text-foreground flex items-center">
                     <Palette className="mr-2 h-5 w-5 text-primary"/> Функционал (Общий)
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Укажите общие функции товара.
                  </CardDescription>
                </CardHeader>
                <div>
                  <Label htmlFor="edit-mode" className="text-foreground">Основной режим товара (для фильтрации)</Label>
                  <Controller
                    control={form.control}
                    name="mode"
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) => field.onChange(value === NULL_VALUE_STRING ? null : value as 'PVE' | 'PVP' | 'BOTH')}
                        value={field.value || NULL_VALUE_STRING} 
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Выберите режим" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value={NULL_VALUE_STRING}>Не указан</SelectItem>
                          <SelectItem value="PVE">PVE</SelectItem>
                          <SelectItem value="PVP">PVP</SelectItem>
                          <SelectItem value="BOTH">BOTH (Оба)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.mode && <p className="text-sm text-destructive mt-1">{form.formState.errors.mode.message}</p>}
                </div>
                {renderFunctionInputSection(aimFunctions, currentAimFunction, setCurrentAimFunction, 'aim', 'functions_aim_title', 'functions_aim_description')}
                {renderFunctionInputSection(whFunctions, currentWhFunction, setCurrentWhFunction, 'wh', 'functions_esp_title', 'functions_esp_description')}
                {renderFunctionInputSection(miscFunctions, currentMiscFunction, setCurrentMiscFunction, 'misc', 'functions_misc_title', 'functions_misc_description')}
              </TabsContent>

              <TabsContent value="os" className="space-y-4">
                <CardHeader className="px-0 py-2">
                  <CardTitle className="text-xl text-foreground flex items-center">
                     <CogIcon className="mr-2 h-5 w-5 text-primary"/> Системные требования
                  </CardTitle>
                </CardHeader>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="edit-system_os" className="text-foreground">ОС</Label>
                        <Input id="edit-system_os" {...form.register("system_os")} placeholder="Windows 10/11" className="mt-1" disabled={isLoading} />
                    </div>
                    <div>
                        <Label htmlFor="edit-system_build" className="text-foreground">Сборка Windows</Label>
                        <Input id="edit-system_build" {...form.register("system_build")} placeholder="2004 - 22H2" className="mt-1" disabled={isLoading} />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="edit-system_gpu" className="text-foreground">Видеокарта</Label>
                        <Input id="edit-system_gpu" {...form.register("system_gpu")} placeholder="Nvidia / AMD" className="mt-1" disabled={isLoading} />
                    </div>
                    <div>
                        <Label htmlFor="edit-system_cpu" className="text-foreground">Процессор</Label>
                        <Input id="edit-system_cpu" {...form.register("system_cpu")} placeholder="Intel / AMD" className="mt-1" disabled={isLoading} />
                    </div>
                </div>
              </TabsContent>

              <TabsContent value="activation" className="space-y-4">
                <CardHeader className="px-0 py-2">
                    <CardTitle className="text-xl text-foreground flex items-center">
                        <KeyRound className="mr-2 h-5 w-5 text-primary"/> Настройки активации
                    </CardTitle>
                </CardHeader>
                <div>
                    <Label htmlFor="edit-activation_type" className="text-foreground">Тип активации</Label>
                    <Controller
                        control={form.control}
                        name="activation_type"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                                <SelectTrigger className="w-full mt-1">
                                    <SelectValue placeholder="Выберите тип активации" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="info_modal">Информационное окно</SelectItem>
                                    <SelectItem value="key_request">Запрос ключа (через админа)</SelectItem>
                                    {/* <SelectItem value="direct_key" disabled>Прямой ключ (в разработке)</SelectItem> */}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {form.formState.errors.activation_type && <p className="text-sm text-destructive mt-1">{form.formState.errors.activation_type.message}</p>}
                </div>

                {watchedActivationType === 'key_request' && (
                    <div className="p-4 border border-dashed border-border/50 rounded-md space-y-3 bg-muted/20">
                        <h4 className="text-sm font-medium text-foreground flex items-center"><Download className="mr-2 h-4 w-4"/>Настройки для "Запроса ключа"</h4>
                        <div>
                            <Label htmlFor="edit-loader_download_url" className="text-foreground">URL для скачивания Loader</Label>
                            <Input id="edit-loader_download_url" {...form.register("loader_download_url")} placeholder="https://example.com/loader.exe" className="mt-1" disabled={isLoading}/>
                            {form.formState.errors.loader_download_url && <p className="text-sm text-destructive mt-1">{form.formState.errors.loader_download_url.message}</p>}
                        </div>
                        <p className="text-xs text-muted-foreground">Инструкция по активации для этого типа будет стандартной.</p>
                    </div>
                )}

                {watchedActivationType === 'info_modal' && (
                    <div className="p-4 border border-dashed border-border/50 rounded-md space-y-3 bg-muted/20">
                         <h4 className="text-sm font-medium text-foreground flex items-center"><MessageSquare className="mr-2 h-4 w-4"/>Настройки для "Информационного окна"</h4>
                        <div>
                            <Label htmlFor="edit-info_modal_content_html" className="text-foreground">HTML контент для модального окна</Label>
                            <Textarea id="edit-info_modal_content_html" {...form.register("info_modal_content_html")} placeholder="<p>Ваша инструкция или информация здесь...</p>" className="mt-1 min-h-[120px]" disabled={isLoading}/>
                            {form.formState.errors.info_modal_content_html && <p className="text-sm text-destructive mt-1">{form.formState.errors.info_modal_content_html.message}</p>}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="edit-info_modal_support_link_text" className="text-foreground">Текст кнопки поддержки</Label>
                                <Input id="edit-info_modal_support_link_text" {...form.register("info_modal_support_link_text")} placeholder="Поддержка" className="mt-1" disabled={isLoading}/>
                            </div>
                            <div>
                                <Label htmlFor="edit-info_modal_support_link_url" className="text-foreground">URL ссылки поддержки</Label>
                                <Input id="edit-info_modal_support_link_url" {...form.register("info_modal_support_link_url")} placeholder="https://t.me/support" className="mt-1" disabled={isLoading}/>
                                {form.formState.errors.info_modal_support_link_url && <p className="text-sm text-destructive mt-1">{form.formState.errors.info_modal_support_link_url.message}</p>}
                            </div>
                        </div>
                    </div>
                )}
              </TabsContent>
              
              <TabsContent value="pricing" className="space-y-4">
                 <CardHeader className="px-0 py-2">
                  <CardTitle className="text-xl text-foreground flex items-center">
                     <CreditCardIcon className="mr-2 h-5 w-5 text-primary"/> Варианты цен
                  </CardTitle>
                </CardHeader>
                {pricingFields.map((field, index) => (
                  <div key={field.id || `new-${index}`} className="space-y-3 p-4 border border-border/30 rounded-md bg-muted/20 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                      <div>
                        <Label htmlFor={`pricing_options.${index}.duration_days`} className="text-xs text-muted-foreground">Длительность (дни)</Label>
                        <Input type="number" {...form.register(`pricing_options.${index}.duration_days`)} className="mt-1 h-9" disabled={isLoading}/>
                        {form.formState.errors.pricing_options?.[index]?.duration_days && <p className="text-xs text-destructive mt-1">{form.formState.errors.pricing_options?.[index]?.duration_days?.message}</p>}
                      </div>
                       <div>
                        <Label htmlFor={`pricing_options.${index}.mode_label`} className="text-xs text-muted-foreground">Название режима (опционально)</Label>
                        <Input {...form.register(`pricing_options.${index}.mode_label`)} placeholder="PVP / BattleRoyale" className="mt-1 h-9" disabled={isLoading}/>
                         {form.formState.errors.pricing_options?.[index]?.mode_label && <p className="text-xs text-destructive mt-1">{form.formState.errors.pricing_options?.[index]?.mode_label?.message}</p>}
                      </div>
                    </div>

                    <Separator className="my-3" />
                    <p className="text-sm font-medium text-foreground/80">Стандартные способы оплаты:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                       <div>
                        <Label htmlFor={`pricing_options.${index}.price_gh`} className="text-xs text-muted-foreground">Цена (GH)</Label>
                        <Input type="number" step="0.01" {...form.register(`pricing_options.${index}.price_gh`)} className="mt-1 h-9" disabled={isLoading}/>
                        {form.formState.errors.pricing_options?.[index]?.price_gh && <p className="text-xs text-destructive mt-1">{form.formState.errors.pricing_options?.[index]?.price_gh?.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor={`pricing_options.${index}.price_rub`} className="text-xs text-muted-foreground">Цена (RUB)</Label>
                        <Input type="number" step="0.01" {...form.register(`pricing_options.${index}.price_rub`)} className="mt-1 h-9" disabled={isLoading}/>
                        {form.formState.errors.pricing_options?.[index]?.price_rub && <p className="text-xs text-destructive mt-1">{form.formState.errors.pricing_options?.[index]?.price_rub?.message}</p>}
                      </div>
                    </div>
                     <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-2">
                            <Controller control={form.control} name={`pricing_options.${index}.is_gh_payment_visible`} render={({ field: checkboxField }) => (<Checkbox id={`pricing_options.${index}.is_gh_payment_visible`} checked={checkboxField.value} onCheckedChange={checkboxField.onChange} disabled={isLoading} /> )} />
                            <Label htmlFor={`pricing_options.${index}.is_gh_payment_visible`} className="text-xs text-muted-foreground">Показывать GH</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Controller control={form.control} name={`pricing_options.${index}.is_rub_payment_visible`} render={({ field: checkboxField }) => (<Checkbox id={`pricing_options.${index}.is_rub_payment_visible`} checked={checkboxField.value} onCheckedChange={checkboxField.onChange} disabled={isLoading} /> )} />
                            <Label htmlFor={`pricing_options.${index}.is_rub_payment_visible`} className="text-xs text-muted-foreground">Показывать RUB</Label>
                        </div>
                    </div>

                    {/* Custom Payment Method 1 */}
                    <Separator className="my-3" />
                    <p className="text-sm font-medium text-foreground/80">Пользовательский способ оплаты #1:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <Label htmlFor={`pricing_options.${index}.custom_payment_1_label`} className="text-xs text-muted-foreground">Метка кнопки 1</Label>
                            <Input {...form.register(`pricing_options.${index}.custom_payment_1_label`)} placeholder="Lava.ru" className="mt-1 h-9" disabled={isLoading}/>
                        </div>
                        <div>
                            <Label htmlFor={`pricing_options.${index}.custom_payment_1_price_rub`} className="text-xs text-muted-foreground">Цена (RUB) 1</Label>
                            <Input type="number" step="0.01" {...form.register(`pricing_options.${index}.custom_payment_1_price_rub`)} className="mt-1 h-9" disabled={isLoading}/>
                        </div>
                         <div>
                            <Label htmlFor={`pricing_options.${index}.custom_payment_1_link`} className="text-xs text-muted-foreground">Ссылка 1</Label>
                            <Input type="url" {...form.register(`pricing_options.${index}.custom_payment_1_link`)} placeholder="https://..." className="mt-1 h-9" disabled={isLoading}/>
                            {form.formState.errors.pricing_options?.[index]?.custom_payment_1_link && <p className="text-xs text-destructive mt-1">{form.formState.errors.pricing_options?.[index]?.custom_payment_1_link?.message}</p>}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                        <Controller control={form.control} name={`pricing_options.${index}.custom_payment_1_is_visible`} render={({ field: checkboxField }) => (<Checkbox id={`pricing_options.${index}.custom_payment_1_is_visible`} checked={checkboxField.value} onCheckedChange={checkboxField.onChange} disabled={isLoading} /> )} />
                        <Label htmlFor={`pricing_options.${index}.custom_payment_1_is_visible`} className="text-xs text-muted-foreground">Показывать способ #1</Label>
                    </div>

                    {/* Custom Payment Method 2 */}
                    <Separator className="my-3" />
                    <p className="text-sm font-medium text-foreground/80">Пользовательский способ оплаты #2:</p>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <Label htmlFor={`pricing_options.${index}.custom_payment_2_label`} className="text-xs text-muted-foreground">Метка кнопки 2</Label>
                            <Input {...form.register(`pricing_options.${index}.custom_payment_2_label`)} placeholder="Crypto" className="mt-1 h-9" disabled={isLoading}/>
                        </div>
                        <div>
                            <Label htmlFor={`pricing_options.${index}.custom_payment_2_price_rub`} className="text-xs text-muted-foreground">Цена (RUB) 2</Label>
                            <Input type="number" step="0.01" {...form.register(`pricing_options.${index}.custom_payment_2_price_rub`)} className="mt-1 h-9" disabled={isLoading}/>
                        </div>
                         <div>
                            <Label htmlFor={`pricing_options.${index}.custom_payment_2_link`} className="text-xs text-muted-foreground">Ссылка 2</Label>
                            <Input type="url" {...form.register(`pricing_options.${index}.custom_payment_2_link`)} placeholder="https://..." className="mt-1 h-9" disabled={isLoading}/>
                             {form.formState.errors.pricing_options?.[index]?.custom_payment_2_link && <p className="text-xs text-destructive mt-1">{form.formState.errors.pricing_options?.[index]?.custom_payment_2_link?.message}</p>}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                        <Controller control={form.control} name={`pricing_options.${index}.custom_payment_2_is_visible`} render={({ field: checkboxField }) => (<Checkbox id={`pricing_options.${index}.custom_payment_2_is_visible`} checked={checkboxField.value} onCheckedChange={checkboxField.onChange} disabled={isLoading} /> )} />
                        <Label htmlFor={`pricing_options.${index}.custom_payment_2_is_visible`} className="text-xs text-muted-foreground">Показывать способ #2</Label>
                    </div>
                    
                    <div className="flex justify-end mt-3">
                         <Button type="button" variant="ghost" size="icon" onClick={() => removePricingOption(index)} className="text-destructive hover:bg-destructive/10 h-9 w-9" disabled={isLoading || pricingFields.length <= 1}>
                            <Trash2 className="h-4 w-4" />
                         </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendPricingOption({ duration_days: 1, price_rub: 0, price_gh: 0, is_rub_payment_visible: true, is_gh_payment_visible: true, custom_payment_1_label: '', custom_payment_1_price_rub: 0, custom_payment_1_link: '', custom_payment_1_is_visible: false, custom_payment_2_label: '', custom_payment_2_price_rub: 0, custom_payment_2_link: '', custom_payment_2_is_visible: false, mode_label: '' })}
                  disabled={isLoading}
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  <PlusCircle className="mr-2 h-4 w-4"/> Добавить вариант цены
                </Button>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end pt-8">
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isCategoriesLoading || isProductLoading}>
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

// Ensure there's a newline at the very end of the file content.

