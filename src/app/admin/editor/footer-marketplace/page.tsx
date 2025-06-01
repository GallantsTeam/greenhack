
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ShoppingBag, Type, ImageIcon as ImageIconLucide, Link as LinkIconLucide, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SiteSettings } from '@/types';

const footerMarketplaceSchema = z.object({
  footer_marketplace_text: z.string().max(255).optional().nullable(),
  footer_marketplace_logo_url: z.string().url({ message: "Неверный URL для логотипа маркетплейса." }).optional().or(z.literal('')).nullable(),
  footer_marketplace_link_url: z.string().url({ message: "Неверный URL для ссылки маркетплейса." }).optional().or(z.literal('')).nullable(),
  footer_marketplace_is_visible: z.boolean().default(true),
});

type FooterMarketplaceFormValues = z.infer<typeof footerMarketplaceSchema>;

export default function AdminFooterMarketplacePage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<FooterMarketplaceFormValues>({
    resolver: zodResolver(footerMarketplaceSchema),
    defaultValues: {
      footer_marketplace_text: 'Мы продаем на:',
      footer_marketplace_logo_url: 'https://yougame.biz/images/rlm/logo/logoconcept4.png',
      footer_marketplace_link_url: 'https://yougame.biz/members/263428/',
      footer_marketplace_is_visible: true,
    },
  });

  const fetchFooterMarketplaceSettings = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await fetch('/api/admin/site-settings');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Не удалось загрузить настройки блока "Marketplace".' }));
        throw new Error(errorData.message);
      }
      const data: SiteSettings = await response.json();
      form.reset({
        footer_marketplace_text: data.footer_marketplace_text || 'Мы продаем на:',
        footer_marketplace_logo_url: data.footer_marketplace_logo_url || 'https://yougame.biz/images/rlm/logo/logoconcept4.png',
        footer_marketplace_link_url: data.footer_marketplace_link_url || 'https://yougame.biz/members/263428/',
        footer_marketplace_is_visible: data.footer_marketplace_is_visible === undefined ? true : data.footer_marketplace_is_visible,
      });
    } catch (error: any) {
      toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
    } finally {
      setIsFetching(false);
    }
  }, [form, toast]);

  useEffect(() => {
    fetchFooterMarketplaceSettings();
  }, [fetchFooterMarketplaceSettings]);

  const onSubmit = async (data: FooterMarketplaceFormValues) => {
    setIsLoading(true);
    try {
      // Fetch existing site settings to merge with these specific settings
      const existingSettingsRes = await fetch('/api/admin/site-settings');
      if (!existingSettingsRes.ok) throw new Error('Could not fetch existing settings to merge.');
      const existingSettings: SiteSettings = await existingSettingsRes.json();
      
      // Merge only the marketplace related fields from current form data
      const payload = { 
        ...existingSettings, // Start with all existing settings
        footer_marketplace_text: data.footer_marketplace_text,
        footer_marketplace_logo_url: data.footer_marketplace_logo_url,
        footer_marketplace_link_url: data.footer_marketplace_link_url,
        footer_marketplace_is_visible: data.footer_marketplace_is_visible,
      };

      const response = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Не удалось сохранить настройки блока "Marketplace".');
      toast({ title: "Настройки сохранены", description: "Блок 'Marketplace' в футере успешно обновлен." });
      if(result.settings) { // Re-set form with potentially updated values from the specific fields
        form.reset({
            footer_marketplace_text: result.settings.footer_marketplace_text || 'Мы продаем на:',
            footer_marketplace_logo_url: result.settings.footer_marketplace_logo_url || 'https://yougame.biz/images/rlm/logo/logoconcept4.png',
            footer_marketplace_link_url: result.settings.footer_marketplace_link_url || 'https://yougame.biz/members/263428/',
            footer_marketplace_is_visible: result.settings.footer_marketplace_is_visible === undefined ? true : result.settings.footer_marketplace_is_visible,
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

  return (
    <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl font-bold text-primary flex items-center">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Редактирование блока "Marketplace" в футере
            </CardTitle>
            <CardDescription className="text-muted-foreground">
                Укажите текст, логотип и ссылку для блока "Мы продаем на:" в подвале сайта.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="footer_marketplace_text" className="text-foreground flex items-center"><Type className="mr-2 h-4 w-4 text-primary/80"/>Текст над логотипом</Label>
                    <Input id="footer_marketplace_text" {...form.register("footer_marketplace_text")} placeholder="Мы продаем на:" className="mt-1" disabled={isLoading}/>
                    {form.formState.errors.footer_marketplace_text && <p className="text-sm text-destructive mt-1">{form.formState.errors.footer_marketplace_text.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="footer_marketplace_logo_url" className="text-foreground flex items-center"><ImageIconLucide className="mr-2 h-4 w-4 text-primary/80"/>URL логотипа</Label>
                    <Input id="footer_marketplace_logo_url" {...form.register("footer_marketplace_logo_url")} placeholder="https://example.com/logo.png" className="mt-1" disabled={isLoading}/>
                    {form.formState.errors.footer_marketplace_logo_url && <p className="text-sm text-destructive mt-1">{form.formState.errors.footer_marketplace_logo_url.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="footer_marketplace_link_url" className="text-foreground flex items-center"><LinkIconLucide className="mr-2 h-4 w-4 text-primary/80"/>URL ссылки для логотипа</Label>
                    <Input id="footer_marketplace_link_url" {...form.register("footer_marketplace_link_url")} placeholder="https://example.com/marketplace" className="mt-1" disabled={isLoading}/>
                    {form.formState.errors.footer_marketplace_link_url && <p className="text-sm text-destructive mt-1">{form.formState.errors.footer_marketplace_link_url.message}</p>}
                </div>
                <div className="flex items-center space-x-2 pt-2">
                    <Controller
                        control={form.control}
                        name="footer_marketplace_is_visible"
                        render={({ field }) => (
                            <Checkbox
                            id="footer_marketplace_is_visible"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                            disabled={isLoading}
                            />
                        )}
                    />
                    <Label htmlFor="footer_marketplace_is_visible" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground flex items-center">
                        {form.watch("footer_marketplace_is_visible") ? <Eye className="mr-2 h-4 w-4 text-primary/80"/> : <EyeOff className="mr-2 h-4 w-4 text-muted-foreground"/>}
                        Отображать блок "Marketplace" в футере
                    </Label>
                </div>
                
                <div className="flex justify-end pt-4">
                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isFetching}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Сохранить настройки блока
                    </Button>
                </div>
            </form>
        </CardContent>
    </Card>
  );
}
