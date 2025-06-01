
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote, CreditCardIcon, RefreshCw, Ticket, CheckCircleIcon, Loader2, Settings } from "lucide-react"; // Removed ListChecks, History, Coins
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { SitePaymentGatewaySettings } from '@/types'; // Ensure this type exists

const depositSchema = z.object({
  amount: z.coerce.number().min(1, "Сумма должна быть не менее 1 GH.").max(100000, "Максимальная сумма 100 000 GH."),
});

type DepositFormValues = z.infer<typeof depositSchema>;

const promoCodeSchema = z.object({
  promoCode: z.string().min(1, "Введите промокод."),
});
type PromoCodeFormValues = z.infer<typeof promoCodeSchema>;


export default function BalancePage() {
  const { currentUser, fetchUserDetails, loading: authLoading } = useAuth();
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [showPendingMessage, setShowPendingMessage] = useState(false);
  const [isApplyingPromoCode, setIsApplyingPromoCode] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<SitePaymentGatewaySettings | null>(null);
  const [isLoadingPageSettings, setIsLoadingPageSettings] = useState(true);


  const { toast } = useToast();

  const depositForm = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: { amount: undefined },
  });

  const promoCodeForm = useForm<PromoCodeFormValues>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: { promoCode: '' },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoadingPageSettings(true);
      try {
        const response = await fetch('/api/admin/site-settings/payment'); 
        if (!response.ok) throw new Error('Failed to fetch payment settings');
        const data: SitePaymentGatewaySettings = await response.json();
        setPaymentSettings(data);
        console.log("Payment settings loaded on balance page:", data);
      } catch (error) {
        console.error("Error fetching payment settings on balance page:", error);
        setPaymentSettings({ is_test_mode_active: true }); // Fallback to test mode
      } finally {
        setIsLoadingPageSettings(false);
      }
    };
    fetchSettings();
  }, []);

  const formatBalance = (balance: number | undefined | null): string => {
    if (typeof balance === 'number') {
      return balance.toFixed(2);
    }
    return '0.00';
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


  const onDepositSubmit = async (data: DepositFormValues) => {
    if (!currentUser || isLoadingPageSettings) return;
    setIsSubmittingDeposit(true);
    setShowPendingMessage(false);

    const endpoint = paymentSettings?.is_test_mode_active 
                     ? '/api/payment/request' 
                     : '/api/payment/create-yoomoney-payment';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, amountGh: data.amount }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Не удалось обработать запрос на пополнение.");
      }

      if (paymentSettings?.is_test_mode_active) {
        toast({ title: "Заявка создана", description: "Ваша заявка на пополнение отправлена. Ожидайте подтверждения администратором." });
        setShowPendingMessage(true);
      } else {
        toast({ title: "Создание платежа", description: "Перенаправление на страницу оплаты..." });
        console.log("YooMoney Confirmation URL:", result.confirmation_url);
        if (result.confirmation_url) {
          window.location.href = result.confirmation_url; // Actual redirect for YooMoney
        } else {
           setShowPendingMessage(true); // Fallback if no URL (should not happen in real scenario)
        }
      }
      depositForm.reset();
      if (currentUser?.id) fetchUserDetails(currentUser.id);

    } catch (error: any) {
      toast({ title: "Ошибка пополнения", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const onPromoCodeSubmit = async (data: PromoCodeFormValues) => {
    if (!currentUser) {
      toast({ title: "Ошибка", description: "Для активации промокода необходимо авторизоваться.", variant: "destructive" });
      return;
    }
    setIsApplyingPromoCode(true);
    try {
      const response = await fetch('/api/promocode/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, code: data.promoCode }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Не удалось применить промокод');
      toast({ title: "Успех!", description: result.message });
      if (currentUser?.id) {
        await fetchUserDetails(currentUser.id); 
      }
      promoCodeForm.reset();
    } catch (error: any) {
      toast({ title: "Ошибка промокода", description: error.message, variant: "destructive" });
    } finally {
      setIsApplyingPromoCode(false);
    }
  };

  if (authLoading || isLoadingPageSettings) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-var(--header-height)-var(--footer-height))]"><Loader2 className="h-8 w-8 animate-spin text-primary mr-2"/> Загрузка данных...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <h1 className="text-3xl font-bold text-primary tracking-tight">Управление Балансом</h1>
        <div className="mt-2 md:mt-0">
          <Card className="shadow-sm bg-card/50 border-border">
            <CardContent className="p-3 flex items-center">
                <Banknote className="mr-3 h-6 w-6 text-primary" />
                <div>
                    <p className="text-sm text-muted-foreground">Текущий баланс:</p>
                    <p className="text-2xl font-bold text-foreground">{formatBalance(currentUser?.balance)} <span className="text-gradient-gh">GH</span></p>
                </div>
                 <Button variant="ghost" size="icon" onClick={handleRefreshBalance} disabled={isRefreshingBalance} className="ml-3 h-7 w-7 p-0 text-primary hover:text-primary/80">
                    <RefreshCw className={cn("h-4 w-4", isRefreshingBalance && "animate-spin")} />
                 </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <Card className="shadow-lg md:sticky md:top-24"> {/* Sticky for desktop */}
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center">
              <CreditCardIcon className="mr-2 h-6 w-6"/>
              Пополнить счет
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={depositForm.handleSubmit(onDepositSubmit)} className="space-y-3">
              <div>
                <Label htmlFor="amount" className="text-foreground">Сумма (GH)</Label>
                <Input 
                  type="number" 
                  id="amount" 
                  placeholder="Например, 500" 
                  className="mt-1"
                  {...depositForm.register("amount")}
                  disabled={isSubmittingDeposit || showPendingMessage || isLoadingPageSettings}
                />
                {depositForm.formState.errors.amount && <p className="text-sm text-destructive mt-1">{depositForm.formState.errors.amount.message}</p>}
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmittingDeposit || showPendingMessage || isLoadingPageSettings}>
                {isLoadingPageSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isSubmittingDeposit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoadingPageSettings ? "Загрузка настроек..." : 
                 isSubmittingDeposit ? "Обработка..." : 
                 showPendingMessage ? (paymentSettings?.is_test_mode_active ? "Заявка ожидает" : "Ожидание оплаты") : 
                 (paymentSettings?.is_test_mode_active ? "Создать заявку" : "Перейти к оплате")}
              </Button>
            </form>
            {showPendingMessage && (
              <p className="text-xs text-center text-yellow-500 bg-yellow-500/10 p-2 rounded-md">
                {paymentSettings?.is_test_mode_active 
                  ? "Ваша заявка создана и ожидает подтверждения администратором. Баланс обновится после одобрения."
                  : "Для завершения пополнения, пожалуйста, следуйте инструкциям на странице оплаты."}
              </p>
            )}
            {!paymentSettings?.is_test_mode_active && !showPendingMessage && (
                <p className="text-xs text-center text-muted-foreground">
                 Оплата будет производиться через YooMoney Касса.
                </p>
            )}
             {paymentSettings?.is_test_mode_active && !showPendingMessage && (
                <p className="text-xs text-center text-muted-foreground">
                 Тестовый режим: пополнение через заявку администратору.
                </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center">
              <Ticket className="mr-2 h-6 w-6"/>
              Активация кода
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Если вы получили код пополнения от администрации или уникальный промокод, введите его здесь для активации и зачисления средств или получения товара.
            </p>
            <form onSubmit={promoCodeForm.handleSubmit(onPromoCodeSubmit)} className="space-y-3">
              <div>
                <Label htmlFor="promoCode" className="text-foreground">Код активации / Промокод</Label>
                <Input 
                  type="text" 
                  id="promoCode" 
                  placeholder="TEST-CODE-123" 
                  className="mt-1 uppercase"
                  {...promoCodeForm.register("promoCode")}
                  disabled={isApplyingPromoCode}
                />
                {promoCodeForm.formState.errors.promoCode && <p className="text-sm text-destructive mt-1">{promoCodeForm.formState.errors.promoCode.message}</p>}
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isApplyingPromoCode}>
                {isApplyingPromoCode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircleIcon className="mr-2 h-4 w-4" /> }
                Активировать
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
    
    