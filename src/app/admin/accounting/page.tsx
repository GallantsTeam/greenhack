
// src/app/admin/accounting/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Gift, ArrowLeftFromLine, Loader2, AlertTriangle } from 'lucide-react'; // Changed ArrowLeftToLine to ArrowLeftFromLine
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BalanceTransaction } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';


interface GroupedTransactions {
    deposits: BalanceTransaction[];
    debits: BalanceTransaction[];
    bonuses: BalanceTransaction[];
    adjustments: BalanceTransaction[];
}

export default function AdminAccountingPage() {
    const [transactions, setTransactions] = useState<GroupedTransactions>({
        deposits: [],
        debits: [],
        bonuses: [],
        adjustments: [],
    });
    const [isLoading, setIsLoading] = useState<Record<keyof GroupedTransactions, boolean>>({
        deposits: true,
        debits: true,
        bonuses: true,
        adjustments: true,
    });
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchTransactions = useCallback(async (typeFilter: keyof GroupedTransactions, apiFilterValue: string) => {
        setIsLoading(prev => ({ ...prev, [typeFilter]: true }));
        setError(null);
        try {
            const response = await fetch(`/api/admin/accounting/transactions?transaction_type_filter=${apiFilterValue}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.message || `Failed to fetch ${typeFilter}`);
            }
            const data: BalanceTransaction[] = await response.json();
            setTransactions(prev => ({ ...prev, [typeFilter]: data }));
        } catch (error: any) {
            console.error(`Error fetching ${typeFilter}:`, error);
            setError(error.message || `Не удалось загрузить ${typeFilter}.`);
            toast({
                title: `Ошибка загрузки ${typeFilter}`,
                description: error.message || `Не удалось получить список ${typeFilter}.`,
                variant: "destructive",
            });
        } finally {
            setIsLoading(prev => ({ ...prev, [typeFilter]: false }));
        }
    }, [toast]);

    const formatTransactionTypeForDisplay = (type: BalanceTransaction['transaction_type']): string => {
        switch (type) {
          case 'deposit': return 'Пополнение';
          case 'purchase_product': return 'Покупка товара';
          case 'open_case': return 'Открытие кейса';
          case 'sell_prize': return 'Продажа приза';
          case 'referral_bonus': return 'Реферальный бонус';
          case 'admin_adjustment': return 'Коррекция (Админ)';
          default: return type;
        }
    };
    
    const formatPurchaseDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('ru-RU', {
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const renderTransactionTable = (data: BalanceTransaction[], type: keyof GroupedTransactions) => {
        if (isLoading[type]) {
            return <div className="flex justify-center items-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Загрузка...</p></div>;
        }
        if (error && transactions[type].length === 0) { // Show error only if no data for this specific tab due to error
            return <div className="text-center py-8 text-destructive"><AlertTriangle className="mx-auto h-8 w-8 mb-2" /><p>{error}</p></div>;
        }
        if (transactions[type].length === 0) {
            return <p className="text-muted-foreground text-center py-8">Нет транзакций этого типа.</p>;
        }
        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-primary">ID</TableHead>
                        <TableHead className="text-primary">Пользователь</TableHead>
                        <TableHead className="text-primary">Дата</TableHead>
                        <TableHead className="text-primary">Тип</TableHead>
                        <TableHead className="text-right text-primary">Сумма (GH)</TableHead>
                        <TableHead className="text-primary">Описание</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((tx) => (
                        <TableRow key={tx.id}>
                            <TableCell className="font-medium text-foreground/90 text-xs">{tx.id}</TableCell>
                            <TableCell className="text-foreground/90 text-xs">{tx.user_username || `User ID: ${tx.user_id}`}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{formatPurchaseDate(tx.created_at)}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{formatTransactionTypeForDisplay(tx.transaction_type)}</TableCell>
                            <TableCell className={cn("text-right font-medium text-xs", tx.amount_gh > 0 ? 'text-green-500' : 'text-red-500')}>
                                {tx.amount_gh > 0 ? '+' : ''}{tx.amount_gh.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">{tx.description || '-'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };


  return (
    <div className="space-y-6">
       <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary flex items-center">
                <DollarSign className="mr-2 h-6 w-6" />
                Бухгалтерия
            </CardTitle>
            <CardDescription className="text-muted-foreground">
                Обзор всех финансовых транзакций на платформе.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="deposits" onValueChange={(value) => {
                 if (value === 'deposits') fetchTransactions('deposits', 'deposit');
                 else if (value === 'debits') fetchTransactions('debits', 'debit');
                 else if (value === 'bonuses') fetchTransactions('bonuses', 'bonus');
                 else if (value === 'adjustments') fetchTransactions('adjustments', 'adjustment');
            }}>
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
                    <TabsTrigger value="deposits" className="text-xs md:text-sm" onClick={() => fetchTransactions('deposits', 'deposit')}>Пополнения</TabsTrigger>
                    <TabsTrigger value="debits" className="text-xs md:text-sm" onClick={() => fetchTransactions('debits', 'debit')}>Списания</TabsTrigger>
                    <TabsTrigger value="bonuses" className="text-xs md:text-sm" onClick={() => fetchTransactions('bonuses', 'bonus')}>Бонусы</TabsTrigger>
                    <TabsTrigger value="adjustments" className="text-xs md:text-sm" onClick={() => fetchTransactions('adjustments', 'adjustment')}>Возвраты/Коррекции</TabsTrigger>
                </TabsList>
                <TabsContent value="deposits">
                    <Card>
                        <CardHeader><CardTitle className="text-lg text-primary flex items-center"><TrendingUp className="mr-2 h-5 w-5"/> Пополнения</CardTitle></CardHeader>
                        <CardContent>{renderTransactionTable(transactions.deposits, 'deposits')}</CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="debits">
                    <Card>
                        <CardHeader><CardTitle className="text-lg text-primary flex items-center"><TrendingDown className="mr-2 h-5 w-5"/>Списания</CardTitle></CardHeader>
                        <CardContent>{renderTransactionTable(transactions.debits, 'debits')}</CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="bonuses">
                    <Card>
                        <CardHeader><CardTitle className="text-lg text-primary flex items-center"><Gift className="mr-2 h-5 w-5"/>Бонусы</CardTitle></CardHeader>
                         <CardContent>{renderTransactionTable(transactions.bonuses, 'bonuses')}</CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="adjustments">
                    <Card>
                        <CardHeader><CardTitle className="text-lg text-primary flex items-center"><ArrowLeftFromLine className="mr-2 h-5 w-5"/>Возвраты и Коррекции</CardTitle></CardHeader>
                        <CardContent>{renderTransactionTable(transactions.adjustments, 'adjustments')}</CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
