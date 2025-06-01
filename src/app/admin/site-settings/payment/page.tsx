
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Loader2, Settings, Info, MessageSquare, Check, X, AlertOctagon, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SitePaymentGatewaySettings } from '@/types';
import { Separator } from '@/components/ui/separator';

const paymentSettingsSchema = z.object({
  yoomoney_shop_id: z.string().optional().nullable(),
  yoomoney_secret_key: z.string().optional().nullable(), // Password field, not pre-filled for security on GET
  yoomoney_notify_payment_succeeded: z.boolean().default(true),
  yoomoney_notify_payment_waiting_for_capture: z.boolean().default(false),
  yoomoney_notify_payment_canceled: z.boolean().default(true),
  yoomoney_notify_refund_succeeded: z.boolean().default(true),
  is_test_mode_active: z.boolean().default(true),
});

type PaymentSettingsFormValues = z.infer<typeof paymentSettingsSchema>;

interface WebhookEvent {
  id: keyof Pick<SitePaymentGatewaySettings, 'yoomoney_notify_payment_succeeded' | 'yoomoney_notify_payment_waiting_for_capture' | 'yoomoney_notify_payment_canceled' | 'yoomoney_notify_refund_succeeded'>;
  label: string;
  description: string;
  eventName: string;
  icon: React.ElementType;
}

const yoomoneyWebhookEvents: WebhookEvent[] = [
  { id: 'yoomoney_notify_payment_succeeded', label: 'Успешный платеж', description: 'Уведомление о полностью успешном платеже.', eventName: 'payment.succeeded', icon: Check },
  { id: 'yoomoney_notify_payment_waiting_for_capture', label: 'Платеж ожидает подтверждения', description: 'Платеж создан, ожидает захвата (capture).', eventName: 'payment.waiting_for_capture', icon: Loader2 },
  { id: 'yoomoney_notify_payment_canceled', label: 'Отмена/Ошибка платежа', description: 'Платеж отменен или произошла ошибка при оплате.', eventName: 'payment.canceled', icon: X },
  { id: 'yoomoney_notify_refund_succeeded', label: 'Успешный возврат', description: 'Уведомление об успешном возврате средств покупателю.', eventName: 'refund.succeeded', icon: AlertOctagon },
];


export default function AdminPaymentSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [webhookBaseUrl, setWebhookBaseUrl] = useState('');

  const form = useForm<PaymentSettingsFormValues>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      yoomoney_shop_id: '',
      yoomoney_secret_key: '',
      yoomoney_notify_payment_succeeded: true,
      yoomoney_notify_payment_waiting_for_capture: false,
      yoomoney_notify_payment_canceled: true,
      yoomoney_notify_refund_succeeded: true,
      is_test_mode_active: true,
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebhookBaseUrl(window.location.origin);
    }
  }, []);

  const fetchPaymentSettings = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await fetch('/api/admin/site-settings/payment');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch payment settings' }));
        throw new Error(errorData.message);
      }
      const data: SitePaymentGatewaySettings = await response.json();
      form.reset({
        yoomoney_shop_id: data.yoomoney_shop_id || '',
        yoomoney_secret_key: '', // Never pre-fill password
        yoomoney_notify_payment_succeeded: data.yoomoney_notify_payment_succeeded === undefined ? true : data.yoomoney_notify_payment_succeeded,
        yoomoney_notify_payment_waiting_for_capture: data.yoomoney_notify_payment_waiting_for_capture === undefined ? false : data.yoomoney_notify_payment_waiting_for_capture,
        yoomoney_notify_payment_canceled: data.yoomoney_notify_payment_canceled === undefined ? true : data.yoomoney_notify_payment_canceled,
        yoomoney_notify_refund_succeeded: data.yoomoney_notify_refund_succeeded === undefined ? true : data.yoomoney_notify_refund_succeeded,
        is_test_mode_active: data.is_test_mode_active === undefined ? true : data.is_test_mode_active,
      });
    } catch (error: any) {
      toast({ title: "Ошибка загрузки настроек", description: error.message, variant: "destructive" });
    } finally {
      setIsFetching(false);
    }
  }, [form, toast]);

  useEffect(() => {
    fetchPaymentSettings();
  }, [fetchPaymentSettings]);

  const onSubmit = async (data: PaymentSettingsFormValues) => {
    setIsLoading(true);
    const payload: Partial<PaymentSettingsFormValues> = { ...data };
    if (!data.yoomoney_secret_key || data.yoomoney_secret_key.trim() === '') {
      delete payload.yoomoney_secret_key;
    }

    try {
      const response = await fetch('/api/admin/site-settings/payment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Не удалось сохранить настройки.');
      toast({ title: "Настройки сохранены", description: "Настройки платежного шлюза успешно обновлены." });
      if(result.settings) {
        form.reset({ // Re-set form with potentially updated values, keeping password field empty
            ...result.settings,
            yoomoney_secret_key: '',
            is_test_mode_active: Boolean(result.settings.is_test_mode_active) // Ensure boolean
        });
      } else {
         form.setValue('yoomoney_secret_key', ''); // Clear password field if no settings returned
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
        <p className="ml-3 text-muted-foreground">Загрузка настроек платежей...</p>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-primary flex items-center">
          <CreditCard className="mr-2 h-5 w-5" />
          Настройки Платежного Шлюза
        </CardTitle>
        <CardDescription className="text-muted-foreground">Управление интеграцией с YooMoney Касса и тестовым режимом.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="yoomoney" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="yoomoney">YooMoney Касса</TabsTrigger>
                    <TabsTrigger value="test_mode">Тестовый Режим</TabsTrigger>
                </TabsList>

                <TabsContent value="yoomoney" className="space-y-6">
                    <CardDescription className="text-sm text-muted-foreground mb-4">
                        Настройте интеграцию с YooMoney для приема реальных платежей.
                    </CardDescription>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="yoomoney_shop_id" className="text-foreground">Shop ID (Идентификатор магазина)</Label>
                            <Input id="yoomoney_shop_id" {...form.register("yoomoney_shop_id")} placeholder="123456" className="mt-1" disabled={isLoading}/>
                        </div>
                        <div>
                            <Label htmlFor="yoomoney_secret_key" className="text-foreground">Секретный ключ</Label>
                            <Input id="yoomoney_secret_key" type="password" {...form.register("yoomoney_secret_key")} placeholder="•••••••• (оставьте пустым, чтобы не менять)" className="mt-1" disabled={isLoading}/>
                        </div>
                    </div>
                     <div>
                        <Label className="text-foreground flex items-center"><LinkIcon className="mr-2 h-4 w-4 text-primary/80"/>URL для HTTP-уведомлений (Webhook)</Label>
                        <Input 
                            value={`${webhookBaseUrl}/api/payment/yoomoney-webhook`} 
                            readOnly 
                            className="mt-1 bg-muted text-muted-foreground" 
                            disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Скопируйте этот URL и вставьте в настройках вашего магазина YooMoney Касса.</p>
                    </div>

                    <Separator className="my-6"/>
                    <h4 className="text-md font-medium text-foreground">Какие HTTP-уведомления от YooMoney обрабатывать:</h4>
                    <div className="space-y-3">
                        {yoomoneyWebhookEvents.map((event) => (
                            <div key={event.id} className="flex items-start p-2.5 border border-border/30 rounded-md">
                                <Controller
                                    control={form.control}
                                    name={event.id}
                                    render={({ field }) => (
                                        <Checkbox
                                            id={event.id}
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            className="mt-1 mr-3 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                            disabled={isLoading}
                                        />
                                    )}
                                />
                                <div className="grid gap-1 leading-none">
                                    <Label htmlFor={event.id} className="text-foreground font-medium flex items-center cursor-pointer">
                                        <event.icon className="mr-2 h-4 w-4 text-primary/80"/>
                                        {event.label}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Событие YooMoney: <code className="text-xs bg-muted/80 px-1 py-0.5 rounded-sm">{event.eventName}</code>. {event.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="test_mode" className="space-y-6">
                     <CardDescription className="text-sm text-muted-foreground">
                        В тестовом режиме все пополнения баланса будут создаваться как заявки, требующие ручного одобрения администратором. 
                        Реальная оплата через YooMoney производиться не будет.
                    </CardDescription>
                    <div className="flex items-center space-x-2 pt-2">
                        <Controller
                            control={form.control}
                            name="is_test_mode_active"
                            render={({ field }) => (
                                <Checkbox
                                    id="is_test_mode_active"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                    disabled={isLoading}
                                />
                            )}
                        />
                        <Label htmlFor="is_test_mode_active" className="text-lg font-medium leading-none text-foreground">
                            Включить тестовый режим платежей
                        </Label>
                    </div>
                    {form.watch("is_test_mode_active") && (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                            <Info className="inline h-4 w-4 mr-1.5 text-yellow-600"/>
                            <span className="text-sm text-yellow-700">Тестовый режим активен. Пополнения будут обрабатываться через заявки в разделе "Тестовые Платежи".</span>
                        </div>
                    )}
                     {!form.watch("is_test_mode_active") && (
                        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-md">
                            <Check className="inline h-4 w-4 mr-1.5 text-green-600"/>
                            <span className="text-sm text-green-700">Тестовый режим отключен. Платежи будут обрабатываться через YooMoney Касса.</span>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
            <div className="flex justify-end pt-8 border-t border-border/30 mt-8">
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isFetching}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Сохранить настройки платежей
                </Button>
            </div>
        </form>
      </CardContent>
    </Card>
  );
}
