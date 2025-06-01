
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
import { Loader2, LayoutDashboard, Edit, Trash2, Palette, Dices, DollarSign, Headphones, ThumbsUp, Zap, ShieldCheck, ShoppingCart, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SiteSettings, HomepageAdvantage } from '@/types';
import { Separator } from '@/components/ui/separator';

const homepageAdvantageSchema = z.object({
  icon: z.string().min(1, "Иконка обязательна (Lucide имя)"),
  text: z.string().min(3, "Текст преимущества обязателен."),
});

const homepageSettingsSchema = z.object({
  homepage_popular_categories_title: z.string().optional().nullable(),
  homepage_advantages: z.array(homepageAdvantageSchema).length(4, "Должно быть ровно 4 преимущества."),
  homepage_show_case_opening_block: z.boolean().default(true),
  homepage_case_opening_title: z.string().optional().nullable(),
  homepage_case_opening_subtitle: z.string().optional().nullable(),
});

type HomepageSettingsFormValues = z.infer<typeof homepageSettingsSchema>;

const defaultAdvantages: HomepageAdvantage[] = [
  { icon: "DollarSign", text: "Доступные цены" },
  { icon: "Headphones", text: "Отзывчивая поддержка" },
  { icon: "Dices", text: "Большой выбор игр" },
  { icon: "ThumbsUp", text: "Хорошие отзывы" },
];

export default function AdminHomepageSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<HomepageSettingsFormValues>({
    resolver: zodResolver(homepageSettingsSchema),
    defaultValues: {
      homepage_popular_categories_title: 'ПОПУЛЯРНЫЕ КАТЕГОРИИ',
      homepage_advantages: defaultAdvantages,
      homepage_show_case_opening_block: true,
      homepage_case_opening_title: 'ИСПЫТАЙ УДАЧУ!',
      homepage_case_opening_subtitle: 'Откройте кейс и получите шанс выиграть ценный приз',
    },
  });

  const { fields: advantageFields, update: updateAdvantage } = useFieldArray({
    control: form.control,
    name: "homepage_advantages",
  });

  const fetchSettings = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await fetch('/api/admin/site-settings', { cache: 'no-store' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Не удалось загрузить настройки сайта.' }));
        throw new Error(errorData.message);
      }
      const data: Partial<SiteSettings> = await response.json();
      form.reset({
        homepage_popular_categories_title: data.homepage_popular_categories_title || 'ПОПУЛЯРНЫЕ КАТЕГОРИИ',
        homepage_advantages: (data.homepage_advantages && data.homepage_advantages.length === 4) ? data.homepage_advantages : defaultAdvantages,
        homepage_show_case_opening_block: data.homepage_show_case_opening_block === undefined ? true : Boolean(data.homepage_show_case_opening_block),
        homepage_case_opening_title: data.homepage_case_opening_title || 'ИСПЫТАЙ УДАЧУ!',
        homepage_case_opening_subtitle: data.homepage_case_opening_subtitle || 'Откройте кейс и получите шанс выиграть ценный приз',
      });
    } catch (error: any) {
      toast({ title: "Ошибка загрузки настроек", description: error.message, variant: "destructive" });
    } finally {
      setIsFetching(false);
    }
  }, [form, toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const onSubmit = async (data: HomepageSettingsFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data), // Send only homepage specific settings
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Не удалось сохранить настройки.');
      toast({ title: "Настройки сохранены", description: "Настройки главной страницы успешно обновлены." });
      // Optionally re-fetch settings if API returns the full object or specific fields
      if (result.settings) {
         form.reset({ // Reset with potentially updated values from the specific fields
            homepage_popular_categories_title: result.settings.homepage_popular_categories_title || 'ПОПУЛЯРНЫЕ КАТЕГОРИИ',
            homepage_advantages: (result.settings.homepage_advantages && result.settings.homepage_advantages.length === 4) ? result.settings.homepage_advantages : defaultAdvantages,
            homepage_show_case_opening_block: result.settings.homepage_show_case_opening_block === undefined ? true : Boolean(result.settings.homepage_show_case_opening_block),
            homepage_case_opening_title: result.settings.homepage_case_opening_title || 'ИСПЫТАЙ УДАЧУ!',
            homepage_case_opening_subtitle: result.settings.homepage_case_opening_subtitle || 'Откройте кейс и получите шанс выиграть ценный приз',
        });
      }
    } catch (error: any) {
      toast({ title: "Ошибка сохранения", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Загрузка настроек...</p>
      </div>
    );
  }
  
  const iconMap: { [key: string]: React.ElementType } = {
    DollarSign, Headphones, Dices, ThumbsUp, Zap, ShieldCheck, ShoppingCart, TrendingUp, Palette
  };


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-primary flex items-center">
          <LayoutDashboard className="mr-2 h-5 w-5" />
          Настройки Главной страницы
        </CardTitle>
        <CardDescription className="text-muted-foreground">Управление контентом и блоками на главной странице.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="space-y-2">
            <Label htmlFor="homepage_popular_categories_title" className="text-foreground">Заголовок "Популярные категории"</Label>
            <Input id="homepage_popular_categories_title" {...form.register("homepage_popular_categories_title")} placeholder="ПОПУЛЯРНЫЕ КАТЕГОРИИ" disabled={isLoading} />
          </div>
          
          <Separator />
          <h4 className="text-md font-semibold text-foreground pt-2">Наши преимущества (4 элемента)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {advantageFields.map((field, index) => {
              const IconComponent = iconMap[form.watch(`homepage_advantages.${index}.icon`)] || Palette;
              return (
                <Card key={field.id} className="p-3 bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                     <IconComponent className="h-5 w-5 text-primary"/>
                     <p className="text-sm font-medium text-foreground">Преимущество #{index + 1}</p>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <Label htmlFor={`homepage_advantages.${index}.icon`} className="text-xs text-muted-foreground">Иконка (Lucide имя)</Label>
                      <Input 
                        id={`homepage_advantages.${index}.icon`} 
                        {...form.register(`homepage_advantages.${index}.icon`)} 
                        placeholder="DollarSign" 
                        className="mt-0.5 h-8 text-xs"
                        disabled={isLoading} 
                      />
                      {form.formState.errors.homepage_advantages?.[index]?.icon && <p className="text-xs text-destructive mt-0.5">{form.formState.errors.homepage_advantages[index]?.icon?.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor={`homepage_advantages.${index}.text`} className="text-xs text-muted-foreground">Текст</Label>
                      <Input 
                        id={`homepage_advantages.${index}.text`} 
                        {...form.register(`homepage_advantages.${index}.text`)} 
                        placeholder="Доступные цены" 
                        className="mt-0.5 h-8 text-xs"
                        disabled={isLoading} 
                      />
                      {form.formState.errors.homepage_advantages?.[index]?.text && <p className="text-xs text-destructive mt-0.5">{form.formState.errors.homepage_advantages[index]?.text?.message}</p>}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
           {form.formState.errors.homepage_advantages && typeof form.formState.errors.homepage_advantages.message === 'string' && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.homepage_advantages.message}</p>
            )}

          <Separator />
          <h4 className="text-md font-semibold text-foreground pt-2">Блок "Испытай удачу" (кейсы)</h4>
          <div className="flex items-center space-x-2">
            <Controller
              control={form.control}
              name="homepage_show_case_opening_block"
              render={({ field }) => (
                <Checkbox
                  id="homepage_show_case_opening_block"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              )}
            />
            <Label htmlFor="homepage_show_case_opening_block" className="text-sm font-medium text-foreground">
              Показывать блок "Испытай удачу" на главной
            </Label>
          </div>
          {form.watch("homepage_show_case_opening_block") && (
            <>
              <div className="space-y-2">
                <Label htmlFor="homepage_case_opening_title" className="text-foreground">Заголовок блока кейсов</Label>
                <Input id="homepage_case_opening_title" {...form.register("homepage_case_opening_title")} placeholder="ИСПЫТАЙ УДАЧУ!" disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="homepage_case_opening_subtitle" className="text-foreground">Подзаголовок блока кейсов</Label>
                <Input id="homepage_case_opening_subtitle" {...form.register("homepage_case_opening_subtitle")} placeholder="Откройте кейс и получите шанс выиграть ценный приз" disabled={isLoading} />
              </div>
            </>
          )}

          <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isFetching}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить настройки главной
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
