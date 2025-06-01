
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Palette, Tag, ImageIcon as ImageIconLucide, FileText, DollarSign, CheckSquare, EditIcon, ListChecksIcon, Gift, Trash2, PlusCircle, Flame, Timer, Settings } from 'lucide-react';
import type { CaseItem, Prize, Product, CaseBoostOptionConfig } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { defaultBoostOptions } from '@/lib/case-data';
import { v4 as uuidv4 } from 'uuid';

const prizeSchema = z.object({
  id: z.string().optional(), // DB ID for existing prizes, or temp ID like "new-..."
  name: z.string().min(1, "Название приза обязательно."),
  prize_type: z.enum(['product_duration', 'balance_gh', 'physical_item'], { required_error: "Тип приза обязателен." }),
  related_product_id: z.string().optional().nullable(),
  duration_days: z.coerce.number().min(0, "Длительность не может быть отрицательной.").optional().nullable(),
  balance_gh_amount: z.coerce.number().min(0, "Сумма GH не может быть отрицательной.").optional().nullable(),
  image_url: z.string().url({ message: "Неверный URL изображения." }).optional().or(z.literal('')).nullable(),
  chance: z.coerce.number().min(0, "Шанс должен быть от 0%").max(100, "Шанс должен быть до 100%"),
  sell_value_gh: z.coerce.number().min(0, "Цена продажи не может быть отрицательной.").optional().nullable(),
  data_ai_hint: z.string().optional().nullable(),
}).refine(data => {
  if (data.prize_type === 'product_duration' && (!data.related_product_id || data.duration_days === null || data.duration_days === undefined || data.duration_days <= 0)) {
    return false;
  }
  if (data.prize_type === 'balance_gh' && (data.balance_gh_amount === null || data.balance_gh_amount === undefined || data.balance_gh_amount <= 0)) {
    return false;
  }
  return true;
}, {
  message: "Для типа 'Продукт (срок действия)' нужны ID продукта и длительность > 0. Для 'Баланс GH' нужна сумма > 0.",
  path: ["prize_type"], 
});

const caseBoostOptionConfigSchema = z.object({
  id: z.number().optional(),
  case_id: z.string(),
  boost_ref_id: z.string(),
  label: z.string(),
  is_active_for_case: z.boolean().default(true),
  override_cost_gh: z.coerce.number().min(0).nullable().optional(),
  override_chance_multiplier: z.coerce.number().min(0).nullable().optional(),
  override_description: z.string().nullable().optional(),
});

const caseEditSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "Название должно быть не менее 3 символов."),
  image_url: z.string().url({ message: "Неверный URL изображения." }).optional().or(z.literal('')).nullable(),
  base_price_gh: z.coerce.number().min(0, "Цена не может быть отрицательной."),
  description: z.string().optional().nullable(),
  data_ai_hint: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  is_hot_offer: z.boolean().default(false),
  timer_enabled: z.boolean().default(false),
  timer_ends_at: z.string().nullable().optional(),
  prizes: z.array(prizeSchema).optional().default([]),
  boost_options_config: z.array(caseBoostOptionConfigSchema).optional().default([]),
}).refine(data => !data.timer_enabled || (data.timer_ends_at && data.timer_ends_at.length > 0), {
  message: "Укажите время окончания, если таймер включен.",
  path: ["timer_ends_at"],
});

type CaseEditFormValues = z.infer<typeof caseEditSchema>;

export default function EditCasePage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const caseId = params.caseId as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  const form = useForm<CaseEditFormValues>({
    resolver: zodResolver(caseEditSchema),
    defaultValues: {
      id: caseId,
      name: '',
      image_url: '',
      base_price_gh: 0,
      description: '',
      data_ai_hint: '',
      is_active: true,
      is_hot_offer: false,
      timer_enabled: false,
      timer_ends_at: null,
      prizes: [],
      boost_options_config: [],
    },
  });

  const { fields: prizeFields, append: appendPrize, remove: removePrize } = useFieldArray({
    control: form.control,
    name: "prizes",
  });

  const { fields: boostConfigFields, replace: replaceBoostConfigs } = useFieldArray({
    control: form.control,
    name: "boost_options_config",
  });

  const fetchCaseAndProductData = useCallback(async (id: string) => {
    setIsDataLoading(true);
    try {
      const [caseResponse, productsResponse] = await Promise.all([
        fetch(`/api/cases/${id}`), // Fetch case details including prizes and boost configs
        fetch('/api/admin/products') // Fetch all products for prize selection
      ]);

      if (!caseResponse.ok) {
        const errorData = await caseResponse.json().catch(() => ({ message: 'Failed to fetch case data' }));
        throw new Error(errorData.message);
      }
      const fetchedCaseData: CaseItem = await caseResponse.json();

      if (!productsResponse.ok) {
        const errorData = await productsResponse.json().catch(() => ({ message: 'Failed to fetch products' }));
        throw new Error(errorData.message);
      }
      const productsData: Product[] = await productsResponse.json();
      setProducts(productsData);

      let formattedTimerEndsAt: string | null = null;
      if (fetchedCaseData.timer_enabled && fetchedCaseData.timer_ends_at) {
        try {
          const dateObj = new Date(fetchedCaseData.timer_ends_at);
          if (!isNaN(dateObj.getTime())) {
            formattedTimerEndsAt = format(dateObj, "yyyy-MM-dd'T'HH:mm");
          }
        } catch (e) { console.warn("Error formatting timer_ends_at from DB:", fetchedCaseData.timer_ends_at, e); }
      }
      
      const initialBoostConfigs: CaseBoostOptionConfig[] = defaultBoostOptions
        .filter(opt => opt.id !== 'no-boost') 
        .map(defaultBoost => {
            const existingConfig = fetchedCaseData.boost_options_config?.find(cfg => cfg.boost_ref_id === defaultBoost.id);
            return {
                id: existingConfig?.id, // This might be undefined if new
                case_id: id,
                boost_ref_id: defaultBoost.id,
                label: existingConfig?.label || defaultBoost.label,
                is_active_for_case: existingConfig ? existingConfig.is_active_for_case : true, // Default to true if no saved config for this boost_ref_id
                override_cost_gh: existingConfig?.override_cost_gh,
                override_chance_multiplier: existingConfig?.override_chance_multiplier,
                override_description: existingConfig?.override_description,
            };
        });

      form.reset({
        id: fetchedCaseData.id,
        name: fetchedCaseData.name,
        image_url: fetchedCaseData.image_url || '',
        base_price_gh: fetchedCaseData.base_price_gh,
        description: fetchedCaseData.description || '',
        data_ai_hint: fetchedCaseData.data_ai_hint || '',
        is_active: fetchedCaseData.is_active === undefined ? true : fetchedCaseData.is_active,
        is_hot_offer: fetchedCaseData.is_hot_offer || false,
        timer_enabled: fetchedCaseData.timer_enabled || false,
        timer_ends_at: formattedTimerEndsAt,
        prizes: fetchedCaseData.prizes?.map(p => ({
          id: p.id, // This is the DB ID of the case_prizes entry
          name: p.name,
          prize_type: p.prize_type,
          related_product_id: p.related_product_id || null,
          duration_days: p.duration_days || null,
          balance_gh_amount: p.balance_gh_amount || null,
          image_url: p.image_url || '',
          chance: p.chance * 100, // Convert DB (0.0-1.0) to form (0-100)
          sell_value_gh: p.sell_value_gh || null,
          data_ai_hint: p.data_ai_hint || '',
        })) || [],
        boost_options_config: initialBoostConfigs,
      });
      replaceBoostConfigs(initialBoostConfigs); 

    } catch (error: any) {
      console.error("Error fetching case data or products:", error);
      toast({ title: "Ошибка", description: `Не удалось загрузить данные: ${error.message}`, variant: "destructive" });
      router.push('/admin/cases');
    } finally {
      setIsDataLoading(false);
    }
  }, [toast, form, router, replaceBoostConfigs]);

  useEffect(() => {
    if (caseId) {
      fetchCaseAndProductData(caseId);
    }
  }, [caseId, fetchCaseAndProductData]);

  const onSubmit = async (data: CaseEditFormValues) => {
    if (!caseId) return;
    setIsLoading(true);
    try {
      let dbTimerEndsAt: string | null = null;
      if (data.timer_enabled && data.timer_ends_at) {
          try {
              dbTimerEndsAt = new Date(data.timer_ends_at).toISOString().slice(0, 19).replace('T', ' ');
          } catch (e) {
              console.warn("Invalid date format for timer_ends_at on submit:", data.timer_ends_at);
          }
      } else if (!data.timer_enabled) {
          dbTimerEndsAt = null; 
      }

      const payload = {
        ...data,
        timer_ends_at: dbTimerEndsAt,
        prizes: data.prizes?.map(p => ({
          ...p,
          id: p.id && !p.id.startsWith('new-') ? p.id : undefined, // Send existing ID, or undefined for new prizes
          duration_days: p.prize_type === 'product_duration' ? (p.duration_days ? Number(p.duration_days) : null) : null,
          balance_gh_amount: p.prize_type === 'balance_gh' ? (p.balance_gh_amount ? Number(p.balance_gh_amount) : null) : null,
          sell_value_gh: p.sell_value_gh ? Number(p.sell_value_gh) : null,
          chance: Number(p.chance) / 100, // Convert form (0-100) to DB (0.0-1.0)
        })),
        boost_options_config: data.boost_options_config?.map(boc => ({
          ...boc,
          override_cost_gh: boc.override_cost_gh === null || boc.override_cost_gh === undefined || boc.override_cost_gh === '' ? null : Number(boc.override_cost_gh),
          override_chance_multiplier: boc.override_chance_multiplier === null || boc.override_chance_multiplier === undefined || boc.override_chance_multiplier === '' ? null : Number(boc.override_chance_multiplier),
        }))
      };

      const response = await fetch(`/api/admin/cases/${caseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Не удалось обновить кейс.');
      }
      toast({
        title: "Кейс обновлен",
        description: `Кейс "${data.name}" был успешно обновлен.`,
      });
      router.push('/admin/cases');
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Произошла ошибка при обновлении кейса.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Загрузка данных кейса...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary flex items-center">
          <EditIcon className="mr-2 h-6 w-6" />
          Редактировать кейс: {form.getValues("name")}
        </h1>
        <Button onClick={() => router.push('/admin/cases')} variant="outline" className="border-primary text-primary hover:bg-primary/10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          К списку кейсов
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="general"><ListChecksIcon className="mr-1.5 h-4 w-4" />Общие</TabsTrigger>
                <TabsTrigger value="prizes"><Gift className="mr-1.5 h-4 w-4" />Призы</TabsTrigger>
                <TabsTrigger value="boosts"><Settings className="mr-1.5 h-4 w-4" />Бусты</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                 <CardHeader className="px-0 py-2">
                  <CardTitle className="text-xl text-foreground">Основная информация</CardTitle>
                </CardHeader>
                <div>
                  <Label htmlFor="edit-case-id" className="text-foreground">ID Кейса (нередактируемый)</Label>
                  <Input id="edit-case-id" value={caseId} className="mt-1 bg-muted" disabled />
                </div>
                <div>
                  <Label htmlFor="edit-case-name" className="text-foreground">Название кейса</Label>
                  <Input id="edit-case-name" {...form.register("name")} placeholder="Супер кейс" className="mt-1" disabled={isLoading} />
                  {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-case-base_price_gh" className="text-foreground">Базовая цена (GH)</Label>
                  <Input id="edit-case-base_price_gh" type="number" step="0.01" {...form.register("base_price_gh")} placeholder="100.00" className="mt-1" disabled={isLoading} />
                  {form.formState.errors.base_price_gh && <p className="text-sm text-destructive mt-1">{form.formState.errors.base_price_gh.message}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-case-image_url" className="text-foreground">URL изображения</Label>
                  <Input id="edit-case-image_url" {...form.register("image_url")} placeholder="https://example.com/case.png" className="mt-1" disabled={isLoading} />
                  {form.formState.errors.image_url && <p className="text-sm text-destructive mt-1">{form.formState.errors.image_url.message}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-case-description" className="text-foreground">Описание</Label>
                  <Textarea id="edit-case-description" {...form.register("description")} placeholder="Описание кейса..." className="mt-1 min-h-[80px]" disabled={isLoading} />
                </div>
                <div>
                  <Label htmlFor="edit-case-data_ai_hint" className="text-foreground">Подсказка для AI (изображение)</Label>
                  <Input id="edit-case-data_ai_hint" {...form.register("data_ai_hint")} placeholder="gold chest" className="mt-1" disabled={isLoading} />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Controller
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <Checkbox id="edit-case-is_active" checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                    )}
                  />
                  <Label htmlFor="edit-case-is_active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                    Кейс активен
                  </Label>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Controller
                      control={form.control}
                      name="is_hot_offer"
                      render={({ field }) => (
                          <Checkbox id="edit-case-is_hot_offer" checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                      )}
                  />
                  <Label htmlFor="edit-case-is_hot_offer" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground flex items-center">
                      <Flame className="mr-2 h-4 w-4 text-orange-500"/> Горячее предложение
                  </Label>
                </div>
                 <div className="space-y-2 pt-2 border-t border-border/30">
                    <div className="flex items-center space-x-2">
                        <Controller
                            control={form.control}
                            name="timer_enabled"
                            render={({ field }) => (
                                <Checkbox id="edit-case-timer_enabled" checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                            )}
                        />
                        <Label htmlFor="edit-case-timer_enabled" className="text-sm font-medium leading-none text-foreground flex items-center">
                            <Timer className="mr-2 h-4 w-4 text-primary/80"/>Включить таймер для кейса
                        </Label>
                    </div>
                    {form.watch("timer_enabled") && (
                        <div>
                            <Label htmlFor="edit-case-timer_ends_at" className="text-foreground">Время окончания таймера</Label>
                            <Input 
                                id="edit-case-timer_ends_at" 
                                type="datetime-local" 
                                {...form.register("timer_ends_at")} 
                                className="mt-1" 
                                disabled={isLoading || !form.watch("timer_enabled")} 
                            />
                            {form.formState.errors.timer_ends_at && <p className="text-sm text-destructive mt-1">{form.formState.errors.timer_ends_at.message}</p>}
                        </div>
                    )}
                </div>
              </TabsContent>

              <TabsContent value="prizes" className="space-y-4">
                <CardHeader className="px-0 py-2 flex flex-row justify-between items-center">
                  <CardTitle className="text-xl text-foreground">Призы в кейсе</CardTitle>
                  <Button type="button" size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10" onClick={() => appendPrize({ id: `new-${uuidv4()}`, name: '', prize_type: 'product_duration', chance: 10, sell_value_gh: 0, related_product_id: null, duration_days: null, balance_gh_amount: null, image_url: '', data_ai_hint: '' })} disabled={isLoading}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Добавить приз
                  </Button>
                </CardHeader>
                {prizeFields.length === 0 && <p className="text-muted-foreground text-sm">В этом кейсе еще нет призов.</p>}
                {prizeFields.map((field, index) => (
                  <Card key={field.id} className="p-4 border-border/50 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <Label htmlFor={`prizes.${index}.name`} className="text-xs text-muted-foreground">Название приза</Label>
                        <Input {...form.register(`prizes.${index}.name`)} placeholder="Название приза" className="mt-1 h-9" disabled={isLoading} />
                        {form.formState.errors.prizes?.[index]?.name && <p className="text-xs text-destructive mt-1">{form.formState.errors.prizes[index]?.name?.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor={`prizes.${index}.prize_type`} className="text-xs text-muted-foreground">Тип приза</Label>
                        <Controller
                          control={form.control}
                          name={`prizes.${index}.prize_type`}
                          render={({ field: controllerField }) => (
                            <Select onValueChange={(value) => {
                              controllerField.onChange(value);
                              if (value === 'product_duration') {
                                form.setValue(`prizes.${index}.balance_gh_amount`, null);
                              } else if (value === 'balance_gh') {
                                form.setValue(`prizes.${index}.related_product_id`, null);
                                form.setValue(`prizes.${index}.duration_days`, null);
                              }
                            }} value={controllerField.value} disabled={isLoading}>
                              <SelectTrigger className="w-full mt-1 h-9">
                                <SelectValue placeholder="Выберите тип" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="product_duration">Продукт (срок)</SelectItem>
                                <SelectItem value="balance_gh">Баланс GH</SelectItem>
                                <SelectItem value="physical_item" disabled>Физический товар (скоро)</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {form.formState.errors.prizes?.[index]?.prize_type && <p className="text-xs text-destructive mt-1">{form.formState.errors.prizes[index]?.prize_type?.message}</p>}
                      </div>
                    </div>
                    {form.watch(`prizes.${index}.prize_type`) === 'product_duration' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <Label htmlFor={`prizes.${index}.related_product_id`} className="text-xs text-muted-foreground">Продукт</Label>
                          <Controller
                            control={form.control}
                            name={`prizes.${index}.related_product_id`}
                            render={({ field: controllerField }) => (
                              <Select onValueChange={controllerField.onChange} value={controllerField.value || ""} disabled={isLoading || products.length === 0}>
                                <SelectTrigger className="w-full mt-1 h-9">
                                  <SelectValue placeholder={products.length === 0 ? "Нет продуктов" : "Выберите продукт"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            )}
                          />
                           {form.formState.errors.prizes?.[index]?.related_product_id && <p className="text-xs text-destructive mt-1">{form.formState.errors.prizes[index]?.related_product_id?.message}</p>}
                        </div>
                        <div>
                          <Label htmlFor={`prizes.${index}.duration_days`} className="text-xs text-muted-foreground">Длительность (дни)</Label>
                          <Input type="number" {...form.register(`prizes.${index}.duration_days`)} placeholder="7" className="mt-1 h-9" disabled={isLoading} />
                          {form.formState.errors.prizes?.[index]?.duration_days && <p className="text-xs text-destructive mt-1">{form.formState.errors.prizes[index]?.duration_days?.message}</p>}
                        </div>
                      </div>
                    )}
                    {form.watch(`prizes.${index}.prize_type`) === 'balance_gh' && (
                      <div className="mb-3">
                        <Label htmlFor={`prizes.${index}.balance_gh_amount`} className="text-xs text-muted-foreground">Сумма GH</Label>
                        <Input type="number" step="0.01" {...form.register(`prizes.${index}.balance_gh_amount`)} placeholder="50.00" className="mt-1 h-9" disabled={isLoading} />
                        {form.formState.errors.prizes?.[index]?.balance_gh_amount && <p className="text-xs text-destructive mt-1">{form.formState.errors.prizes[index]?.balance_gh_amount?.message}</p>}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <Label htmlFor={`prizes.${index}.image_url`} className="text-xs text-muted-foreground">URL изображения приза</Label>
                        <Input {...form.register(`prizes.${index}.image_url`)} placeholder="https://..." className="mt-1 h-9" disabled={isLoading} />
                        {form.formState.errors.prizes?.[index]?.image_url && <p className="text-xs text-destructive mt-1">{form.formState.errors.prizes[index]?.image_url?.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor={`prizes.${index}.chance`} className="text-xs text-muted-foreground">Шанс (0-100%)</Label>
                        <Input type="number" step="0.01" min="0" max="100" {...form.register(`prizes.${index}.chance`)} placeholder="10" className="mt-1 h-9" disabled={isLoading} />
                        {form.formState.errors.prizes?.[index]?.chance && <p className="text-xs text-destructive mt-1">{form.formState.errors.prizes[index]?.chance?.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor={`prizes.${index}.sell_value_gh`} className="text-xs text-muted-foreground">Цена продажи (GH)</Label>
                        <Input type="number" step="0.01" {...form.register(`prizes.${index}.sell_value_gh`)} placeholder="10.00" className="mt-1 h-9" disabled={isLoading} />
                         {form.formState.errors.prizes?.[index]?.sell_value_gh && <p className="text-xs text-destructive mt-1">{form.formState.errors.prizes[index]?.sell_value_gh?.message}</p>}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`prizes.${index}.data_ai_hint`} className="text-xs text-muted-foreground">AI подсказка (изображение)</Label>
                      <Input {...form.register(`prizes.${index}.data_ai_hint`)} placeholder="gold coin" className="mt-1 h-9" disabled={isLoading} />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button type="button" variant="ghost" size="sm" onClick={() => removePrize(index)} className="text-destructive hover:bg-destructive/10 h-8" disabled={isLoading}>
                        <Trash2 className="mr-1 h-4 w-4" /> Удалить приз
                      </Button>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="boosts" className="space-y-4">
                <CardHeader className="px-0 py-2">
                  <CardTitle className="text-xl text-foreground">Настройка Бустов для Кейса</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Включите или выключите бусты для этого кейса и, при необходимости, переопределите их стандартные значения.
                    Если поля для переопределения оставить пустыми, будут использованы значения по умолчанию.
                  </CardDescription>
                </CardHeader>
                {boostConfigFields.map((field, index) => (
                  <Card key={field.id} className="p-4 border-border/50 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <Label htmlFor={`boost_options_config.${index}.is_active_for_case`} className="text-sm font-medium text-foreground flex items-center gap-2">
                             <Controller
                                name={`boost_options_config.${index}.is_active_for_case`}
                                control={form.control}
                                render={({ field: checkboxField }) => (
                                    <Checkbox
                                    id={`boost_options_config.${index}.is_active_for_case`}
                                    checked={checkboxField.value}
                                    onCheckedChange={checkboxField.onChange}
                                    disabled={isLoading}
                                    />
                                )}
                            />
                           {field.label}
                        </Label>
                        <span className="text-xs text-muted-foreground">Ref ID: {field.boost_ref_id}</span>
                    </div>
                    {form.watch(`boost_options_config.${index}.is_active_for_case`) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <Label htmlFor={`boost_options_config.${index}.override_cost_gh`} className="text-xs text-muted-foreground">Новая цена (GH)</Label>
                                <Input 
                                    type="number" step="0.01" 
                                    {...form.register(`boost_options_config.${index}.override_cost_gh`)} 
                                    placeholder={`Стандарт: ${defaultBoostOptions.find(b => b.id === field.boost_ref_id)?.cost ?? 'N/A'}`}
                                    className="mt-1 h-9" disabled={isLoading} 
                                />
                            </div>
                            <div>
                                <Label htmlFor={`boost_options_config.${index}.override_chance_multiplier`} className="text-xs text-muted-foreground">Новый множитель шанса</Label>
                                <Input 
                                    type="number" step="0.01" 
                                    {...form.register(`boost_options_config.${index}.override_chance_multiplier`)} 
                                    placeholder={`Стандарт: ${defaultBoostOptions.find(b => b.id === field.boost_ref_id)?.chanceMultiplier ?? 'N/A'}`}
                                    className="mt-1 h-9" disabled={isLoading} 
                                />
                            </div>
                        </div>
                    )}
                  </Card>
                ))}
              </TabsContent>

            </Tabs>
            <div className="flex justify-end pt-6 border-t border-border/50">
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isDataLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

