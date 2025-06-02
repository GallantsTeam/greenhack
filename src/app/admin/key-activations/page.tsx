
// src/app/admin/key-activations/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  activated_at?: string | null; 
  status_reason?: string | null; 
  duration_days: number | null;
  mode_label: string | null;
  activation_status: 'pending_admin_approval' | 'active' | 'rejected';
}

type ActivationStatusFilter = 'pending_admin_approval' | 'active' | 'rejected';

export default function AdminKeyActivationsPage() {
  const [requests, setRequests] = useState<ActivationRequest[]>([]);
  const [activeTab, setActiveTab] = useState<ActivationStatusFilter>('pending_admin_approval');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [processingRequestId, setProcessingRequestId] = useState<number | null>(null);

  const fetchActivationRequests = useCallback(async (status: ActivationStatusFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/key-activation-requests?status=${status}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch activation requests' }));
        throw new Error(errorData.message);
      }
      const data: ActivationRequest[] = await response.json();
      setRequests(data);
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить запросы на активацию.");
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchActivationRequests(activeTab);
  }, [fetchActivationRequests, activeTab]);

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
      fetchActivationRequests(activeTab); 
    } catch (error: any) {
      toast({ title: `Ошибка ${action === 'approve' ? 'одобрения' : 'отклонения'}`, description: error.message, variant: "destructive" });
    } finally {
      setProcessingRequestId(null);
    }
  };
  
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
  };

  const renderTable = (data: ActivationRequest[]) => {
    if (isLoading) {
        return <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Загрузка запросов...</p></div>;
    }
    if (error && data.length === 0) {
        return <div className="text-center py-8 text-destructive"><AlertTriangle className="mx-auto h-10 w-10 mb-2" /><p className="font-semibold">Не удалось загрузить запросы</p><p className="text-sm">{error}</p></div>;
    }
    if (data.length === 0) {
        let statusText = "ожидающих";
        if (activeTab === 'active') statusText = "одобренных";
        if (activeTab === 'rejected') statusText = "отклоненных";
        return <p className="text-muted-foreground text-center py-8">Нет {statusText} запросов на активацию ключей.</p>;
    }
    return (
        <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-primary">ID (Инв.)</TableHead>
                  <TableHead className="text-primary">Пользователь</TableHead>
                  <TableHead className="text-primary">Товар</TableHead>
                  <TableHead className="text-primary">Ключ</TableHead>
                  <TableHead className="text-primary">{activeTab === 'active' ? 'Дата активации' : 'Дата запроса'}</TableHead>
                  {activeTab === 'rejected' && <TableHead className="text-primary">Причина отклонения</TableHead>}
                  <TableHead className="text-center text-primary">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((req) => (
                  <TableRow key={req.inventory_item_id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-foreground/90">{req.inventory_item_id}</TableCell>
                    <TableCell className="text-foreground/90 text-sm">{req.user_username} (ID: {req.user_id})</TableCell>
                    <TableCell className="text-foreground/90 text-xs">
                        {req.product_display_name}
                        {req.duration_days ? ` (${req.duration_days} дн.)` : ''}
                        {req.mode_label ? ` [${req.mode_label}]` : ''}
                    </TableCell>
                    <TableCell className="text-foreground/80 font-mono text-xs">{req.activation_code || '-'}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(activeTab === 'active' ? req.activated_at : req.request_date)}</TableCell>
                    {activeTab === 'rejected' && <TableCell className="text-muted-foreground text-xs max-w-[150px] truncate" title={req.status_reason || '-'}>{req.status_reason || '-'}</TableCell>}
                    <TableCell className="text-center">
                      {req.activation_status === 'pending_admin_approval' ? (
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
                      ) : req.activation_status === 'active' ? (
                        <span className="text-xs text-green-500">Одобрен</span>
                      ) : req.activation_status === 'rejected' ? (
                        <span className="text-xs text-red-500">Отклонен</span>
                      ) : (
                         <span className="text-xs text-muted-foreground">Неизвестно</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
    );
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
        <Button onClick={() => fetchActivationRequests(activeTab)} variant="outline" size="icon" className="border-primary text-primary hover:bg-primary/10" disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            <span className="sr-only">Обновить список</span>
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActivationStatusFilter)}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="pending_admin_approval">Ожидают</TabsTrigger>
                <TabsTrigger value="active">Одобренные</TabsTrigger>
                <TabsTrigger value="rejected">Отклоненные</TabsTrigger>
            </TabsList>
            <TabsContent value="pending_admin_approval">
                {renderTable(requests.filter(r => r.activation_status === 'pending_admin_approval'))}
            </TabsContent>
            <TabsContent value="active">
                {renderTable(requests.filter(r => r.activation_status === 'active'))}
            </TabsContent>
            <TabsContent value="rejected">
                {renderTable(requests.filter(r => r.activation_status === 'rejected'))}
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

    