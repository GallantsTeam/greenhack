
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PercentSquare, PlusCircle, Search, Loader2, Edit, Trash2, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';
import type { PromoCode } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function AdminPromoCodesPage() {
  const [activePromoCodes, setActivePromoCodes] = useState<PromoCode[]>([]);
  const [usedPromoCodes, setUsedPromoCodes] = useState<PromoCode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [codeToDelete, setCodeToDelete] = useState<PromoCode | null>(null); 

  const fetchPromoCodes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/promocodes');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch promo codes' }));
        throw new Error(errorData.message || 'Failed to fetch promo codes');
      }
      const data = await response.json();
      setActivePromoCodes(data.activePromoCodes || []);
      setUsedPromoCodes(data.usedOrExpiredPromoCodes || []);
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить промокоды.");
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
      setActivePromoCodes([]);
      setUsedPromoCodes([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  const filteredActiveCodes = activePromoCodes.filter(code =>
    code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (code.product_name && code.product_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const filteredUsedCodes = usedPromoCodes.filter(code =>
    code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (code.product_name && code.product_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatPromoType = (type: PromoCode['type'], value_gh?: number | null, product_name?: string, pricing_option_desc?: string) => {
    if (type === 'balance_gh') return `Баланс: ${value_gh || 0} GH`;
    if (type === 'product') return `Товар: ${product_name || 'Не указан'} ${pricing_option_desc ? `(${pricing_option_desc})` : ''}`;
    return 'Неизвестный тип';
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Бессрочно';
    return new Date(dateString).toLocaleDateString('ru-RU', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleEditPromoCode = (promoCodeId: number) => {
    router.push(`/admin/promocodes/${promoCodeId}/edit`);
  };

  const handleViewPromoCode = (promoCodeId: number) => {
    router.push(`/admin/promocodes/${promoCodeId}/view`);
  };
  
  const handleDeletePromoCode = async () => {
    if (!codeToDelete || !codeToDelete.id) return;
    // TODO: Implement API call to delete promo code
    toast({ title: "Удаление в разработке", description: `Удаление промокода ${codeToDelete.code} будет доступно позже.` });
    setCodeToDelete(null);
    // fetchPromoCodes(); // Refresh list after deletion
  };


  const renderTable = (codes: PromoCode[], tabName: string) => {
    if (isLoading) return <div className="flex justify-center items-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Загрузка...</p></div>;
    if (error && codes.length === 0) return <div className="text-center py-8 text-destructive"><AlertTriangle className="mx-auto h-8 w-8 mb-2" /><p>{error}</p></div>;
    if (codes.length === 0) return <p className="text-muted-foreground text-center py-8">Нет {tabName.toLowerCase()} промокодов{searchTerm && ` по запросу "${searchTerm}"`}.</p>;

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-primary">Код</TableHead>
            <TableHead className="text-primary">Тип/Награда</TableHead>
            <TableHead className="text-primary text-center">Исп./Макс.</TableHead>
            <TableHead className="text-primary">Истекает</TableHead>
            <TableHead className="text-primary text-center">Активен</TableHead>
            <TableHead className="text-center text-primary">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {codes.map((code) => (
            <TableRow key={code.id} className="hover:bg-muted/30">
              <TableCell className="font-mono text-foreground/90">{code.code}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{formatPromoType(code.type, code.value_gh, code.product_name, code.pricing_option_description)}</TableCell>
              <TableCell className="text-center text-xs text-muted-foreground">{code.current_uses} / {code.max_uses}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{formatDate(code.expires_at)}</TableCell>
              <TableCell className="text-center">
                {code.is_active ? <CheckCircle className="h-5 w-5 text-primary mx-auto" /> : <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center space-x-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleViewPromoCode(code.id!)}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Просмотр</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEditPromoCode(code.id!)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Редактировать</span>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => setCodeToDelete(code)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Удалить</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                            <AlertDialogDescription>
                            Это действие нельзя отменить. Промокод "{codeToDelete?.code}" будет удален.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setCodeToDelete(null)}>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeletePromoCode} className="bg-destructive hover:bg-destructive/90">Удалить</AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center">
              <PercentSquare className="mr-2 h-6 w-6" />
              Управление Промокодами
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Создание, просмотр и управление промокодами.
            </CardDescription>
          </div>
          <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10">
            <Link href="/admin/promocodes/add">
              <PlusCircle className="mr-2 h-4 w-4" />
              Создать промокод
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск по коду или названию товара..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full md:w-1/3 bg-background focus:border-primary"
              />
            </div>
          </div>
          <Tabs defaultValue="active">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="active">Активные</TabsTrigger>
              <TabsTrigger value="used">Использованные/Истекшие</TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              {renderTable(filteredActiveCodes, "активных")}
            </TabsContent>
            <TabsContent value="used">
              {renderTable(filteredUsedCodes, "использованных/истекших")}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
