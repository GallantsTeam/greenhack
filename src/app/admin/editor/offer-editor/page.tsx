
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, FileText } from 'lucide-react'; // Added FileText
import { useToast } from '@/hooks/use-toast';
import type { SiteSettings } from '@/types';
import { Separator } from '@/components/ui/separator';

const contentSchema = z.object({
  offer_page_content: z.string().optional().nullable(),
  rules_page_content: z.string().optional().nullable(), // Added rules content
});

type ContentFormValues = z.infer<typeof contentSchema>;

export default function AdminOfferAndRulesEditorPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      offer_page_content: '',
      rules_page_content: '',
    },
  });

  const fetchContent = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await fetch('/api/admin/site-settings'); // Fetch all site settings
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Не удалось загрузить контент.' }));
        throw new Error(errorData.message);
      }
      const data: SiteSettings = await response.json();
      form.reset({
        offer_page_content: data.offer_page_content || '',
        rules_page_content: data.rules_page_content || '',
      });
    } catch (error: any) {
      toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
    } finally {
      setIsFetching(false);
    }
  }, [form, toast]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const onSubmit = async (data: ContentFormValues) => {
    setIsLoading(true);
    try {
      // Fetch existing settings to merge with the new content
      const existingSettingsRes = await fetch('/api/admin/site-settings');
      if (!existingSettingsRes.ok) throw new Error('Could not fetch existing settings to merge.');
      const existingSettings: SiteSettings = await existingSettingsRes.json();
      
      const payload = { 
        ...existingSettings, 
        offer_page_content: data.offer_page_content,
        rules_page_content: data.rules_page_content 
      };

      const response = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Не удалось сохранить контент.');
      toast({ title: "Контент обновлен", description: "Содержимое страниц успешно обновлено." });
      if(result.settings) {
        form.reset({ 
            offer_page_content: result.settings.offer_page_content || '',
            rules_page_content: result.settings.rules_page_content || ''
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
        <p className="ml-3 text-muted-foreground">Загрузка редактора...</p>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-primary flex items-center">
          <ShieldCheck className="mr-2 h-5 w-5" />
          Редактор страниц "Оферта" и "Правила"
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Введите или отредактируйте HTML-содержимое для страниц публичной оферты и правил сайта.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <div>
            <Label htmlFor="offer_page_content" className="text-foreground flex items-center mb-1">
                <ShieldCheck className="mr-2 h-4 w-4 text-primary/80"/> HTML-контент Оферты
            </Label>
            <Textarea
              id="offer_page_content"
              {...form.register("offer_page_content")}
              placeholder="<p>Ваша публичная оферта здесь...</p> <h4>Раздел 1</h4> <p>...</p>"
              className="mt-1 min-h-[300px] font-mono text-sm bg-muted/30 border-border"
              disabled={isLoading}
            />
            {form.formState.errors.offer_page_content && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.offer_page_content.message}</p>
            )}
          </div>

          <Separator className="my-8" />

          <div>
            <Label htmlFor="rules_page_content" className="text-foreground flex items-center mb-1">
                <FileText className="mr-2 h-4 w-4 text-primary/80"/> HTML-контент Правил Сайта
            </Label>
            <Textarea
              id="rules_page_content"
              {...form.register("rules_page_content")}
              placeholder="<p>Ваши правила сайта здесь...</p> <h3>Заголовок</h3> <ul><li>Пункт 1</li></ul>"
              className="mt-1 min-h-[300px] font-mono text-sm bg-muted/30 border-border"
              disabled={isLoading}
            />
            {form.formState.errors.rules_page_content && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.rules_page_content.message}</p>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isFetching}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить контент
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
    