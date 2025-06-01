
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SiteSettings } from '@/types';

const rulesSchema = z.object({
  rules_page_content: z.string().optional().nullable(),
});

type RulesFormValues = z.infer<typeof rulesSchema>;

export default function AdminRulesEditorPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<RulesFormValues>({
    resolver: zodResolver(rulesSchema),
    defaultValues: {
      rules_page_content: '',
    },
  });

  const fetchRulesContent = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await fetch('/api/admin/site-settings');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Не удалось загрузить контент правил.' }));
        throw new Error(errorData.message);
      }
      const data: SiteSettings = await response.json();
      form.reset({
        rules_page_content: data.rules_page_content || '',
      });
    } catch (error: any) {
      toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
    } finally {
      setIsFetching(false);
    }
  }, [form, toast]);

  useEffect(() => {
    fetchRulesContent();
  }, [fetchRulesContent]);

  const onSubmit = async (data: RulesFormValues) => {
    setIsLoading(true);
    try {
      // Fetch existing site settings to merge
      const existingSettingsRes = await fetch('/api/admin/site-settings');
      if (!existingSettingsRes.ok) throw new Error('Could not fetch existing settings to merge.');
      const existingSettings: SiteSettings = await existingSettingsRes.json();
      
      const payload = { ...existingSettings, rules_page_content: data.rules_page_content };

      const response = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Не удалось сохранить правила.');
      toast({ title: "Правила обновлены", description: "Содержимое страницы правил успешно обновлено." });
      if(result.settings) {
        form.reset({ rules_page_content: result.settings.rules_page_content || '' });
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
        <p className="ml-3 text-muted-foreground">Загрузка редактора правил...</p>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-primary flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Редактор страницы Правил Сайта
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Введите или отредактируйте HTML-содержимое для страницы правил вашего сайта.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="rules_page_content" className="text-foreground">HTML-контент правил</Label>
            <Textarea
              id="rules_page_content"
              {...form.register("rules_page_content")}
              placeholder="<p>Ваши правила сайта здесь...</p> <h3>Заголовок</h3> <ul><li>Пункт 1</li></ul>"
              className="mt-1 min-h-[400px] font-mono text-sm bg-muted/30 border-border"
              disabled={isLoading}
            />
            {form.formState.errors.rules_page_content && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.rules_page_content.message}</p>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isFetching}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить правила
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
