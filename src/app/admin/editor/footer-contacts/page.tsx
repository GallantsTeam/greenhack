
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle, Users, Bot, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SiteSettings } from '@/types';
import { Separator } from '@/components/ui/separator';

const footerContactsSchema = z.object({
  contact_vk_label: z.string().max(255).optional().nullable(),
  contact_vk_url: z.string().url({ message: "Неверный URL для VK." }).optional().or(z.literal('')).nullable(),
  contact_telegram_bot_label: z.string().max(255).optional().nullable(),
  contact_telegram_bot_url: z.string().url({ message: "Неверный URL для Telegram." }).optional().or(z.literal('')).nullable(),
  contact_email_label: z.string().max(255).optional().nullable(),
  contact_email_address: z.string().email({ message: "Неверный формат Email." }).optional().or(z.literal('')).nullable(),
});

type FooterContactsFormValues = z.infer<typeof footerContactsSchema>;

export default function AdminFooterContactsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<FooterContactsFormValues>({
    resolver: zodResolver(footerContactsSchema),
    defaultValues: {
      contact_vk_label: '',
      contact_vk_url: '',
      contact_telegram_bot_label: '',
      contact_telegram_bot_url: '',
      contact_email_label: '',
      contact_email_address: '',
    },
  });

  const fetchFooterSettings = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await fetch('/api/admin/site-settings'); // Use the main site settings endpoint
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Не удалось загрузить настройки футера.' }));
        throw new Error(errorData.message);
      }
      const data: SiteSettings = await response.json();
      form.reset({
        contact_vk_label: data.contact_vk_label || 'Наша беседа VK',
        contact_vk_url: data.contact_vk_url || '',
        contact_telegram_bot_label: data.contact_telegram_bot_label || 'Наш Telegram Бот',
        contact_telegram_bot_url: data.contact_telegram_bot_url || '',
        contact_email_label: data.contact_email_label || 'Email поддержки',
        contact_email_address: data.contact_email_address || '',
      });
    } catch (error: any) {
      toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
    } finally {
      setIsFetching(false);
    }
  }, [form, toast]);

  useEffect(() => {
    fetchFooterSettings();
  }, [fetchFooterSettings]);

  const onSubmit = async (data: FooterContactsFormValues) => {
    setIsLoading(true);
    try {
      // Fetch existing site settings to merge with footer contacts
      const existingSettingsRes = await fetch('/api/admin/site-settings');
      if (!existingSettingsRes.ok) throw new Error('Could not fetch existing settings to merge.');
      const existingSettings: SiteSettings = await existingSettingsRes.json();

      const payload = { ...existingSettings, ...data };

      const response = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Не удалось сохранить настройки футера.');
      toast({ title: "Настройки сохранены", description: "Контакты в футере успешно обновлены." });
      if(result.settings) {
        form.reset({ // Re-set form with potentially updated values
            contact_vk_label: result.settings.contact_vk_label || '',
            contact_vk_url: result.settings.contact_vk_url || '',
            contact_telegram_bot_label: result.settings.contact_telegram_bot_label || '',
            contact_telegram_bot_url: result.settings.contact_telegram_bot_url || '',
            contact_email_label: result.settings.contact_email_label || '',
            contact_email_address: result.settings.contact_email_address || '',
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
            <p className="ml-3 text-muted-foreground">Загрузка настроек контактов...</p>
        </div>
    );
  }

  return (
    <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl font-bold text-primary flex items-center">
                <MessageCircle className="mr-2 h-5 w-5" />
                Редактирование контактов в футере
            </CardTitle>
            <CardDescription className="text-muted-foreground">
                Измените ссылки и подписи для блока "Связь с нами" в подвале сайта.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* VK */}
                <div className="space-y-2 p-4 border border-border/30 rounded-md">
                    <h4 className="text-md font-semibold text-foreground flex items-center"><Users className="mr-2 h-5 w-5 text-primary/80"/>VK Контакт</h4>
                    <div>
                        <Label htmlFor="contact_vk_label" className="text-foreground">Текст ссылки VK</Label>
                        <Input id="contact_vk_label" {...form.register("contact_vk_label")} placeholder="Наша беседа VK" className="mt-1" disabled={isLoading}/>
                        {form.formState.errors.contact_vk_label && <p className="text-sm text-destructive mt-1">{form.formState.errors.contact_vk_label.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="contact_vk_url" className="text-foreground">URL ссылки VK</Label>
                        <Input id="contact_vk_url" {...form.register("contact_vk_url")} placeholder="https://vk.me/..." className="mt-1" disabled={isLoading}/>
                        {form.formState.errors.contact_vk_url && <p className="text-sm text-destructive mt-1">{form.formState.errors.contact_vk_url.message}</p>}
                    </div>
                </div>

                {/* Telegram Bot */}
                <div className="space-y-2 p-4 border border-border/30 rounded-md">
                    <h4 className="text-md font-semibold text-foreground flex items-center"><Bot className="mr-2 h-5 w-5 text-primary/80"/>Telegram Бот</h4>
                    <div>
                        <Label htmlFor="contact_telegram_bot_label" className="text-foreground">Текст ссылки Telegram</Label>
                        <Input id="contact_telegram_bot_label" {...form.register("contact_telegram_bot_label")} placeholder="Наш Telegram Бот" className="mt-1" disabled={isLoading}/>
                        {form.formState.errors.contact_telegram_bot_label && <p className="text-sm text-destructive mt-1">{form.formState.errors.contact_telegram_bot_label.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="contact_telegram_bot_url" className="text-foreground">URL ссылки Telegram</Label>
                        <Input id="contact_telegram_bot_url" {...form.register("contact_telegram_bot_url")} placeholder="https://t.me/..." className="mt-1" disabled={isLoading}/>
                        {form.formState.errors.contact_telegram_bot_url && <p className="text-sm text-destructive mt-1">{form.formState.errors.contact_telegram_bot_url.message}</p>}
                    </div>
                </div>

                {/* Email */}
                <div className="space-y-2 p-4 border border-border/30 rounded-md">
                     <h4 className="text-md font-semibold text-foreground flex items-center"><Mail className="mr-2 h-5 w-5 text-primary/80"/>Email</h4>
                    <div>
                        <Label htmlFor="contact_email_label" className="text-foreground">Текст ссылки Email</Label>
                        <Input id="contact_email_label" {...form.register("contact_email_label")} placeholder="Email поддержки" className="mt-1" disabled={isLoading}/>
                        {form.formState.errors.contact_email_label && <p className="text-sm text-destructive mt-1">{form.formState.errors.contact_email_label.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="contact_email_address" className="text-foreground">Адрес Email</Label>
                        <Input id="contact_email_address" type="email" {...form.register("contact_email_address")} placeholder="support@example.com" className="mt-1" disabled={isLoading}/>
                        {form.formState.errors.contact_email_address && <p className="text-sm text-destructive mt-1">{form.formState.errors.contact_email_address.message}</p>}
                    </div>
                </div>
                
                <div className="flex justify-end pt-4">
                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isFetching}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Сохранить контакты
                    </Button>
                </div>
            </form>
        </CardContent>
    </Card>
  );
}
