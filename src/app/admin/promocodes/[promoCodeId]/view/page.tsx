
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, PercentSquare, Gift, DollarSign, CalendarDays, Users, Tag, CheckCircle, XCircle, EditIcon } from 'lucide-react';
import type { PromoCode, User, PromoCodeActivator } from '@/types';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ViewPromoCodePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const promoCodeId = params.promoCodeId as string;

  const [promoCodeData, setPromoCodeData] = useState<PromoCode | null>(null);
  const [activators, setActivators] = useState<PromoCodeActivator[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingActivators, setIsLoadingActivators] = useState(true);

  const fetchPromoCodeDetails = useCallback(async (id: string) => {
    setIsLoadingData(true);
    try {
      const response = await fetch(`/api/admin/promocodes/${id}`);
      if (!response.ok) throw new Error('Failed to fetch promo code details');
      const data: PromoCode = await response.json();
      setPromoCodeData(data);
    } catch (error: any) {
      toast({ title: "Ошибка", description: `Не удалось загрузить детали промокода: ${error.message}`, variant: "destructive" });
      setPromoCodeData(null);
    } finally {
      setIsLoadingData(false);
    }
  }, [toast]);

  const fetchActivators = useCallback(async (id: string) => {
    setIsLoadingActivators(true);
    try {
      const response = await fetch(`/api/admin/promocodes/${id}/users`);
      if (!response.ok) throw new Error('Failed to fetch promo code activators');
      const data: PromoCodeActivator[] = await response.json();
      setActivators(data);
    } catch (error: any) {
      toast({ title: "Ошибка", description: `Не удалось загрузить список активаций: ${error.message}`, variant: "destructive" });
      setActivators([]);
    } finally {
      setIsLoadingActivators(false);
    }
  }, [toast]);

  useEffect(() => {
    if (promoCodeId) {
      fetchPromoCodeDetails(promoCodeId);
      fetchActivators(promoCodeId);
    }
  }, [promoCodeId, fetchPromoCodeDetails, fetchActivators]);

  const formatPromoType = (type?: PromoCode['type'], value_gh?: number | null, product_name?: string, pricing_option_desc?: string) => {
    if (!type) return 'N/A';
    if (type === 'balance_gh') return `Пополнение баланса: ${value_gh || 0} GH`;
    if (type === 'product') return `Товар: ${product_name || 'Не указан'} ${pricing_option_desc ? `(${pricing_option_desc})` : ''}`;
    return 'Неизвестный тип';
  };

  const formatDate = (dateString?: string | null, includeTime = true) => {
    if (!dateString) return 'Бессрочно';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return new Date(dateString).toLocaleString('ru-RU', options);
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Загрузка деталей промокода...</p>
      </div>
    );
  }

  if (!promoCodeData) {
    return (
      <div className="space-y-6 text-center">
        <p className="text-lg text-destructive">Промокод не найден.</p>
        <Button onClick={() => router.push('/admin/promocodes')} variant="outline" className="border-primary text-primary hover:bg-primary/10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          К списку промокодов
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary flex items-center">
          <PercentSquare className="mr-2 h-6 w-6" />
          Промокод: <span className="font-mono ml-2 bg-muted/80 px-2 py-0.5 rounded">{promoCodeData.code}</span>
        </h1>
        <div className="flex gap-2">
            <Button onClick={() => router.push(`/admin/promocodes/${promoCodeId}/edit`)} variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <EditIcon className="mr-2 h-4 w-4" />
                Редактировать
            </Button>
            <Button onClick={() => router.push('/admin/promocodes')} variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <ArrowLeft className="mr-2 h-4 w-4" />
                К списку
            </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Детали промокода</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div>
            <p className="font-medium text-muted-foreground flex items-center"><Tag className="mr-2 h-4 w-4 text-primary/70"/>Код:</p>
            <p className="text-foreground font-mono">{promoCodeData.code}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground flex items-center"><Gift className="mr-2 h-4 w-4 text-primary/70"/>Тип/Награда:</p>
            <p className="text-foreground">{formatPromoType(promoCodeData.type, promoCodeData.value_gh, promoCodeData.product_name, promoCodeData.pricing_option_description)}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground flex items-center"><Users className="mr-2 h-4 w-4 text-primary/70"/>Использований:</p>
            <p className="text-foreground">{promoCodeData.current_uses} / {promoCodeData.max_uses}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary/70"/>Истекает:</p>
            <p className="text-foreground">{formatDate(promoCodeData.expires_at)}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground flex items-center">Статус:</p>
            <div className={cn("flex items-center", promoCodeData.is_active ? "text-primary" : "text-destructive")}>
                {promoCodeData.is_active ? <CheckCircle className="mr-1.5 h-4 w-4"/> : <XCircle className="mr-1.5 h-4 w-4"/>}
                {promoCodeData.is_active ? "Активен" : "Неактивен"}
            </div>
          </div>
          <div>
            <p className="font-medium text-muted-foreground flex items-center">Создан:</p>
            <p className="text-foreground">{formatDate(promoCodeData.created_at)}</p>
          </div>
          {promoCodeData.updated_at && (
            <div>
                <p className="font-medium text-muted-foreground flex items-center">Обновлен:</p>
                <p className="text-foreground">{formatDate(promoCodeData.updated_at)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Кто активировал</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingActivators ? (
             <div className="flex justify-center items-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Загрузка активаций...</p></div>
          ) : activators.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-primary">ID Пользователя</TableHead>
                  <TableHead className="text-primary">Логин</TableHead>
                  <TableHead className="text-primary">Email</TableHead>
                  <TableHead className="text-primary">Дата активации</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activators.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="text-foreground/90">{user.id}</TableCell>
                    <TableCell className="text-foreground/90">{user.username}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(user.used_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">Этот промокод еще никто не активировал.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
