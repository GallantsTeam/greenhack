
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Loader2, Send } from 'lucide-react'; // Added Send icon
import { useToast } from '@/hooks/use-toast';
import type { SmtpSettings } from '@/types';

const smtpSettingsSchema = z.object({
  smtp_host: z.string().optional().nullable(),
  smtp_port: z.coerce.number().positive("Порт должен быть положительным числом.").optional().nullable(),
  smtp_username: z.string().optional().nullable(),
  smtp_password: z.string().optional().nullable(),
  smtp_encryption: z.enum(['none', 'ssl', 'tls']).nullable().optional().default('none'),
  from_email: z.string().email({ message: "Неверный формат Email отправителя." }).optional().nullable().or(z.literal('')),
  from_name: z.string().optional().nullable(),
});

type SmtpSettingsFormValues = z.infer<typeof smtpSettingsSchema>;

export default function AdminSmtpSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  const form = useForm<SmtpSettingsFormValues>({
    resolver: zodResolver(smtpSettingsSchema),
    defaultValues: {
      smtp_host: '',
      smtp_port: 587,
      smtp_username: '',
      smtp_password: '',
      smtp_encryption: 'tls',
      from_email: '',
      from_name: '',
    },
  });

  const fetchSmtpSettings = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await fetch('/api/admin/site-settings/smtp');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch SMTP settings' }));
        throw new Error(errorData.message || 'Failed to fetch SMTP settings');
      }
      const data: SmtpSettings = await response.json();
      form.reset({
        smtp_host: data.smtp_host || '',
        smtp_port: data.smtp_port !== null ? Number(data.smtp_port) : 587,
        smtp_username: data.smtp_username || '',
        smtp_password: '', // Password is not pre-filled for security
        smtp_encryption: data.smtp_encryption || 'none',
        from_email: data.from_email || '',
        from_name: data.from_name || '',
      });
    } catch (error: any) {
      toast({ title: "Ошибка загрузки SMTP", description: error.message, variant: "destructive" });
    } finally {
      setIsFetching(false);
    }
  }, [form, toast]);

  useEffect(() => {
    fetchSmtpSettings();
  }, [fetchSmtpSettings]);

  const onSubmit = async (data: SmtpSettingsFormValues) => {
    setIsLoading(true);
    const payload = { ...data };
    if (!payload.smtp_password) {
      delete payload.smtp_password;
    }

    try {
      const response = await fetch('/api/admin/site-settings/smtp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Не удалось сохранить SMTP настройки.');
      toast({ title: "SMTP Настройки сохранены", description: "Конфигурация SMTP успешно обновлена." });
      // form.reset({ ...data, smtp_password: '' }); // Keep form state as is unless refetching
      await fetchSmtpSettings(); // Refetch to ensure form reflects saved state (excluding password)
    } catch (error: any) {
      toast({ title: "Ошибка сохранения SMTP", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendTestEmail = async () => {
    if (!testEmailRecipient) {
      toast({ title: "Ошибка", description: "Введите Email получателя для тестового письма.", variant: "destructive" });
      return;
    }
    if (!form.getValues('smtp_host') || !form.getValues('smtp_port')) {
        toast({ title: "Ошибка", description: "Для отправки тестового письма необходимо сохранить основные SMTP настройки (хост и порт).", variant: "destructive" });
        return;
    }

    setIsSendingTestEmail(true);
    try {
      const response = await fetch('/api/admin/site-settings/smtp/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: testEmailRecipient }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Не удалось отправить тестовое письмо.');
      }
      toast({ title: "Тестовое письмо", description: result.message });
    } catch (error: any) {
      toast({ title: "Ошибка тестового письма", description: error.message, variant: "destructive" });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Загрузка SMTP настроек...</p>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-primary flex items-center">
          <Mail className="mr-2 h-5 w-5" />
          Настройки SMTP
        </CardTitle>
        <CardDescription className="text-muted-foreground">Конфигурация сервера для отправки email-уведомлений.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="smtp_host" className="text-foreground">SMTP Хост</Label>
              <Input id="smtp_host" {...form.register("smtp_host")} placeholder="smtp.example.com" className="mt-1" disabled={isLoading} />
              {form.formState.errors.smtp_host && <p className="text-sm text-destructive mt-1">{form.formState.errors.smtp_host.message}</p>}
            </div>
            <div>
              <Label htmlFor="smtp_port" className="text-foreground">SMTP Порт</Label>
              <Input id="smtp_port" type="number" {...form.register("smtp_port")} placeholder="587" className="mt-1" disabled={isLoading} />
              {form.formState.errors.smtp_port && <p className="text-sm text-destructive mt-1">{form.formState.errors.smtp_port.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="smtp_username" className="text-foreground">SMTP Имя пользователя</Label>
              <Input id="smtp_username" {...form.register("smtp_username")} placeholder="user@example.com" className="mt-1" disabled={isLoading} />
              {form.formState.errors.smtp_username && <p className="text-sm text-destructive mt-1">{form.formState.errors.smtp_username.message}</p>}
            </div>
            <div>
              <Label htmlFor="smtp_password" className="text-foreground">SMTP Пароль</Label>
              <Input id="smtp_password" type="password" {...form.register("smtp_password")} placeholder="•••••••• (оставьте пустым, чтобы не менять)" className="mt-1" disabled={isLoading} />
               {form.formState.errors.smtp_password && <p className="text-sm text-destructive mt-1">{form.formState.errors.smtp_password.message}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="smtp_encryption" className="text-foreground">Шифрование</Label>
            <Controller
              control={form.control}
              name="smtp_encryption"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || "none"} disabled={isLoading}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Выберите тип шифрования" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="ssl">SSL</SelectItem>
                    <SelectItem value="tls">TLS</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
             {form.formState.errors.smtp_encryption && <p className="text-sm text-destructive mt-1">{form.formState.errors.smtp_encryption.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="from_email" className="text-foreground">Email отправителя</Label>
              <Input id="from_email" type="email" {...form.register("from_email")} placeholder="noreply@example.com" className="mt-1" disabled={isLoading} />
              {form.formState.errors.from_email && <p className="text-sm text-destructive mt-1">{form.formState.errors.from_email.message}</p>}
            </div>
            <div>
              <Label htmlFor="from_name" className="text-foreground">Имя отправителя</Label>
              <Input id="from_name" {...form.register("from_name")} placeholder="Green Hack Support" className="mt-1" disabled={isLoading} />
              {form.formState.errors.from_name && <p className="text-sm text-destructive mt-1">{form.formState.errors.from_name.message}</p>}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить SMTP
            </Button>
          </div>
        </form>
        
        <div className="mt-8 pt-6 border-t border-border/30">
            <h4 className="text-md font-medium text-foreground mb-2">Отправить тестовое письмо</h4>
            <div className="flex flex-col sm:flex-row gap-3">
                <Input 
                    type="email" 
                    placeholder="recipient@example.com" 
                    value={testEmailRecipient}
                    onChange={(e) => setTestEmailRecipient(e.target.value)}
                    className="flex-grow"
                    disabled={isSendingTestEmail}
                />
                <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full sm:w-auto border-primary text-primary hover:bg-primary/10" 
                    onClick={handleSendTestEmail} 
                    disabled={isSendingTestEmail || !testEmailRecipient.trim() || !form.getValues('smtp_host') || !form.getValues('smtp_port')}
                >
                    {isSendingTestEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Отправить тест
                </Button>
            </div>
             <p className="text-xs text-muted-foreground mt-2">Убедитесь, что основные SMTP настройки (хост, порт) сохранены перед отправкой теста.</p>
        </div>
      </CardContent>
    </Card>
  );
}
