
// src/app/admin/key-activations/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KeyRound, Loader2, AlertTriangle, Check, X, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ActivationRequest {
  inventory_item_id: number;
  user_id: number;
  user_username: string;
  product_display_name: string;
  activation_code: string | null;
  request_date: string;
  duration_days: number | null;
  mode_label: string | null;
}

export default function AdminKeyActivationsPage() {
  const [requests, setRequests] = useState<ActivationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [processingRequestId, setProcessingRequestId] = useState<number | null>(null);

  const fetchActivationRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/key-activation-requests');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch activation requests' }));
        throw new Error(errorData.message);
      }
      const data: ActivationRequest[] = await response.json();
      setRequests(data);
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить запросы на активацию.");
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchActivationRequests();
  }, [fetchActivationRequests]);

  const handleProcessRequest = async (inventoryItemId: number, action: 'approve' | 'reject') => {
    setProcessingRequestId(inventoryItemId);
    try {
      const response = await fetch(`/api/admin/key-activation-requests/${inventoryItemId}/${action}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'reject' ? { rejection_reason: 'Отклонено администратором' } : {}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `Не удалось ${action === 'approve' ? 'одобрить' : 'отклонить'} запрос.`);
      toast({ title: "Успех", description: result.message });
      fetchActivationRequests(); 
    } catch (error: any) {
      toast({ title: `Ошибка ${action === 'approve' ? 'одобрения' : 'отклонения'}`, description: error.message, variant: "destructive" });
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
                <KeyRound className="mr-2 h-6 w-6" />
                Запросы на Активацию Ключей
            </CardTitle>
            <CardDescription className="text-muted-foreground">
                Просмотр и обработка запросов от пользователей на активацию лицензионных ключей.
            </CardDescription>
        </div>
        <Button onClick={fetchActivationRequests} variant="outline" size="icon" className="border-primary text-primary hover:bg-primary/10" disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            <span className="sr-only">Обновить список</span>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && requests.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Загрузка запросов...</p>
          </div>
        ) : error ? (
           <div className="text-center py-8 text-destructive">
              <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
              <p className="font-semibold">Не удалось загрузить запросы</p>
              <p className="text-sm">{error}</p>
          </div>
        ) : requests.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-primary">ID Запроса (Инв.)</TableHead>
                  <TableHead className="text-primary">Пользователь</TableHead>
                  <TableHead className="text-primary">Товар</TableHead>
                  <TableHead className="text-primary">Ключ</TableHead>
                  <TableHead className="text-primary">Дата запроса</TableHead>
                  <TableHead className="text-center text-primary">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.inventory_item_id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-foreground/90">{req.inventory_item_id}</TableCell>
                    <TableCell className="text-foreground/90 text-sm">{req.user_username} (ID: {req.user_id})</TableCell>
                    <TableCell className="text-foreground/90 text-xs">
                        {req.product_display_name}
                        {req.duration_days ? ` (${req.duration_days} дн.)` : ''}
                        {req.mode_label ? ` [${req.mode_label}]` : ''}
                    </TableCell>
                    <TableCell className="text-foreground/80 font-mono text-xs">{req.activation_code || '-'}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(req.request_date)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-green-500 text-green-500 hover:bg-green-500/10 h-8 text-xs"
                          onClick={() => handleProcessRequest(req.inventory_item_id, 'approve')}
                          disabled={processingRequestId === req.inventory_item_id}
                        >
                          {processingRequestId === req.inventory_item_id && <Loader2 className="h-4 w-4 animate-spin"/>}
                          <Check className="h-4 w-4 mr-1"/> Одобрить
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-red-500 text-red-500 hover:bg-red-500/10 h-8 text-xs"
                          onClick={() => handleProcessRequest(req.inventory_item_id, 'reject')}
                          disabled={processingRequestId === req.inventory_item_id}
                        >
                           {processingRequestId === req.inventory_item_id && <Loader2 className="h-4 w-4 animate-spin"/>}
                          <X className="h-4 w-4 mr-1"/> Отклонить
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Нет ожидающих запросов на активацию ключей.</p>
        )}
      </CardContent>
    </Card>
  );
}
