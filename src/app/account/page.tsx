
'use client'; 

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { User, DollarSign, Gift, Users as UsersIcon, Settings, ShoppingCart, LayoutGrid, LinkIcon as LinkIconLucide, UserPlus, RefreshCw, KeyRound, Info, Copy, Check, ArrowRight, Layers, Palette, FileText, Ticket, CheckCircle as CheckCircleIcon, PercentSquare, Loader2, PlusCircle, History as HistoryIcon } from "lucide-react"; 
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import type { ReferrerDetails, ReferredUsersCount, ActiveLicense, BalanceTransaction, Referral } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils'; 
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";


export default function AccountDashboardPage() {
  const { currentUser, fetchUserDetails, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [referrerDetails, setReferrerDetails] = useState<ReferrerDetails | null>(null);
  const [referredCount, setReferredCount] = useState<ReferredUsersCount | null>(null);
  const [activeLicenses, setActiveLicenses] = useState<ActiveLicense[]>([]);
  const [isReferrerLoading, setIsReferrerLoading] = useState(false);
  const [isCountLoading, setIsCountLoading] = useState(false);
  const [isLicensesLoading, setIsLicensesLoading] = useState(true);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [referrerFetchError, setReferrerFetchError] = useState<string | null>(null);
  const [copiedReferralLink, setCopiedReferralLink] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [isApplyingPromoCode, setIsApplyingPromoCode] = useState(false);
  const [balanceTransactions, setBalanceTransactions] = useState<BalanceTransaction[]>([]);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true);


  const formatDate = (dateString: string | Date | undefined | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const fetchBalanceTransactions = useCallback(async () => {
    if (!currentUser?.id) {
      setIsTransactionsLoading(false);
      return;
    }
    setIsTransactionsLoading(true);
    try {
      const response = await fetch(`/api/user/${currentUser.id}/balance-transactions`);
      if (!response.ok) {
        throw new Error('Failed to fetch transaction history');
      }
      const data: BalanceTransaction[] = await response.json();
      setBalanceTransactions(data);
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      setBalanceTransactions([]); 
    } finally {
      setIsTransactionsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
        fetchBalanceTransactions();
    }
  }, [currentUser?.id, fetchBalanceTransactions]);


  useEffect(() => {
    if (currentUser?.referred_by_user_id) {
      setIsReferrerLoading(true);
      setReferrerFetchError(null);
      fetch(`/api/user/${currentUser.referred_by_user_id}/referrer-details`)
        .then(async res => { 
          if (!res.ok) {
            const errorPayload = await res.json().catch(() => ({ message: `Failed to fetch referrer details (${res.statusText || res.status})` }));
            throw new Error(errorPayload.message);
          }
          return res.json();
        })
        .then(data => setReferrerDetails(data))
        .catch(error => { 
          console.error("Error fetching referrer details from client:", error.message); 
          setReferrerFetchError(error.message || "Не удалось загрузить информацию о пригласившем.");
        })
        .finally(() => setIsReferrerLoading(false));
    } else {
      setReferrerDetails(null); 
      setReferrerFetchError(null);
    }

    if (currentUser?.id) {
      setIsCountLoading(true);
      fetch(`/api/user/${currentUser.id}/referred-count`)
        .then(res => {
          if (!res.ok) return res.json().then(err => Promise.reject(new Error(err.message || 'Failed to fetch referred count')));
          return res.json();
        })
        .then(data => setReferredCount(data))
        .catch(error => {
          console.error("Error fetching referred count:", error);
          setReferredCount({ count: 0 }); 
        })
        .finally(() => setIsCountLoading(false));
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchActiveLicenses = async () => {
      if (!currentUser?.id) {
          setIsLicensesLoading(false);
          return;
      };
      setIsLicensesLoading(true);
      try {
        const response = await fetch(`/api/user/${currentUser.id}/licenses`);
        if (response.ok) {
          const licenses = await response.json();
          setActiveLicenses(licenses);
        } else {
           console.error("Failed to fetch licenses");
           setActiveLicenses([]);
        }
      } catch (error) {
         console.error("Error fetching active licenses:", error);
         setActiveLicenses([]);
      } finally {
        setIsLicensesLoading(false);
      }
    };
    if (currentUser?.id) {
        fetchActiveLicenses();
    }
  }, [currentUser?.id]);


  const formatBalance = (balance: number | undefined | null): string => {
    if (typeof balance !== 'number' || balance === null || isNaN(balance)) {
      return '0';
    }
    return Math.floor(balance).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };
  
  const handleRefreshBalance = useCallback(async () => {
    if (!currentUser?.id) return;
    setIsRefreshingBalance(true);
    try {
      await fetchUserDetails(currentUser.id);
      toast({ title: "Баланс обновлен" });
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось обновить баланс.", variant: "destructive" });
    } finally {
      setIsRefreshingBalance(false);
    }
  }, [currentUser?.id, fetchUserDetails, toast]);

  const handleCopyReferralLink = async () => {
    if (!currentUser?.referral_code) return;
    const link = `${window.location.origin}/auth/register?ref=${currentUser.referral_code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedReferralLink(true);
      toast({
        title: "Скопировано!",
        description: "Ссылка для регистрации с реферальным кодом успешно скопирована!",
      });
      setTimeout(() => setCopiedReferralLink(false), 2000);
    } catch (err) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать ссылку.",
        variant: "destructive",
      });
    }
  };

  const handleGetLicense = (productName?: string, howToRunLink?: string | null) => {
     if (howToRunLink && howToRunLink !== "#") {
        window.open(howToRunLink, '_blank');
     } else {
        toast({
            title: `Инструкция для ${productName || 'софта'}`,
            description: (
                <p>
                Инструкция по запуску для этого продукта пока не добавлена. Обратитесь в поддержку:{" "}
                <a href="https://t.me/Gallant_kz" target="_blank" rel="noopener noreferrer" className="underline text-primary">
                    Поддержка
                </a>
                </p>
            ),
            duration: 10000,
        });
     }
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim() || !currentUser) {
      toast({ title: "Ошибка", description: "Введите промокод.", variant: "destructive" });
      return;
    }
    setIsApplyingPromoCode(true);
    
    try {
      const response = await fetch('/api/promocode/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, code: promoCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to apply promo code');
      toast({ title: "Успех!", description: data.message });
      if(currentUser?.id) {
        await fetchUserDetails(currentUser.id); 
        fetchBalanceTransactions(); 
      }
      setPromoCode('');
    } catch (error: any) {
      toast({ title: "Ошибка промокода", description: error.message, variant: "destructive" });
    } finally {
      setIsApplyingPromoCode(false);
    }
  };

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

  if (authLoading) {
    return <div className="flex justify-center items-center flex-1"><p>Загрузка данных аккаунта...</p></div>;
  }


  if (!currentUser) {
    return <div className="flex justify-center items-center flex-1 min-h-screen"><p>Пожалуйста, войдите для доступа к этой странице.</p></div>;
  }
  
  return (
    <div className="space-y-6 flex-1">
      <div className="mb-4"> 
        <p className="text-lg text-foreground/90">
          Приветствую, <span className="font-semibold text-primary">{currentUser?.username || 'Пользователь'}</span>!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col">
          <Card className="shadow-lg flex-grow"> 
            <CardHeader>
              <CardTitle className="text-xl text-primary flex items-center">
                <Layers className="mr-2 h-6 w-6"/>
                Активные лицензии
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLicensesLoading ? (
                <p className="text-muted-foreground">Загрузка активных лицензий...</p>
              ) : activeLicenses.length > 0 ? (
                <ul className="space-y-4">
                  {activeLicenses.map(license => (
                    <li key={license.id} className="p-4 border border-border rounded-md space-y-2">
                      <h4 className="font-semibold text-foreground">{license.productName}</h4>
                      {license.activated_at && <p className="text-xs text-muted-foreground">Активирован: {formatDate(license.activated_at)}</p>}
                      <p className="text-xs text-muted-foreground">Истекает: {license.expiryDate ? formatDate(license.expiryDate) : 'Бессрочно'}</p>
                      <div className="flex gap-2 mt-2">
                        <Button asChild size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                          <Link href={`/products/${license.productSlug}`}>Продлить</Link>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleGetLicense(license.productName, license.how_to_run_link)} className="border-primary text-primary hover:bg-primary/10">Как запускать?</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                 <div className="min-h-[100px] flex items-center justify-center">
                    <p className="text-muted-foreground">У вас нет активных лицензий.</p>
                 </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 flex flex-col">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Текущий Баланс</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleRefreshBalance} disabled={isRefreshingBalance} className="h-6 w-6 p-0 text-primary hover:text-primary/80">
                <RefreshCw className={cn("h-4 w-4", isRefreshingBalance && "animate-spin")} />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatBalance(currentUser?.balance)} <span className="text-gradient-gh font-bold">GH</span></div>
              <p className="text-xs text-muted-foreground pt-1">Доступно для покупок и кейсов</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Реферальная программа</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Пригласи друга и получи {currentUser.referral_percentage !== undefined ? currentUser.referral_percentage.toFixed(0) : '5'}% на свой баланс GH с его первой покупки!
              </p>
              <div className="flex items-center gap-1">
                <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">Ваш код:</p>
                <Input 
                  type="text" 
                  value={currentUser.referral_code || 'N/A'} 
                  readOnly 
                  className="h-7 text-xs font-mono bg-muted/50 text-foreground flex-grow"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 p-0 text-primary hover:text-primary/80" 
                  onClick={handleCopyReferralLink}
                  disabled={!currentUser.referral_code}
                >
                  {copiedReferralLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <p className="font-medium text-muted-foreground whitespace-nowrap">Приглашено:</p>
                <span className="text-foreground font-semibold">{isCountLoading ? '...' : referredCount?.count ?? 0}</span>
              </div>
              {isReferrerLoading && <p className="text-xs text-muted-foreground">Загрузка пригласившего...</p>}
              {!isReferrerLoading && referrerFetchError && <p className="text-xs text-destructive">{referrerFetchError}</p>}
              {!isReferrerLoading && !referrerFetchError && referrerDetails && (
                <p className="text-xs text-muted-foreground">Вас пригласил: <span className="font-semibold text-foreground">{referrerDetails.username}</span></p>
              )}
            </CardContent>
          </Card>

           <Card className="shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Промокод</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Введите промокод"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="h-9 text-sm"
                  disabled={isApplyingPromoCode}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-primary hover:text-primary/80 hover:bg-primary/10"
                  onClick={handleApplyPromoCode}
                  disabled={isApplyingPromoCode || !promoCode.trim()}
                  aria-label="Применить промокод"
                >
                  {isApplyingPromoCode ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
       <Card className="shadow-lg mt-6">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center">
            <HistoryIcon className="mr-2 h-6 w-6" />
            История транзакций
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isTransactionsLoading ? (
             <div className="flex justify-center items-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Загрузка истории...</p>
            </div>
          ) : balanceTransactions.length > 0 ? (
            <ScrollArea className="h-[200px] w-full rounded-md border border-border p-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-primary text-xs">Дата</TableHead>
                    <TableHead className="text-primary text-xs">Тип</TableHead>
                    <TableHead className="text-right text-primary text-xs">Сумма (GH)</TableHead>
                    <TableHead className="text-primary text-xs hidden sm:table-cell">Описание</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balanceTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-foreground/80 text-xs">{formatDate(tx.created_at)}</TableCell>
                      <TableCell className="text-foreground/80 text-xs">{formatTransactionType(tx.transaction_type)}</TableCell>
                      <TableCell className={cn(
                        "text-right font-medium text-xs",
                        tx.amount_gh > 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {tx.amount_gh > 0 ? '+' : ''}{tx.amount_gh.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-foreground/70 text-xs hidden sm:table-cell truncate max-w-xs">{tx.description || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-6">История транзакций пуста.</p>
          )}
        </CardContent>
      </Card>

       <Card className="shadow-lg mt-6">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center">
            <Palette className="mr-2 h-6 w-6"/> 
            Быстрые действия
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 hover:text-primary/90"><Link href="/games">Каталог</Link></Button>
          <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 hover:text-primary/90"><Link href="/account/balance">Пополнить баланс</Link></Button>
          <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 hover:text-primary/90"><Link href="/account/purchase-history">История покупок</Link></Button>
          <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 hover:text-primary/90"><Link href="/#case-opening">Открыть кейс</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
