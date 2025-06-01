
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, PercentSquare, CalendarIcon, EditIcon } from 'lucide-react';
import type { Product, ProductPricingOptionWithProductInfo, PromoCode } from '@/types'; 
import { format } from 'date-fns';

const promoCodeEditSchema = z.object({
  // code: z.string().min(3, "Код должен быть не менее 3 символов.").max(50, "Код не должен превышать 50 символов.").regex(/^[A-Z0-9_-]+$/, "Код может содержать только заглавные латинские буквы, цифры, дефис и подчеркивание."), // Code is usually not editable
  type: z.enum(['balance_gh', 'product'], { required_error: "Тип промокода обязателен." }),
  value_gh: z.coerce.number().min(0.01, "Сумма GH должна быть больше 0.").optional().nullable(),
  related_product_id: z.string().optional().nullable(),
  product_pricing_option_id: z.coerce.number().optional().nullable(),
  max_uses: z.coerce.number().min(1, "Максимальное количество использований должно быть не менее 1."),
  expires_at: z.string().optional().nullable(), // Handled as string from datetime-local
  is_active: z.boolean().default(true),
}).refine(data => {
  if (data.type === 'balance_gh' && (data.value_gh === null || data.value_gh === undefined || data.value_gh <= 0)) {
    return false;
  }
  if (data.type === 'product' && (!data.related_product_id || data.product_pricing_option_id === null || data.product_pricing_option_id === undefined)) {
    return false;
  }
  return true;
}, {
  message: "Для типа 'Баланс GH' нужна сумма > 0. Для 'Товар' нужны ID продукта и ID варианта цены.",
  path: ["type"], 
});

type PromoCodeEditFormValues = z.infer<typeof promoCodeEditSchema>;

export default function EditPromoCodePage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const promoCodeId = params.promoCodeId as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [pricingOptions, setPricingOptions] = useState<ProductPricingOptionWithProductInfo[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isPricingOptionsLoading, setIsPricingOptionsLoading] = useState(false);
  const [initialCodeValue, setInitialCodeValue] = useState('');

  const form = useForm<PromoCodeEditFormValues>({
    resolver: zodResolver(promoCodeEditSchema),
    defaultValues: {
      type: 'balance_gh',
      max_uses: 1,
      is_active: true,
    },
  });

  const selectedPromoType = form.watch("type");
  const selectedProductId = form.watch("related_product_id");

  const fetchPromoCodeData = useCallback(async (id: string) => {
    setIsDataLoading(true);
    try {
      const response = await fetch(`/api/admin/promocodes/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({message: 'Failed to fetch promo code data'}));
        throw new Error(errorData.message);
      }
      const data: PromoCode = await response.json();
      
      let formattedExpiresAt: string | undefined = undefined;
      if (data.expires_at) {
        try {
          formattedExpiresAt = format(new Date(data.expires_at), "yyyy-MM-dd'T'HH:mm");
        } catch (e) { console.warn("Error formatting expires_at from DB:", data.expires_at, e); }
      }

      setInitialCodeValue(data.code);
      form.reset({
        type: data.type,
        value_gh: data.value_gh ?? null,
        related_product_id: data.related_product_id ?? null,
        product_pricing_option_id: data.product_pricing_option_id ?? null,
        max_uses: data.max_uses,
        expires_at: formattedExpiresAt || null,
        is_active: data.is_active,
      });
      
      // If it's a product type and product_id is set, fetch its pricing options
      if (data.type === 'product' && data.related_product_id) {
        await fetchPricingOptions(data.related_product_id, data.product_pricing_option_id || undefined);
      }

    } catch (error: any) {
      toast({ title: "Ошибка", description: `Не удалось загрузить данные промокода: ${error.message}`, variant: "destructive" });
      router.push('/admin/promocodes');
    } finally {
      setIsDataLoading(false);
    }
  }, [toast, form, router]);


  const fetchProducts = useCallback(async () => {
    setIsProductsLoading(true);
    try {
      const response = await fetch('/api/admin/products'); 
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить список товаров.", variant: "destructive" });
    } finally {
      setIsProductsLoading(false);
    }
  }, [toast]);

  const fetchPricingOptions = useCallback(async (productId: string, currentOptionId?: number) => {
    if (!productId) {
      setPricingOptions([]);
      return;
    }
    setIsPricingOptionsLoading(true);
    try {
      const productDetail = await fetch(`/api/products/${productId}`); 
      if (!productDetail.ok) throw new Error('Failed to fetch product pricing options.');
      const productData: Product = await productDetail.json();
      
      const optionsWithProductName: ProductPricingOptionWithProductInfo[] = (productData.pricing_options || []).map(opt => ({
          ...opt,
          product_name: productData.name 
      }));
      setPricingOptions(optionsWithProductName);
      if (currentOptionId) {
        form.setValue('product_pricing_option_id', currentOptionId, { shouldValidate: true });
      } else if (optionsWithProductName.length > 0 && !form.getValues('product_pricing_option_id')) {
         form.setValue('product_pricing_option_id', optionsWithProductName[0].id, { shouldValidate: true });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить варианты цен для продукта.", variant: "destructive" });
      setPricingOptions([]);
    } finally {
      setIsPricingOptionsLoading(false);
    }
  }, [toast, form]);

  useEffect(() => {
    fetchProducts();
    if (promoCodeId) {
      fetchPromoCodeData(promoCodeId);
    }
  }, [fetchProducts, fetchPromoCodeData, promoCodeId]);

  useEffect(() => {
    if (selectedPromoType === 'product' && selectedProductId) {
      // Do not reset product_pricing_option_id here if it's already set from fetched data
      if (!form.getValues('product_pricing_option_id') || !pricingOptions.find(opt => opt.id === form.getValues('product_pricing_option_id'))) {
        fetchPricingOptions(selectedProductId);
      }
    } else if (selectedPromoType !== 'product') {
      setPricingOptions([]);
      form.setValue('product_pricing_option_id', undefined);
    }
  }, [selectedPromoType, selectedProductId, fetchPricingOptions, form, pricingOptions]);


  const onSubmit = async (data: PromoCodeEditFormValues) => {
    if (!promoCodeId) return;
    setIsLoading(true);
    
    let dbExpiresAt: string | null = null;
    if (data.expires_at) {
        try {
            dbExpiresAt = new Date(data.expires_at).toISOString().slice(0, 19).replace('T', ' ');
        } catch (e) {
            toast({ title: "Ошибка даты", description: "Неверный формат даты истечения.", variant: "destructive"});
            setIsLoading(false);
            return;
        }
    }

    const payload = {
        ...data,
        expires_at: dbExpiresAt,
        value_gh: data.type === 'balance_gh' ? data.value_gh : null,
        related_product_id: data.type === 'product' ? data.related_product_id : null,
        product_pricing_option_id: data.type === 'product' ? data.product_pricing_option_id : null,
    };
    
    try {
      const response = await fetch(`/api/admin/promocodes/${promoCodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to update promo code');
      toast({ title: "Успех!", description: `Промокод "${initialCodeValue}" обновлен.` });
      router.push('/admin/promocodes');
    } catch (error: any) {
      toast({ title: "Ошибка обновления", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Загрузка данных промокода...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary flex items-center">
          <EditIcon className="mr-2 h-6 w-6" />
          Редактировать промокод: <span className="font-mono ml-2 bg-muted/80 px-2 py-0.5 rounded">{initialCodeValue}</span>
        </h1>
        <Button onClick={() => router.push('/admin/promocodes')} variant="outline" className="border-primary text-primary hover:bg-primary/10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          К списку промокодов
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="code" className="text-foreground">Код промокода (нередактируемый)</Label>
              <Input id="code" value={initialCodeValue} className="mt-1 bg-muted" disabled />
            </div>

            <div>
              <Label htmlFor="type" className="text-foreground">Тип промокода</Label>
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select 
                    onValueChange={(value) => {
                        field.onChange(value);
                        if (value === 'balance_gh') {
                            form.setValue('related_product_id', null);
                            form.setValue('product_pricing_option_id', null);
                        } else {
                            form.setValue('value_gh', null);
                        }
                    }} 
                    value={field.value} // Changed defaultValue to value
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balance_gh">Пополнение баланса GH</SelectItem>
                      <SelectItem value="product">Выдача товара</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.type && <p className="text-sm text-destructive mt-1">{form.formState.errors.type.message}</p>}
            </div>

            {selectedPromoType === 'balance_gh' && (
              <div>
                <Label htmlFor="value_gh" className="text-foreground">Сумма пополнения (GH)</Label>
                <Input id="value_gh" type="number" step="0.01" {...form.register("value_gh")} placeholder="100.00" className="mt-1" disabled={isLoading}/>
                {form.formState.errors.value_gh && <p className="text-sm text-destructive mt-1">{form.formState.errors.value_gh.message}</p>}
              </div>
            )}

            {selectedPromoType === 'product' && (
              <>
                <div>
                  <Label htmlFor="related_product_id" className="text-foreground">Товар</Label>
                  <Controller
                    control={form.control}
                    name="related_product_id"
                    render={({ field }) => (
                      <Select onValueChange={(value) => { field.onChange(value); form.setValue('product_pricing_option_id', undefined, {shouldValidate: true}); }} value={field.value || ""} disabled={isLoading || isProductsLoading}>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder={isProductsLoading ? "Загрузка товаров..." : "Выберите товар"} />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(product => (
                            <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                   {form.formState.errors.related_product_id && <p className="text-sm text-destructive mt-1">{form.formState.errors.related_product_id.message}</p>}
                </div>
                {selectedProductId && (
                  <div>
                    <Label htmlFor="product_pricing_option_id" className="text-foreground">Вариант товара (срок/версия)</Label>
                    <Controller
                      control={form.control}
                      name="product_pricing_option_id"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value?.toString() || ""} disabled={isLoading || isPricingOptionsLoading || pricingOptions.length === 0}>
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder={isPricingOptionsLoading ? "Загрузка опций..." : pricingOptions.length === 0 ? "Нет опций для товара" : "Выберите вариант"} />
                          </SelectTrigger>
                          <SelectContent>
                            {pricingOptions.map(option => (
                              <SelectItem key={option.id} value={option.id!.toString()}>
                                {option.duration_days} дн. - {option.price_rub}₽ / {option.price_gh}GH {option.is_pvp ? "(PVP)" : "(PVE)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                     {form.formState.errors.product_pricing_option_id && <p className="text-sm text-destructive mt-1">{form.formState.errors.product_pricing_option_id.message}</p>}
                  </div>
                )}
              </>
            )}

            <div>
              <Label htmlFor="max_uses" className="text-foreground">Максимальное количество использований</Label>
              <Input id="max_uses" type="number" {...form.register("max_uses")} className="mt-1" disabled={isLoading}/>
              {form.formState.errors.max_uses && <p className="text-sm text-destructive mt-1">{form.formState.errors.max_uses.message}</p>}
            </div>

            <div>
              <Label htmlFor="expires_at" className="text-foreground">Дата и время истечения (необязательно)</Label>
              <div className="relative">
                 <Controller
                    control={form.control}
                    name="expires_at"
                    render={({ field }) => (
                        <Input 
                            id="expires_at" 
                            type="datetime-local"
                            value={field.value ? field.value.substring(0, 16) : ''} // Ensure YYYY-MM-DDTHH:MM format for input
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
                            className="mt-1" 
                            disabled={isLoading}
                        />
                    )}
                />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              {form.formState.errors.expires_at && <p className="text-sm text-destructive mt-1">{form.formState.errors.expires_at.message}</p>}
            </div>
            
            <div className="flex items-center space-x-2">
               <Controller
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <Checkbox
                      id="is_active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  )}
                />
              <Label htmlFor="is_active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                Промокод активен
              </Label>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isProductsLoading || isDataLoading}>
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
