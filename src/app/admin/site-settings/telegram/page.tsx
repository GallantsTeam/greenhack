
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Loader2, Send, MessageSquare, ShoppingCart, UserPlus, DollarSign, ShieldAlert, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SiteTelegramSettings, AdminTelegramNotificationPrefs } from '@/types';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const telegramSettingsSchema = z.object({
  client_bot_token: z.string().optional().nullable(),
  client_bot_chat_id: z.string().optional().nullable(),
  admin_bot_token: z.string().optional().nullable(),
  admin_bot_chat_ids: z.string().optional().nullable(), // Comma-separated
});

const adminNotificationPrefsSchema = z.object({
  notify_admin_on_balance_deposit: z.boolean().default(false),
  notify_admin_on_product_purchase: z.boolean().default(false),
  notify_admin_on_promo_code_creation: z.boolean().default(false),
  notify_admin_on_admin_login: z.boolean().default(false),
});

type CombinedFormValues = z.infer<typeof telegramSettingsSchema> & z.infer<typeof adminNotificationPrefsSchema>;

interface AdminNotificationOption {
  id: keyof AdminTelegramNotificationPrefs;
  label: string;
  description: string;
  icon: React.ElementType;
  implemented: boolean; // To control if it's selectable
}

const adminNotificationOptions: AdminNotificationOption[] = [
  { id: 'notify_admin_on_balance_deposit', label: 'Пополнение баланса', description: 'Уведомлять о пополнении баланса пользователем (включая промокоды).', icon: DollarSign, implemented: true },
  { id: 'notify_admin_on_product_purchase', label: 'Покупка товара', description: 'Уведомлять о покупке товара пользователем.', icon: ShoppingCart, implemented: true },
  { id: 'notify_admin_on_promo_code_creation', label: 'Создание промокода', description: 'Уведомлять о создании нового промокода.', icon: MessageSquare, implemented: true },
  { id: 'notify_admin_on_admin_login', label: 'Вход в админ-панель', description: 'Уведомлять о входе в админ-панель. (Требуется доп. интеграция)', icon: ShieldAlert, implemented: false },
];


export default function AdminTelegramSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [testMessageClient, setTestMessageClient] = useState('');
  const [testMessageAdmin, setTestMessageAdmin] = useState('');
  const [isSendingTestClient, setIsSendingTestClient] = useState(false);
  const [isSendingTestAdmin, setIsSendingTestAdmin] = useState(false);


  const form = useForm<CombinedFormValues>({
    resolver: zodResolver(telegramSettingsSchema.merge(adminNotificationPrefsSchema)),
    defaultValues: {
      client_bot_token: '',
      client_bot_chat_id: '',
      admin_bot_token: '',
      admin_bot_chat_ids: '',
      notify_admin_on_balance_deposit: false,
      notify_admin_on_product_purchase: false,
      notify_admin_on_promo_code_creation: false,
      notify_admin_on_admin_login: false,
    },
  });

  const fetchTelegramSettings = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await fetch('/api/admin/site-settings/telegram');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch Telegram settings' }));
        throw new Error(errorData.message || 'Failed to fetch Telegram settings');
      }
      const data: {telegramSettings: SiteTelegramSettings, notificationPrefs: AdminTelegramNotificationPrefs} = await response.json();
      form.reset({
        client_bot_token: data.telegramSettings?.client_bot_token || '',
        client_bot_chat_id: data.telegramSettings?.client_bot_chat_id || '',
        admin_bot_token: data.telegramSettings?.admin_bot_token || '',
        admin_bot_chat_ids: data.telegramSettings?.admin_bot_chat_ids || '',
        notify_admin_on_balance_deposit: data.notificationPrefs?.notify_admin_on_balance_deposit || false,
        notify_admin_on_product_purchase: data.notificationPrefs?.notify_admin_on_product_purchase || false,
        notify_admin_on_promo_code_creation: data.notificationPrefs?.notify_admin_on_promo_code_creation || false,
        notify_admin_on_admin_login: data.notificationPrefs?.notify_admin_on_admin_login || false,
      });
    } catch (error: any) {
      toast({ title: "Ошибка загрузки Telegram настроек", description: error.message, variant: "destructive" });
    } finally {
      setIsFetching(false);
    }
  }, [form, toast]);

  useEffect(() => {
    fetchTelegramSettings();
  }, [fetchTelegramSettings]);

  const onSubmit = async (data: CombinedFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/site-settings/telegram', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Не удалось сохранить Telegram настройки.');
      toast({ title: "Telegram Настройки сохранены", description: "Конфигурация Telegram ботов успешно обновлена." });
      if(result.settings) {
          form.reset({
            client_bot_token: result.settings.telegramSettings?.client_bot_token || '',
            client_bot_chat_id: result.settings.telegramSettings?.client_bot_chat_id || '',
            admin_bot_token: result.settings.telegramSettings?.admin_bot_token || '',
            admin_bot_chat_ids: result.settings.telegramSettings?.admin_bot_chat_ids || '',
            notify_admin_on_balance_deposit: result.settings.notificationPrefs?.notify_admin_on_balance_deposit || false,
            notify_admin_on_product_purchase: result.settings.notificationPrefs?.notify_admin_on_product_purchase || false,
            notify_admin_on_promo_code_creation: result.settings.notificationPrefs?.notify_admin_on_promo_code_creation || false,
            notify_admin_on_admin_login: result.settings.notificationPrefs?.notify_admin_on_admin_login || false,
        });
      }
    } catch (error: any) {
      toast({ title: "Ошибка сохранения Telegram", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTest = async (botType: 'client' | 'admin', message: string) => {
    if (!message.trim()) {
        toast({ title: "Ошибка", description: "Введите текст сообщения.", variant: "destructive"});
        return;
    }
    const token = botType === 'client' ? form.getValues('client_bot_token') : form.getValues('admin_bot_token');
    const chatIdInput = botType === 'client' ? form.getValues('client_bot_chat_id') : form.getValues('admin_bot_chat_ids')?.split(',')[0]?.trim(); // Use first admin chat ID for test

    if (!token || !chatIdInput) {
        toast({ title: "Ошибка", description: "Токен бота и ID чата должны быть заполнены для отправки тестового сообщения.", variant: "destructive"});
        return;
    }

    botType === 'client' ? setIsSendingTestClient(true) : setIsSendingTestAdmin(true);
    try {
        const response = await fetch('/api/admin/site-settings/telegram/test-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ botType, message }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || `Не удалось отправить тестовое сообщение для ${botType === 'client' ? 'клиентского' : 'админского'} бота.`);
        toast({ title: "Тестовое сообщение", description: result.message });
    } catch (error: any) {
        toast({ title: "Ошибка отправки", description: error.message, variant: "destructive" });
    } finally {
        botType === 'client' ? setIsSendingTestClient(false) : setIsSendingTestAdmin(false);
    }
  };

  if (isFetching) {
    return (
        <div className="flex items-center justify-center p-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Загрузка настроек Telegram...</p>
        </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-primary flex items-center">
            <Bot className="mr-2 h-5 w-5" />
            Настройки Telegram Ботов
        </CardTitle>
        <CardDescription className="text-muted-foreground">Управление ботами для клиентских и административных уведомлений.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="client_bot" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="client_bot">Клиентский Бот</TabsTrigger>
                    <TabsTrigger value="admin_bot">Админский Бот</TabsTrigger>
                </TabsList>

                <TabsContent value="client_bot" className="space-y-6">
                    <div>
                        <Label htmlFor="client_bot_token" className="text-foreground">Токен Клиентского Бота</Label>
                        <Input id="client_bot_token" {...form.register("client_bot_token")} placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" className="mt-1" disabled={isLoading} />
                    </div>
                    <div>
                        <Label htmlFor="client_bot_chat_id" className="text-foreground">ID Канала/Чата Клиентского Бота</Label>
                        <Input id="client_bot_chat_id" {...form.register("client_bot_chat_id")} placeholder="-1001234567890 или @channelname" className="mt-1" disabled={isLoading} />
                    </div>
                     <div className="pt-2 space-y-2">
                        <Label htmlFor="test_message_client" className="text-foreground">Тестовое сообщение для клиентского бота</Label>
                        <div className="flex gap-2">
                            <Input id="test_message_client" value={testMessageClient} onChange={(e) => setTestMessageClient(e.target.value)} placeholder="Тест клиентского бота!" disabled={isSendingTestClient} />
                            <Button type="button" variant="outline" onClick={() => handleSendTest('client', testMessageClient)} disabled={isSendingTestClient || !form.getValues('client_bot_token') || !form.getValues('client_bot_chat_id')} className="border-primary text-primary hover:bg-primary/10">
                                {isSendingTestClient ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                                Отправить
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="admin_bot" className="space-y-6">
                    <div>
                        <Label htmlFor="admin_bot_token" className="text-foreground">Токен Админского Бота</Label>
                        <Input id="admin_bot_token" {...form.register("admin_bot_token")} placeholder="654321:ZYX-wvu9876..." className="mt-1" disabled={isLoading} />
                    </div>
                    <div>
                        <Label htmlFor="admin_bot_chat_ids" className="text-foreground">ID Чатов Администраторов (через запятую)</Label>
                        <Input id="admin_bot_chat_ids" {...form.register("admin_bot_chat_ids")} placeholder="-100987654321, -1001122334455" className="mt-1" disabled={isLoading} />
                    </div>
                     <div className="pt-2 space-y-2">
                        <Label htmlFor="test_message_admin" className="text-foreground">Тестовое сообщение для админского бота</Label>
                         <div className="flex gap-2">
                            <Input id="test_message_admin" value={testMessageAdmin} onChange={(e) => setTestMessageAdmin(e.target.value)} placeholder="Тест админского бота!" disabled={isSendingTestAdmin} />
                            <Button type="button" variant="outline" onClick={() => handleSendTest('admin', testMessageAdmin)} disabled={isSendingTestAdmin || !form.getValues('admin_bot_token') || !form.getValues('admin_bot_chat_ids')} className="border-primary text-primary hover:bg-primary/10">
                                {isSendingTestAdmin ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                                Отправить
                            </Button>
                        </div>
                    </div>
                    <Separator />
                    <h4 className="text-md font-medium text-foreground">Уведомления для Админского Бота:</h4>
                    <div className="space-y-3">
                        {adminNotificationOptions.map((option) => (
                          <div key={option.id} className="flex items-start p-2.5 border border-border/30 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors">
                             <Controller
                                control={form.control}
                                name={option.id}
                                render={({ field }) => (
                                    <TooltipProvider>
                                        <Tooltip delayDuration={100}>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center">
                                                    <Checkbox
                                                        id={option.id}
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="mt-1 mr-3 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                                        disabled={isLoading || !option.implemented}
                                                    />
                                                </div>
                                            </TooltipTrigger>
                                            {!option.implemented && (
                                                <TooltipContent side="right">
                                                    <p>Функция в разработке</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                                />
                                <div className="grid gap-1 leading-none">
                                    <Label htmlFor={option.id} className={`text-foreground font-medium flex items-center ${option.implemented ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                                        <option.icon className={`mr-2 h-4 w-4 ${option.implemented ? 'text-primary/80' : 'text-muted-foreground'}`}/>
                                        {option.label}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {option.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end pt-6 border-t border-border/50 mt-6">
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isFetching}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Сохранить настройки Telegram
                </Button>
            </div>
        </form>
      </CardContent>
    </Card>
  );
}

    
