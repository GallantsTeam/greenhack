
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { User, PurchaseHistoryItem, CaseOpeningRecordWithDetails, InventoryItemWithDetails, BalanceTransaction, Referral } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, UserCircle, CalendarDays, Mail, ShieldCheck, DollarSign, History, ShoppingBag, Box, Gem, Users as UsersIcon, ListChecks, LinkIcon as LinkIconLucide } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';

export default function UserDetailsViewPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser: adminUser, loading: adminLoading } = useAuth();
  const { toast } = useToast();

  const userId = params.userId as string;

  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  
  const [balanceTransactions, setBalanceTransactions] = useState<BalanceTransaction[]>([]);
  const [isLoadingBalanceTransactions, setIsLoadingBalanceTransactions] = useState(true);
  
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([]);
  const [isLoadingPurchaseHistory, setIsLoadingPurchaseHistory] = useState(true);
  
  const [caseHistory, setCaseHistory] = useState<CaseOpeningRecordWithDetails[]>([]);
  const [isLoadingCaseHistory, setIsLoadingCaseHistory] = useState(true);

  const [inventory, setInventory] = useState<InventoryItemWithDetails[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  
  const [referralsMade, setReferralsMade] = useState<Referral[]>([]);
  const [isLoadingReferralsMade, setIsLoadingReferralsMade] = useState(true);
  
  const [referredByUser, setReferredByUser] = useState<User | null>(null);
  const [isLoadingReferredBy, setIsLoadingReferredBy] = useState(false);


  useEffect(() => {
    if (!userId) return;
    if (!adminLoading && (!adminUser || adminUser.role !== 'admin')) {
      router.push('/');
      return;
    }

    const fetchAllUserData = async () => {
      setIsLoadingUser(true);
      setIsLoadingBalanceTransactions(true);
      setIsLoadingPurchaseHistory(true);
      setIsLoadingCaseHistory(true);
      setIsLoadingInventory(true);
      setIsLoadingReferralsMade(true);

      try {
        // Fetch User Details
        const userDetailsResponse = await fetch(`/api/user/${userId}/details`);
        if (!userDetailsResponse.ok) throw new Error('Failed to fetch user details');
        const userData = await userDetailsResponse.json();
        const user = userData.user as User;
        setViewedUser(user);
        setIsLoadingUser(false);

        if (user?.referred_by_user_id) {
          setIsLoadingReferredBy(true);
          try {
            const referrerResponse = await fetch(`/api/user/${user.referred_by_user_id}/details`);
            if (referrerResponse.ok) {
              const referrerData = await referrerResponse.json();
              setReferredByUser(referrerData.user);
            }
          } catch (refError) { console.error("Error fetching referrer details:", refError); }
          finally { setIsLoadingReferredBy(false); }
        }

        // Fetch Balance Transactions
        const balanceResponse = await fetch(`/api/user/${userId}/balance-transactions`);
        if (!balanceResponse.ok) throw new Error('Failed to fetch balance transactions');
        setBalanceTransactions(await balanceResponse.json());
        setIsLoadingBalanceTransactions(false);

        // Fetch Purchase History
        const purchaseResponse = await fetch(`/api/user/${userId}/purchase-history`);
        if (!purchaseResponse.ok) throw new Error('Failed to fetch purchase history');
        setPurchaseHistory(await purchaseResponse.json());
        setIsLoadingPurchaseHistory(false);
        
        // Fetch Case History
        const caseHistoryResponse = await fetch(`/api/admin/users/${userId}/case-openings-history`);
        if (!caseHistoryResponse.ok) throw new Error('Failed to fetch case history');
        setCaseHistory(await caseHistoryResponse.json());
        setIsLoadingCaseHistory(false);

        // Fetch Inventory
        const inventoryResponse = await fetch(`/api/user/${userId}/inventory-items`);
        if (!inventoryResponse.ok) throw new Error('Failed to fetch inventory');
        setInventory(await inventoryResponse.json());
        setIsLoadingInventory(false);
        
        // Fetch Referrals Made
        const referralsMadeResponse = await fetch(`/api/user/${userId}/referred-list`);
        if (!referralsMadeResponse.ok) throw new Error('Failed to fetch referred users list');
        setReferralsMade(await referralsMadeResponse.json());
        setIsLoadingReferralsMade(false);

      } catch (error: any) {
        console.error("Error fetching user data for admin view:", error);
        toast({
          title: "Ошибка загрузки данных",
          description: error.message || "Не удалось получить полную информацию о пользователе.",
          variant: "destructive",
        });
        // Set loading states to false to prevent infinite loading spinners on error
        setIsLoadingUser(false);
        setIsLoadingBalanceTransactions(false);
        setIsLoadingPurchaseHistory(false);
        setIsLoadingCaseHistory(false);
        setIsLoadingInventory(false);
        setIsLoadingReferralsMade(false);
      }
    };

    if (userId && adminUser) {
        fetchAllUserData();
    }
  }, [userId, adminUser, adminLoading, router, toast]);
  
  const formatRole = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'booster': return 'Бустер';
      case 'client': return 'Клиент';
      default: return role || 'Неизвестно';
    }
  };
  
  const formatBalance = (balance: number | undefined | null): string => {
    if (typeof balance !== 'number' || balance === null || isNaN(balance)) {
      return '0.00';
    }
    return balance.toFixed(2);
  };

  const formatTransactionType = (type: BalanceTransaction['transaction_type']): string => {
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

  const formatCaseAction = (action: CaseOpeningRecordWithDetails['action_taken']) => {
    switch (action) {
      case 'kept': return 'Оставлен';
      case 'sold': return 'Продан';
      case 'pending': return 'Ожидает';
      default: return action;
    }
  };

  const formatPurchaseDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };


  if (adminLoading || isLoadingUser) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Загрузка данных пользователя...</p>
      </div>
    );
  }

  if (!viewedUser) {
    return (
      <div className="text-center">
        <p className="text-lg text-destructive">Пользователь не найден.</p>
        <Button onClick={() => router.back()} variant="outline" className="mt-4 border-primary text-primary hover:bg-primary/10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к списку
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary tracking-tight">
          Детали пользователя: {viewedUser.username}
        </h1>
        <Button onClick={() => router.push('/admin/users')} variant="outline" className="border-primary text-primary hover:bg-primary/10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          К списку пользователей
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center">
            <UserCircle className="mr-2 h-6 w-6" />
            Основная информация
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
          <div>
            <p className="font-medium text-muted-foreground">ID Пользователя:</p>
            <p className="text-foreground">{viewedUser.id}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Логин:</p>
            <p className="text-foreground">{viewedUser.username}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Email:</p>
            <p className="text-foreground">{viewedUser.email}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Роль:</p>
            <p className="text-foreground">{formatRole(viewedUser.role)}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Баланс:</p>
            <p className="text-foreground font-semibold">{formatBalance(viewedUser.balance)} GH</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Дата регистрации:</p>
            <p className="text-foreground">{viewedUser.created_at ? new Date(viewedUser.created_at).toLocaleString('ru-RU') : 'N/A'}</p>
          </div>
          {viewedUser.referral_code && (
            <div>
              <p className="font-medium text-muted-foreground">Реферальный код:</p>
              <p className="text-foreground font-mono bg-muted/50 px-2 py-1 rounded-sm inline-block">{viewedUser.referral_code}</p>
            </div>
          )}
           {isLoadingReferredBy && viewedUser.referred_by_user_id && (
              <div>
                <p className="font-medium text-muted-foreground">Приглашен (ID: {viewedUser.referred_by_user_id}):</p>
                <p className="text-muted-foreground text-xs">Загрузка...</p>
              </div>
            )}
            {!isLoadingReferredBy && referredByUser && (
              <div>
                <p className="font-medium text-muted-foreground">Приглашен:</p>
                <p className="text-foreground">{referredByUser.username} (ID: {viewedUser.referred_by_user_id})</p>
              </div>
            )}
            {!isLoadingReferredBy && !referredByUser && viewedUser.referred_by_user_id &&(
                 <div>
                    <p className="font-medium text-muted-foreground">Приглашен (ID: {viewedUser.referred_by_user_id}):</p>
                    <p className="text-destructive text-xs">Пригласитель не найден</p>
                </div>
            )}
           {viewedUser.telegram_id && (
            <div>
              <p className="font-medium text-muted-foreground">Telegram ID:</p>
              <p className="text-foreground">{viewedUser.telegram_id}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="balance_transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="balance_transactions"><ListChecks className="mr-1.5 h-4 w-4"/>Транзакции</TabsTrigger>
          <TabsTrigger value="purchase_history"><ShoppingBag className="mr-1.5 h-4 w-4"/>Покупки</TabsTrigger>
          <TabsTrigger value="case_history"><Box className="mr-1.5 h-4 w-4"/>Кейсы</TabsTrigger>
          <TabsTrigger value="inventory"><Gem className="mr-1.5 h-4 w-4"/>Инвентарь</TabsTrigger>
          <TabsTrigger value="referrals"><UsersIcon className="mr-1.5 h-4 w-4"/>Рефералы</TabsTrigger>
        </TabsList>

        <TabsContent value="balance_transactions">
          <Card>
            <CardHeader><CardTitle className="text-lg text-primary flex items-center"><DollarSign className="mr-2 h-5 w-5"/>История транзакций баланса</CardTitle></CardHeader>
            <CardContent>
              {isLoadingBalanceTransactions ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="ml-2 text-muted-foreground">Загрузка транзакций...</p>
                </div>
              ) : balanceTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-primary">ID</TableHead>
                      <TableHead className="text-primary">Дата</TableHead>
                      <TableHead className="text-primary">Тип</TableHead>
                      <TableHead className="text-right text-primary">Сумма (GH)</TableHead>
                      <TableHead className="text-primary">Описание</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balanceTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium text-foreground/90">{tx.id}</TableCell>
                        <TableCell className="text-foreground/90 text-xs">{formatPurchaseDate(tx.created_at)}</TableCell>
                        <TableCell className="text-foreground/90 text-xs">{formatTransactionType(tx.transaction_type)}</TableCell>
                        <TableCell className={cn(
                          "text-right font-medium text-xs",
                          tx.amount_gh > 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {tx.amount_gh > 0 ? '+' : ''}{tx.amount_gh.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-foreground/80 text-xs">{tx.description || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">История транзакций баланса пуста.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="purchase_history">
          <Card>
            <CardHeader><CardTitle className="text-lg text-primary flex items-center"><History className="mr-2 h-5 w-5"/>История покупок</CardTitle></CardHeader>
            <CardContent>
              {isLoadingPurchaseHistory ? (
                 <div className="flex justify-center items-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Загрузка...</p></div>
              ) : purchaseHistory.length > 0 ? (
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-primary">ID</TableHead>
                      <TableHead className="text-primary">Товар</TableHead>
                      <TableHead className="text-primary">Дата</TableHead>
                      <TableHead className="text-right text-primary">Сумма (GH)</TableHead>
                      <TableHead className="text-primary">Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseHistory.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium text-foreground/90">{purchase.id}</TableCell>
                        <TableCell className="text-foreground/90 text-xs">
                            {purchase.product_name || `Продукт ID: ${purchase.product_id}`}
                            {purchase.product_pricing_option_duration_days && ` (${purchase.product_pricing_option_duration_days} дн.)`}
                        </TableCell>
                        <TableCell className="text-foreground/90 text-xs">{formatPurchaseDate(purchase.purchase_date)}</TableCell>
                        <TableCell className="text-right text-red-500 font-medium text-xs">-{purchase.amount_paid_gh.toFixed(2)}</TableCell>
                        <TableCell className="text-foreground/90 text-xs capitalize">{purchase.status === 'completed' ? 'Завершено' : purchase.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">История покупок пуста.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="case_history">
          <Card>
            <CardHeader><CardTitle className="text-lg text-primary flex items-center"><Box className="mr-2 h-5 w-5"/>История открытия кейсов</CardTitle></CardHeader>
            <CardContent>
               {isLoadingCaseHistory ? (
                 <div className="flex justify-center items-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Загрузка...</p></div>
              ) : caseHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-primary">ID Открытия</TableHead>
                      <TableHead className="text-primary">Кейс</TableHead>
                      <TableHead className="text-primary">Приз</TableHead>
                      <TableHead className="text-primary">Дата</TableHead>
                      <TableHead className="text-primary">Действие</TableHead>
                      <TableHead className="text-right text-primary">Продано за (GH)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {caseHistory.map((opening) => (
                      <TableRow key={opening.id}>
                        <TableCell className="font-medium text-foreground/90">{opening.id}</TableCell>
                        <TableCell className="text-foreground/90 text-xs">{opening.case_name || `Кейс ID: ${opening.case_id}`}</TableCell>
                        <TableCell className="text-foreground/90 text-xs">{opening.prize_name || `Приз ID: ${opening.won_prize_id}`}</TableCell>
                        <TableCell className="text-foreground/90 text-xs">{formatPurchaseDate(opening.opened_at)}</TableCell>
                        <TableCell className="text-foreground/90 text-xs">{formatCaseAction(opening.action_taken)}</TableCell>
                        <TableCell className="text-right text-xs text-primary">{opening.action_taken === 'sold' && opening.sold_value_gh ? `${opening.sold_value_gh.toFixed(2)}` : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">История открытия кейсов пуста.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="inventory">
          <Card>
            <CardHeader><CardTitle className="text-lg text-primary flex items-center"><Gem className="mr-2 h-5 w-5"/>Инвентарь призов</CardTitle></CardHeader>
            <CardContent>
               {isLoadingInventory ? (
                 <div className="flex justify-center items-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Загрузка...</p></div>
              ) : inventory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-primary">ID</TableHead>
                      <TableHead className="text-primary">Название</TableHead>
                      <TableHead className="text-primary">Получен</TableHead>
                      <TableHead className="text-primary">Истекает</TableHead>
                      <TableHead className="text-primary">Код</TableHead>
                      <TableHead className="text-primary">Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-foreground/90">{item.id}</TableCell>
                        <TableCell className="text-foreground/90 text-xs">{item.product_name}{item.duration_days ? ` (${item.duration_days} дн.)` : ''}</TableCell>
                        <TableCell className="text-foreground/90 text-xs">{formatPurchaseDate(item.acquired_at)}</TableCell>
                        <TableCell className="text-foreground/90 text-xs">{item.expires_at ? formatPurchaseDate(item.expires_at) : 'Бессрочно'}</TableCell>
                        <TableCell className="text-foreground/90 font-mono text-xs">{item.activation_code || '-'}</TableCell>
                        <TableCell className="text-foreground/90 text-xs">{item.is_used ? 'Использован' : 'Активен'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                 <p className="text-muted-foreground text-center py-8">Инвентарь пуст.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="referrals">
          <Card>
            <CardHeader><CardTitle className="text-lg text-primary flex items-center"><UsersIcon className="mr-2 h-5 w-5"/>Приглашенные пользователи</CardTitle></CardHeader>
            <CardContent>
               {isLoadingReferralsMade ? (
                 <div className="flex justify-center items-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Загрузка...</p></div>
              ) : referralsMade.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-primary">ID</TableHead>
                      <TableHead className="text-primary">Логин</TableHead>
                      <TableHead className="text-primary">Дата регистрации</TableHead>
                      <TableHead className="text-primary">Статус</TableHead>
                      <TableHead className="text-right text-primary">Бонус (GH)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referralsMade.map((ref) => (
                      <TableRow key={ref.id}>
                        <TableCell className="font-medium text-foreground/90">{ref.referred_user_id}</TableCell>
                        <TableCell className="text-foreground/90 text-xs">{ref.referred_username || 'N/A'}</TableCell>
                        <TableCell className="text-foreground/90 text-xs">{formatPurchaseDate(ref.created_at)}</TableCell>
                        <TableCell className={cn(
                          "text-xs",
                          ref.status === 'completed' ? 'text-primary' : 'text-muted-foreground'
                        )}>
                          {ref.status === 'completed' ? 'Завершен' : ref.status === 'pending_purchase' ? 'Ожидает покупки' : 'Истек'}
                        </TableCell>
                        <TableCell className="text-right text-xs text-primary">
                          {ref.reward_amount_gh ? `+${ref.reward_amount_gh.toFixed(2)}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">Этот пользователь никого не пригласил.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
