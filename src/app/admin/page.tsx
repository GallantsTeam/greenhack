
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Package, CreditCard, ShieldAlert, Loader2, AlertTriangle, History } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import type { AdminStats, BalanceTransaction } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState<string | null>(null);
  
  const [recentTransactions, setRecentTransactions] = useState<BalanceTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [errorTransactions, setErrorTransactions] = useState<string | null>(null);
  
  const { toast } = useToast();

  const fetchStats = useCallback(async () => {
    console.log("[AdminDashboard] Fetching stats...");
    setLoadingStats(true);
    setErrorStats(null);
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({message: 'Failed to fetch admin statistics'}));
        console.error("[AdminDashboard] API error response for stats:", errorData);
        throw new Error(errorData.message || 'Failed to fetch admin statistics');
      }
      const data: AdminStats = await response.json();
      console.log("[AdminDashboard] Received stats:", data);
      setStats(data);
    } catch (error: any) {
      console.error("[AdminDashboard] Error fetching admin stats:", error);
      setErrorStats(error.message || "Не удалось загрузить статистику.");
      setStats({ totalUsers: 0, totalProducts: 0, monthlySalesGh: 0, openTickets: 0 }); 
      toast({
        title: "Ошибка загрузки статистики",
        description: error.message || "Не удалось получить данные для дашборда.",
        variant: "destructive",
      });
    } finally {
      setLoadingStats(false);
      console.log("[AdminDashboard] Finished fetching stats.");
    }
  }, [toast]);

  const fetchRecentTransactions = useCallback(async () => {
    console.log("[AdminDashboard] Fetching recent transactions...");
    setLoadingTransactions(true);
    setErrorTransactions(null);
    try {
      const response = await fetch('/api/admin/recent-transactions');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({message: 'Failed to fetch recent transactions'}));
        console.error("[AdminDashboard] API error response for transactions:", errorData);
        throw new Error(errorData.message || 'Failed to fetch recent transactions');
      }
      const data: BalanceTransaction[] = await response.json();
      console.log("[AdminDashboard] Received recent transactions:", data);
      setRecentTransactions(data);
    } catch (error: any) {
      console.error("[AdminDashboard] Error fetching recent transactions:", error);
      setErrorTransactions(error.message || "Не удалось загрузить последние транзакции.");
      setRecentTransactions([]);
      toast({
        title: "Ошибка загрузки транзакций",
        description: error.message || "Не удалось получить последние транзакции.",
        variant: "destructive",
      });
    } finally {
      setLoadingTransactions(false);
      console.log("[AdminDashboard] Finished fetching recent transactions.");
    }
  }, [toast]);

  useEffect(() => {
    fetchStats();
    fetchRecentTransactions();
  }, [fetchStats, fetchRecentTransactions]);

  const StatCard = ({ title, value, icon: Icon, unit, isLoadingOverride }: { title: string, value: string | number, icon: React.ElementType, unit?: string, isLoadingOverride?: boolean }) => {
    const displayLoading = isLoadingOverride === undefined ? loadingStats : isLoadingOverride;
    return (
        <Card className="shadow-lg bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <Icon className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {displayLoading ? (
                 <div className="h-7 w-20 bg-muted rounded animate-pulse"></div>
            ) : (
                <div className="text-2xl font-bold text-foreground">
                    {value} {unit && <span className="text-sm font-normal text-muted-foreground">{unit}</span>}
                </div>
            )}
          </CardContent>
        </Card>
    );
  }

  const formatTransactionType = (type: BalanceTransaction['transaction_type']): string => {
    switch (type) {
      case 'deposit': return 'Пополнение';
      case 'purchase_product': return 'Покупка';
      case 'open_case': return 'Кейс';
      case 'sell_prize': return 'Продажа';
      case 'referral_bonus': return 'Реф. бонус';
      case 'admin_adjustment': return 'Админ. коррекция';
      default: return type;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short'});
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary tracking-tight">Админ Панель</h1>
      
      {errorStats && !loadingStats && ( 
        <Card className="shadow-md bg-destructive/10 border-destructive/30">
            <CardHeader className="flex flex-row items-center space-x-3 space-y-0 pb-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle className="text-destructive text-lg">Ошибка загрузки статистики</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-destructive/90">{errorStats}</p>
                <Button onClick={fetchStats} variant="destructive" size="sm" className="mt-2">Попробовать снова</Button>
            </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Всего Пользователей" value={stats?.totalUsers ?? (errorStats ? 'N/A' : 0)} icon={Users} />
        <StatCard title="Товаров в Каталоге" value={stats?.totalProducts ?? (errorStats ? 'N/A' : 0)} icon={Package} />
        <StatCard title="Продаж за Месяц" value={stats?.monthlySalesGh.toFixed(2) ?? (errorStats ? 'N/A' : '0.00')} icon={CreditCard} unit="GH"/>
        <StatCard title="Активные Тикеты" value={stats?.openTickets ?? (errorStats ? 'N/A' : 0)} icon={ShieldAlert} />
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center">
            <History className="mr-2 h-5 w-5"/>
            Последние транзакции
          </CardTitle>
          <CardDescription>Последние 10 пополнений баланса (включая промокоды и реф. бонусы).</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
            <div className="flex justify-center items-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Загрузка транзакций...</p>
            </div>
          ) : errorTransactions ? (
            <div className="text-center py-6 text-destructive">
                <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                <p className="font-semibold">Не удалось загрузить транзакции</p>
                <p className="text-sm">{errorTransactions}</p>
                <Button onClick={fetchRecentTransactions} variant="destructive" size="sm" className="mt-2">Попробовать снова</Button>
            </div>
          ) : recentTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-primary text-xs hidden sm:table-cell">Пользователь</TableHead>
                  <TableHead className="text-primary text-xs">Тип</TableHead>
                  <TableHead className="text-right text-primary text-xs">Сумма (GH)</TableHead>
                  <TableHead className="text-primary text-xs">Дата</TableHead>
                  <TableHead className="text-primary text-xs hidden md:table-cell">Описание</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-foreground/90 text-xs hidden sm:table-cell">{tx.user_username || `ID: ${tx.user_id}`}</TableCell>
                    <TableCell className="text-foreground/90 text-xs">{formatTransactionType(tx.transaction_type)}</TableCell>
                    <TableCell className={cn(
                      "text-right font-medium text-xs",
                      tx.amount_gh > 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {tx.amount_gh > 0 ? '+' : ''}{tx.amount_gh.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(tx.created_at)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs hidden md:table-cell truncate max-w-[200px]" title={tx.description || '-'}>{tx.description || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-6">Нет недавних транзакций пополнения.</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
