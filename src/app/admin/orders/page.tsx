
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingCart, Loader2, AlertTriangle, Search } from 'lucide-react';
import type { PurchaseHistoryItem } from '@/types'; 
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button'; // Added
import { RefreshCw } from 'lucide-react'; // Added

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<PurchaseHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/orders');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || 'Failed to fetch orders');
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        console.error("Received non-array data from /api/admin/orders:", data);
        setOrders([]);
        throw new Error('Received invalid data structure for orders.');
      }
      setOrders(data);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      setError(error.message || "Не удалось загрузить список заказов.");
      toast({
        title: "Ошибка загрузки заказов",
        description: error.message || "Не удалось получить список заказов.",
        variant: "destructive",
      });
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  const handleRefreshOrders = () => {
    fetchOrders();
  };


  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.id.toString().includes(searchLower) ||
      (order.user_username && order.user_username.toLowerCase().includes(searchLower)) ||
      (order.product_name && order.product_name.toLowerCase().includes(searchLower)) ||
      (order.status && order.status.toLowerCase().includes(searchLower)) ||
      (order.product_id && order.product_id.toLowerCase().includes(searchLower))
    );
  });

  const formatPurchaseDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'completed': return 'Завершено';
      case 'pending': return 'В ожидании';
      case 'failed': return 'Ошибка';
      case 'refunded': return 'Возвращено';
      default: return status;
    }
  };

  const formatVersionType = (isPvp: boolean | undefined | null): string => {
    if (isPvp === null || isPvp === undefined) return 'N/A';
    return isPvp ? 'PVP' : 'PVE';
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center">
                <ShoppingCart className="mr-2 h-6 w-6" />
                История Заказов
            </CardTitle>
            <CardDescription className="text-muted-foreground">
                Просмотр всех совершенных покупок на сайте.
            </CardDescription>
          </div>
          <Button onClick={handleRefreshOrders} variant="outline" size="icon" className="border-primary text-primary hover:bg-primary/10" disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            <span className="sr-only">Обновить список</span>
        </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск по ID заказа, пользователю, товару..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full md:w-1/2 bg-background focus:border-primary"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Загрузка заказов...</p>
            </div>
          ) : error ? (
             <div className="text-center py-8 text-destructive">
                <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
                <p className="font-semibold">Не удалось загрузить заказы</p>
                <p className="text-sm">{error}</p>
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>{/* Ensure no whitespace here */}<TableHead className="text-primary">ID Заказа</TableHead><TableHead className="text-primary">Пользователь</TableHead><TableHead className="text-primary">Товар</TableHead><TableHead className="text-primary">Длительность</TableHead><TableHead className="text-primary">Тип Версии</TableHead><TableHead className="text-right text-primary">Сумма (GH)</TableHead><TableHead className="text-primary">Дата</TableHead><TableHead className="text-primary">Статус</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-foreground/90">{order.id}</TableCell>
                      <TableCell className="text-foreground/90 text-xs">{order.user_username || `User ID: ${order.user_id}`}</TableCell>
                      <TableCell className="text-foreground/90 text-xs">{order.product_name || `Product ID: ${order.product_id}`}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {order.product_pricing_option_duration_days ? `${order.product_pricing_option_duration_days} дн.` : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatVersionType(order.is_pvp)}</TableCell>
                      <TableCell className="text-right font-medium text-red-500 text-xs">-{order.amount_paid_gh.toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatPurchaseDate(order.purchase_date)}</TableCell>
                      <TableCell className={cn("text-xs", 
                        order.status === 'completed' ? 'text-primary' : 
                        order.status === 'pending' ? 'text-orange-400' : 
                        order.status === 'failed' ? 'text-destructive' : 
                        order.status === 'refunded' ? 'text-blue-400' : 'text-muted-foreground'
                      )}>
                        {formatStatus(order.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Заказы не найдены.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
