
// src/components/BalanceDepositModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CreditCardIcon } from 'lucide-react';
import type { SitePaymentGatewaySettings } from '@/types';

const depositSchema = z.object({
  amount: z.coerce.number().min(1, "Сумма должна быть не менее 1 GH.").max(100000, "Максимальная сумма 100 000 GH."),
});

type DepositFormValues = z.infer<typeof depositSchema>;

interface BalanceDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBalanceUpdated?: () => void; 
}

const BalanceDepositModal: React.FC<BalanceDepositModalProps> = ({ isOpen, onClose, onBalanceUpdated }) => {
  const { toast } = useToast();
  const { currentUser, fetchUserDetails } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPendingMessage, setShowPendingMessage] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<SitePaymentGatewaySettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: undefined,
    },
  });

  useEffect(() => {
    if (isOpen) { 
      setIsLoadingSettings(true);
      setShowPendingMessage(false); // Reset pending message when modal opens
      form.reset({amount: undefined}); // Reset form when modal opens
      const fetchPaymentSettings = async () => {
        try {
          const response = await fetch('/api/admin/site-settings/payment');
          if (!response.ok) throw new Error('Failed to fetch payment settings');
          const data: SitePaymentGatewaySettings = await response.json();
          setPaymentSettings(data);
        } catch (error) {
          console.error("Error fetching payment settings in modal:", error);
          setPaymentSettings({ is_test_mode_active: true }); 
        } finally {
          setIsLoadingSettings(false);
        }
      };
      fetchPaymentSettings();
    }
  }, [isOpen, form]); // Add form to dependency array to reset on open

  const onSubmit = async (data: DepositFormValues) => {
    if (!currentUser || isLoadingSettings) {
      toast({ title: "Ошибка", description: "Для пополнения баланса необходимо авторизоваться или подождать загрузки настроек.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
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
          window.location.href = result.confirmation_url; 
        } else {
           setShowPendingMessage(true); 
        }
      }
      form.reset();
      if (onBalanceUpdated && currentUser?.id) onBalanceUpdated();
      if (currentUser?.id) fetchUserDetails(currentUser.id); // Fetch details directly here too
      // Do not close modal automatically here if it's YooMoney, let user be redirected.
      // For test mode, keep it open to show pending message.
      if (!paymentSettings?.is_test_mode_active && result.confirmation_url) {
        // No automatic close if redirecting
      } else {
         // If test mode, or no redirect URL, it stays open or we can choose to close it after a delay if showPendingMessage is true
      }

    } catch (error: any) {
      toast({ title: "Ошибка пополнения", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    if (!isSubmitting) {
      form.reset();
      setShowPendingMessage(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleModalClose(); }}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center">
            <CreditCardIcon className="mr-2 h-5 w-5" />
            Пополнить баланс
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isLoadingSettings ? "Загрузка настроек..." : 
             paymentSettings?.is_test_mode_active 
              ? "Создайте заявку на пополнение. Администратор рассмотрит ее." 
              : "Введите сумму для пополнения через YooMoney."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="modal-deposit-amount" className="text-foreground">Сумма (GH)</Label>
            <Input
              type="number"
              id="modal-deposit-amount"
              placeholder="Например, 500"
              className="mt-1"
              {...form.register("amount")}
              disabled={isSubmitting || showPendingMessage || isLoadingSettings}
            />
            {form.formState.errors.amount && <p className="text-sm text-destructive mt-1">{form.formState.errors.amount.message}</p>}
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting || showPendingMessage || isLoadingSettings}>
            {isLoadingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isLoadingSettings ? "Загрузка..." : 
             isSubmitting ? "Обработка..." : 
             showPendingMessage ? (paymentSettings?.is_test_mode_active ? "Заявка ожидает" : "Ожидание оплаты") : 
             (paymentSettings?.is_test_mode_active ? "Создать заявку" : "Перейти к оплате")}
          </Button>
        </form>
        {showPendingMessage && (
            <p className="text-xs text-center text-yellow-500 bg-yellow-500/10 p-2 rounded-md mt-3">
              {paymentSettings?.is_test_mode_active 
                ? "Баланс обновится после одобрения администратором."
                : "Для завершения пополнения, пожалуйста, следуйте инструкциям на странице оплаты."}
            </p>
        )}
         {!showPendingMessage && !isLoadingSettings && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              {paymentSettings?.is_test_mode_active 
                ? "1 GH = 1 рубль. Пополнение через заявку." 
                : "1 GH = 1 рубль. Оплата через YooMoney Касса."}
            </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BalanceDepositModal;
    
    