
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HandCoins, Loader2, AlertTriangle, Check, X, RefreshCw } from 'lucide-react';
import type { PaymentRequest } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminTestPaymentsPage() {
  const [pendingRequests, setPendingRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [processingRequestId, setProcessingRequestId] = useState<number | null>(null);

  const fetchPendingRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/payment-requests?status=pending');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch payment requests' }));
        throw new Error(errorData.message);
      }
      const data: PaymentRequest[] = await response.json();
      setPendingRequests(data);
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить заявки на пополнение.");
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const handleApprove = async (requestId: number) => {
    setProcessingRequestId(requestId);
    try {
      const response = await fetch(`/api/admin/payment-requests/${requestId}/approve`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Не удалось одобрить заявку.');
      toast({ title: "Успех", description: result.message });
      fetchPendingRequests(); // Refresh list
    } catch (error: any) {
      toast({ title: "Ошибка одобрения", description: error.message, variant: "destructive" });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    setProcessingRequestId(requestId);
    try {
      const response = await fetch(`/api/admin/payment-requests/${requestId}/reject`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Не удалось отклонить заявку.');
      toast({ title: "Заявка отклонена", description: result.message });
      fetchPendingRequests(); // Refresh list
    } catch (error: any) {
      toast({ title: "Ошибка отклонения", description: error.message, variant: "destructive" });
    } finally {
      setProcessingRequestId(null);
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center">
                <HandCoins className="mr-2 h-6 w-6" />
                Тестовые Пополнения Баланса
            </CardTitle>
            <CardDescription className="text-muted-foreground">
                Просмотр и обработка заявок на пополнение баланса от пользователей.
            </CardDescription>
        </div>
        <Button onClick={fetchPendingRequests} variant="outline" size="icon" className="border-primary text-primary hover:bg-primary/10" disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            <span className="sr-only">Обновить список</span>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && pendingRequests.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Загрузка заявок...</p>
          </div>
        ) : error ? (
           <div className="text-center py-8 text-destructive">
              <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
              <p className="font-semibold">Не удалось загрузить заявки</p>
              <p className="text-sm">{error}</p>
          </div>
        ) : pendingRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-primary">ID Заявки</TableHead>
                  <TableHead className="text-primary">Пользователь</TableHead>
                  <TableHead className="text-primary text-right">Сумма (GH)</TableHead>
                  <TableHead className="text-primary">Метод</TableHead>
                  <TableHead className="text-primary">Дата</TableHead>
                  <TableHead className="text-center text-primary">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((req) => (
                  <TableRow key={req.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-foreground/90">{req.id}</TableCell>
                    <TableCell className="text-foreground/90 text-sm">{req.username || `ID: ${req.user_id}`}</TableCell>
                    <TableCell className="text-right text-foreground/90 font-semibold">{req.amount_gh.toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{req.payment_method_details}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(req.created_at)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-green-500 text-green-500 hover:bg-green-500/10 h-8 text-xs"
                          onClick={() => handleApprove(req.id)}
                          disabled={processingRequestId === req.id}
                        >
                          {processingRequestId === req.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4"/>}
                          <span className="ml-1">Одобрить</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-red-500 text-red-500 hover:bg-red-500/10 h-8 text-xs"
                          onClick={() => handleReject(req.id)}
                          disabled={processingRequestId === req.id}
                        >
                          {processingRequestId === req.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4"/>}
                           <span className="ml-1">Отклонить</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Нет ожидающих заявок на пополнение.</p>
        )}
      </CardContent>
    </Card>
  );
}
