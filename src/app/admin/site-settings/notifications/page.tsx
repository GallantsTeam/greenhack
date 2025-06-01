
// src/app/admin/site-settings/notifications/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, BellRing, MailCheck, ShoppingBag, MessageSquare, Power, CalendarClock, Annoyed, DollarSign } from 'lucide-react'; // Added DollarSign
import { useToast } from '@/hooks/use-toast';
import type { SiteNotificationSettings } from '@/types';
import { Separator } from '@/components/ui/separator';

const notificationSettingsSchema = z.object({
  notify_on_registration: z.boolean().default(true),
  notify_on_balance_deposit: z.boolean().default(true),
  notify_on_product_purchase: z.boolean().default(true),
  notify_on_support_reply: z.boolean().default(false),
  notify_on_software_activation: z.boolean().default(false),
  notify_on_license_expiry_soon: z.boolean().default(false),
  notify_on_promotions: z.boolean().default(false),
});

type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>;

interface NotificationOption {
  id: keyof NotificationSettingsFormValues;
  label: string;
  description: string;
  icon: React.ElementType;
}

const notificationOptions: NotificationOption[] = [
  { id: 'notify_on_registration', label: 'После регистрации', description: 'Отправлять приветственное письмо новому пользователю.', icon: MailCheck },
  { id: 'notify_on_balance_deposit', label: 'После пополнения счета', description: 'Уведомлять о зачислении средств на баланс.', icon: DollarSign },
  { id: 'notify_on_product_purchase', label: 'После покупки товара', description: 'Отправлять подтверждение покупки и информацию о товаре.', icon: ShoppingBag },
  { id: 'notify_on_support_reply', label: 'После ответа тех. поддержки', description: 'Уведомлять пользователя об ответе на его тикет. (Требуется интеграция с системой тикетов)', icon: MessageSquare },
  { id: 'notify_on_software_activation', label: 'Активация софта', description: 'Уведомление об успешной активации продукта. (Требуется доп. логика)', icon: Power },
  { id: 'notify_on_license_expiry_soon', label: 'Заканчивается лицензия', description: 'Напоминание о скором истечении срока действия лицензии. (Требуется планировщик задач)', icon: CalendarClock },
  { id: 'notify_on_promotions', label: 'Акции и Предложения', description: 'Рассылка информации о новых акциях и специальных предложениях. (Требуется система рассылок)', icon: Annoyed /* Using Annoyed as placeholder, consider Bell or Megaphone */ },
];


export default function AdminNotificationSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      notify_on_registration: true,
      notify_on_balance_deposit: true,
      notify_on_product_purchase: true,
      notify_on_support_reply: false,
      notify_on_software_activation: false,
      notify_on_license_expiry_soon: false,
      notify_on_promotions: false,
    },
  });

  const fetchNotificationSettings = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await fetch('/api/admin/site-settings/notifications');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch notification settings' }));
        throw new Error(errorData.message || 'Failed to fetch notification settings');
      }
      const data: SiteNotificationSettings = await response.json();
      form.reset({
        notify_on_registration: data.notify_on_registration,
        notify_on_balance_deposit: data.notify_on_balance_deposit,
        notify_on_product_purchase: data.notify_on_product_purchase,
        notify_on_support_reply: data.notify_on_support_reply,
        notify_on_software_activation: data.notify_on_software_activation,
        notify_on_license_expiry_soon: data.notify_on_license_expiry_soon,
        notify_on_promotions: data.notify_on_promotions,
      });
    } catch (error: any) {
      toast({ title: "Ошибка загрузки настроек уведомлений", description: error.message, variant: "destructive" });
    } finally {
      setIsFetching(false);
    }
  }, [form, toast]);

  useEffect(() => {
    fetchNotificationSettings();
  }, [fetchNotificationSettings]);

  const onSubmit = async (data: NotificationSettingsFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/site-settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Не удалось сохранить настройки уведомлений.');
      toast({ title: "Настройки уведомлений сохранены", description: "Конфигурация email-уведомлений успешно обновлена." });
      if(result.settings) { // Assuming API returns updated settings
        form.reset(result.settings);
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
            <p className="ml-3 text-muted-foreground">Загрузка настроек уведомлений...</p>
        </div>
    );
  }


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-primary flex items-center">
            <BellRing className="mr-2 h-5 w-5" />
            Настройки Email-Уведомлений
        </CardTitle>
        <CardDescription className="text-muted-foreground">
            Выберите, какие автоматические email-уведомления будут отправляться пользователям.
            Для работы уведомлений должен быть корректно настроен SMTP-сервер.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {notificationOptions.map((option) => (
              <div key={option.id} className="flex items-start p-3 border border-border/30 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors">
                <Controller
                  control={form.control}
                  name={option.id}
                  render={({ field }) => (
                    <Checkbox
                      id={option.id}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-1 mr-3 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      disabled={isLoading}
                    />
                  )}
                />
                <div className="grid gap-1.5 leading-none">
                    <Label htmlFor={option.id} className="text-foreground font-medium flex items-center cursor-pointer">
                        <option.icon className="mr-2 h-4 w-4 text-primary/80"/>
                        {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        {option.description}
                    </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-4">
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isFetching}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить настройки уведомлений
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
    
    
