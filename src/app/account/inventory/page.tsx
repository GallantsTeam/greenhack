
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Backpack, Loader2, PackageSearch, Trash2, PlayCircle, AlertTriangle, Info, KeyRound, CalendarClock, Timer } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { InventoryItemWithDetails } from "@/types";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';


export default function InventoryPage() {
  const { currentUser, fetchUserDetails } = useAuth();
  const { toast } = useToast();
  const [inventoryItems, setInventoryItems] = useState<InventoryItemWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItemWithDetails | null>(null);
  const [itemToActivate, setItemToActivate] = useState<InventoryItemWithDetails | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState<number | null>(null);

  const fetchInventory = useCallback(async () => {
    if (!currentUser?.id) {
      setIsLoading(false);
      setInventoryItems([]);
      return;
    }
    setIsLoading(true);
    setError(null); // Reset error before fetching
    try {
      const response = await fetch(`/api/user/${currentUser.id}/inventory-items`);
      if (!response.ok) {
        let errorDetailMessage = `HTTP ${response.status}: ${response.statusText || 'Неизвестная ошибка HTTP'}`;
        try {
          const errorData = await response.json();
          if (errorData && typeof errorData.message === 'string' && errorData.message.trim() !== '') {
            errorDetailMessage = errorData.message;
          } else if (errorData) {
            const stringifiedError = JSON.stringify(errorData);
            // Limit length of stringified error to avoid overly long messages
            errorDetailMessage = stringifiedError.length < 256 ? stringifiedError : `Сложный объект ошибки от сервера (Статус: ${response.status})`;
          }
        } catch (jsonError) {
          // If response.json() fails, the body might not be valid JSON or empty.
           errorDetailMessage = `HTTP ${response.status}: ${response.statusText || 'Ошибка ответа сервера (не JSON)'}`;
        }
        // Ensure a non-empty string is set for the error state
        const finalErrorMsg = errorDetailMessage.trim() !== '' ? errorDetailMessage : `HTTP Error ${response.status}: An unexpected issue occurred while fetching inventory.`;
        
        console.error("Error fetching inventory (response not ok):", finalErrorMsg);
        setError(finalErrorMsg); // Set the error state
        toast({ title: "Ошибка загрузки инвентаря", description: finalErrorMsg, variant: "destructive" });
        setInventoryItems([]); // Clear items on error
        setIsLoading(false); // Set loading to false as the fetch attempt finished
        return; // Exit the function
      }
      const data: InventoryItemWithDetails[] = await response.json();
      setInventoryItems(data);
    } catch (err: any) { // This catch block handles network errors or errors from the `throw` above (if it were still there)
      console.error("Error fetching inventory (outer catch):", err);
      let displayErrorMessage = "Не удалось загрузить инвентарь. Произошла неизвестная ошибка.";
      if (err instanceof Error && err.message && err.message.trim() !== '') {
        displayErrorMessage = err.message;
      }
      setError(displayErrorMessage);
      toast({ title: "Ошибка", description: displayErrorMessage, variant: "destructive" });
      setInventoryItems([]); // Clear items on error
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, toast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleActivateItemConfirm = async () => {
    if (!currentUser || !itemToActivate || !itemToActivate.id) return;
    
    if (!itemToActivate.related_product_id && itemToActivate.case_prize_id) {
        toast({ title: "Информация", description: "Этот тип приза (например, баланс GH) активируется автоматически при получении или не требует ручной активации.", variant: "default" });
        setItemToActivate(null);
        return;
    }
    
    setIsProcessingAction(itemToActivate.id);
    try {
      const response = await fetch('/api/inventory/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, inventoryItemId: itemToActivate.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Не удалось активировать предмет. Статус: ${response.statusText}`);
      }
      toast({ title: "Успешно", description: data.message || `${itemToActivate.product_name} активирован!` });
      fetchInventory(); 
      if (currentUser?.id) fetchUserDetails(currentUser.id);
    } catch (error: any) {
      toast({ title: "Ошибка активации", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessingAction(null);
      setItemToActivate(null);
    }
  };

  const handleDeleteItemConfirm = async () => {
    if (!itemToDelete || !currentUser || !itemToDelete.id) return;
    setIsProcessingAction(itemToDelete.id);
    try {
      const response = await fetch('/api/inventory/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, inventoryItemId: itemToDelete.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Не удалось удалить предмет. Статус: ${response.statusText}`);
      }
      toast({ title: "Успешно", description: data.message || `${itemToDelete.product_name} удален из инвентаря.` });
      fetchInventory(); 
    } catch (error: any) {
      toast({ title: "Ошибка удаления", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessingAction(null);
      setItemToDelete(null);
    }
  };

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading && !error) { // Show loader only if not in error state
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height)-var(--footer-height))] p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Загрузка инвентаря...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary tracking-tight">Инвентарь</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center">
            <Backpack className="mr-2 h-6 w-6" />
            Ваши предметы
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Призы, которые вы получили из кейсов или приобрели. Активируйте их, чтобы начать использовать.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && ( // Display error message if error state is set
            <div className="min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-destructive/50 rounded-lg p-6 bg-destructive/10">
              <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
              <p className="text-destructive font-semibold mb-1">Ошибка загрузки инвентаря</p>
              <p className="text-sm text-destructive/80 text-center mb-3">{error}</p>
              <Button onClick={fetchInventory} variant="destructive" size="sm" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : null}
                Попробовать снова
              </Button>
            </div>
          )}
          {!error && inventoryItems.length === 0 && !isLoading && ( // Show "empty" message only if no error and not loading
            <div className="min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6">
              <PackageSearch className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">Ваш инвентарь пуст.</p>
              <p className="text-sm text-muted-foreground">Откройте кейсы или приобретите товары, чтобы пополнить его!</p>
            </div>
          )}
          {!error && inventoryItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {inventoryItems.map((item) => (
                <Card key={item.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-card border-border">
                  <div className="relative w-full aspect-[4/3]">
                    <Image
                      src={item.product_image_url || 'https://placehold.co/400x300.png?text=Предмет'}
                      alt={item.product_name}
                      fill
                      style={{objectFit:"cover"}}
                      className="rounded-t-md"
                      data-ai-hint="game item prize"
                    />
                    {item.is_used && (
                      <Badge variant="default" className="absolute top-2 right-2 bg-primary/80 text-primary-foreground text-xs backdrop-blur-sm">
                        Активирован
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="p-3 flex-grow">
                    <CardTitle className="text-base font-semibold text-foreground truncate" title={item.product_name}>
                      {item.product_name}
                      {item.duration_days && <span className="text-xs text-muted-foreground ml-1">({item.duration_days} дн.)</span>}
                      {item.mode_label && <span className="text-xs text-muted-foreground ml-1">[{item.mode_label}]</span>}
                    </CardTitle>
                     <p className="text-xs text-muted-foreground mt-0.5 flex items-center">
                      <CalendarClock className="h-3 w-3 mr-1"/> Получен: {formatDate(item.acquired_at)}
                    </p>
                    {item.is_used && item.activated_at && (
                      <p className="text-xs text-muted-foreground flex items-center">
                         <PlayCircle className="h-3 w-3 mr-1 text-primary"/> Активирован: {formatDate(item.activated_at)}
                      </p>
                    )}
                    {item.expires_at && (
                        <p className={cn("text-xs flex items-center", new Date(item.expires_at) < new Date() ? "text-destructive" : "text-muted-foreground")}>
                           <Timer className="h-3 w-3 mr-1"/> Истекает: {formatDate(item.expires_at)}
                        </p>
                    )}
                    {item.activation_code && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                          <KeyRound className="h-3 w-3 mr-1"/> Код: <span className="font-mono bg-muted/50 px-1 rounded-sm ml-1">{item.activation_code}</span>
                        </p>
                    )}
                  </CardHeader>
                  <CardContent className="p-3 pt-0 border-t border-border/50">
                    <div className="flex gap-2 mt-2">
                      {!item.is_used && item.related_product_id && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs"
                                  disabled={isProcessingAction === item.id}
                                  onClick={() => setItemToActivate(item)}
                                >
                                  {isProcessingAction === item.id && itemToActivate?.id === item.id ? <Loader2 className="h-3 w-3 animate-spin mr-1.5"/> : <PlayCircle className="h-3 w-3 mr-1.5"/>}
                                  Активировать
                                </Button>
                            </AlertDialogTrigger>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Подтвердите активацию</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    Вы уверены, что хотите активировать "{itemToActivate?.product_name}"? 
                                    {itemToActivate?.duration_days ? ` Срок действия лицензии (${itemToActivate.duration_days} дн.${itemToActivate.mode_label ? `, ${itemToActivate.mode_label}` : ''}) начнет отсчитываться с момента активации.` : ' Этот предмет будет помечен как использованный.'}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setItemToActivate(null)}>Отмена</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleActivateItemConfirm} className="bg-primary hover:bg-primary/90">Активировать</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {!item.is_used && !item.related_product_id && item.case_prize_id && ( 
                        <Button size="sm" className="flex-1 h-8 text-xs bg-muted text-muted-foreground cursor-default" disabled>
                            <Info className="h-3 w-3 mr-1.5"/> Детали приза
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive h-8 text-xs"
                            onClick={() => setItemToDelete(item)}
                            disabled={isProcessingAction === item.id}
                          >
                           {isProcessingAction === item.id && itemToDelete?.id === item.id ? <Loader2 className="h-3 w-3 animate-spin mr-1.5"/> : <Trash2 className="h-3 w-3 mr-1.5"/>}
                            Удалить
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Подтвердите удаление</AlertDialogTitle>
                            <AlertDialogDescription>
                              Вы уверены, что хотите удалить "{itemToDelete?.product_name}" из инвентаря? Это действие нельзя будет отменить.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteItemConfirm} className="bg-destructive hover:bg-destructive/90">Удалить</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
    
    
