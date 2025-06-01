
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Palette, Tag, ImageIcon as ImageIconLucide, FileText, DollarSign, CheckSquare, Flame, Timer } from 'lucide-react';

const caseAddSchema = z.object({
  id: z.string().min(3, "ID кейса должен быть не менее 3 символов.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "ID может содержать только строчные буквы, цифры и дефисы."),
  name: z.string().min(3, "Название должно быть не менее 3 символов."),
  image_url: z.string().url({ message: "Неверный URL изображения." }).optional().or(z.literal('')),
  base_price_gh: z.coerce.number().min(0, "Цена не может быть отрицательной."),
  description: z.string().optional().nullable(),
  data_ai_hint: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  is_hot_offer: z.boolean().default(false),
  timer_enabled: z.boolean().default(false),
  timer_ends_at: z.string().nullable().optional(),
}).refine(data => !data.timer_enabled || (data.timer_ends_at && data.timer_ends_at.length > 0), {
    message: "Укажите время окончания, если таймер включен.",
    path: ["timer_ends_at"],
});

type CaseAddFormValues = z.infer<typeof caseAddSchema>;

export default function AddCasePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CaseAddFormValues>({
    resolver: zodResolver(caseAddSchema),
    defaultValues: {
      id: '',
      name: '',
      image_url: '',
      base_price_gh: 0,
      description: '',
      data_ai_hint: '',
      is_active: true,
      is_hot_offer: false,
      timer_enabled: false,
      timer_ends_at: null,
    },
  });

  const onSubmit = async (data: CaseAddFormValues) => {
    setIsLoading(true);
    const payload = {
      ...data,
      timer_ends_at: data.timer_enabled ? data.timer_ends_at : null,
    };

    try {
      const response = await fetch('/api/admin/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Не удалось добавить кейс.');
      }
      toast({
        title: "Кейс добавлен",
        description: `Кейс "${data.name}" был успешно создан. Теперь вы можете добавить призы на странице редактирования.`,
      });
      router.push('/admin/cases');
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Произошла ошибка при добавлении кейса.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary flex items-center">
          <Palette className="mr-2 h-6 w-6" />
          Добавить новый кейс
        </h1>
        <Button onClick={() => router.push('/admin/cases')} variant="outline" className="border-primary text-primary hover:bg-primary/10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          К списку кейсов
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Информация о кейсе</CardTitle>
          <CardDescription className="text-muted-foreground">Заполните детали нового кейса. Призы добавляются на этапе редактирования.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="case-id" className="text-foreground flex items-center"><Tag className="mr-2 h-4 w-4 text-primary/80"/>ID Кейса (уникальный)</Label>
                <Input id="case-id" {...form.register("id")} placeholder="например, main-daily-case" className="mt-1" disabled={isLoading} />
                {form.formState.errors.id && <p className="text-sm text-destructive mt-1">{form.formState.errors.id.message}</p>}
              </div>
              <div>
                <Label htmlFor="case-name" className="text-foreground flex items-center"><FileText className="mr-2 h-4 w-4 text-primary/80"/>Название кейса</Label>
                <Input id="case-name" {...form.register("name")} placeholder="Ежедневный кейс удачи" className="mt-1" disabled={isLoading} />
                {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="case-base_price_gh" className="text-foreground flex items-center"><DollarSign className="mr-2 h-4 w-4 text-primary/80"/>Базовая цена (GH)</Label>
                    <Input id="case-base_price_gh" type="number" step="0.01" {...form.register("base_price_gh")} placeholder="100.00" className="mt-1" disabled={isLoading} />
                    {form.formState.errors.base_price_gh && <p className="text-sm text-destructive mt-1">{form.formState.errors.base_price_gh.message}</p>}
                </div>
                <div>
                    <Label htmlFor="case-image_url" className="text-foreground flex items-center"><ImageIconLucide className="mr-2 h-4 w-4 text-primary/80"/>URL изображения</Label>
                    <Input id="case-image_url" {...form.register("image_url")} placeholder="https://example.com/case-image.png" className="mt-1" disabled={isLoading} />
                    {form.formState.errors.image_url && <p className="text-sm text-destructive mt-1">{form.formState.errors.image_url.message}</p>}
                </div>
            </div>

            <div>
              <Label htmlFor="case-description" className="text-foreground flex items-center"><FileText className="mr-2 h-4 w-4 text-primary/80"/>Описание</Label>
              <Textarea id="case-description" {...form.register("description")} placeholder="Краткое описание кейса..." className="mt-1 min-h-[80px]" disabled={isLoading} />
              {form.formState.errors.description && <p className="text-sm text-destructive mt-1">{form.formState.errors.description.message}</p>}
            </div>

            <div>
              <Label htmlFor="case-data_ai_hint" className="text-foreground flex items-center"><ImageIconLucide className="mr-2 h-4 w-4 text-primary/80"/>Подсказка для AI (для изображения)</Label>
              <Input id="case-data_ai_hint" {...form.register("data_ai_hint")} placeholder="например, treasure box" className="mt-1" disabled={isLoading} />
            </div>
            
            <div className="flex items-center space-x-2">
                <Controller
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                        <Checkbox id="is_active" checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                    )}
                />
              <Label htmlFor="is_active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground flex items-center">
                <CheckSquare className="mr-2 h-4 w-4 text-primary/80"/>Кейс активен
              </Label>
            </div>

            <div className="flex items-center space-x-2">
                <Controller
                    control={form.control}
                    name="is_hot_offer"
                    render={({ field }) => (
                        <Checkbox id="is_hot_offer" checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                    )}
                />
              <Label htmlFor="is_hot_offer" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground flex items-center">
                <Flame className="mr-2 h-4 w-4 text-orange-500"/>Горячее предложение
              </Label>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-border/30">
                <div className="flex items-center space-x-2">
                    <Controller
                        control={form.control}
                        name="timer_enabled"
                        render={({ field }) => (
                            <Checkbox id="timer_enabled" checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                        )}
                    />
                    <Label htmlFor="timer_enabled" className="text-sm font-medium leading-none text-foreground flex items-center">
                        <Timer className="mr-2 h-4 w-4 text-primary/80"/>Включить таймер для кейса
                    </Label>
                </div>
                {form.watch("timer_enabled") && (
                    <div>
                        <Label htmlFor="timer_ends_at" className="text-foreground">Время окончания таймера</Label>
                        <Input 
                            id="timer_ends_at" 
                            type="datetime-local" 
                            {...form.register("timer_ends_at")} 
                            className="mt-1" 
                            disabled={isLoading || !form.watch("timer_enabled")} 
                        />
                        {form.formState.errors.timer_ends_at && <p className="text-sm text-destructive mt-1">{form.formState.errors.timer_ends_at.message}</p>}
                    </div>
                )}
            </div>


            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Добавление...' : 'Добавить кейс'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

    