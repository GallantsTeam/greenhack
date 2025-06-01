'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingBag, Loader2 } from "lucide-react"; 
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import type { Purchase } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface PurchaseHistoryItem extends Purchase {
  product_name?: string; // Optional, as it's joined
  product_pricing_option_duration_days?: number; // Optional
}


export default function PurchaseHistoryPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentUser?.id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`/api/user/${currentUser.id}/purchase-history`);
        if (!response.ok) {
          throw new Error('Failed to fetch purchase history');
        }
        const data: PurchaseHistoryItem[] = await response.json();
        setPurchaseHistory(data);
      } catch (error) {
        console.error("Error fetching purchase history:", error);
        toast({ title: "Ошибка", description: "Не удалось загрузить историю покупок.", variant: "destructive" });
        setPurchaseHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [currentUser?.id, toast]);


  const formatPurchaseDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary tracking-tight">История Покупок</h1>
      <Card className="shadow-lg">
        <CardHeader>
           <CardTitle className="text-xl text-primary flex items-center">
            <ShoppingBag className="mr-2 h-6 w-6"/>
            Ваши транзакции
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Список всех ваших покупок товаров и услуг.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="min-h-[200px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : purchaseHistory.length > 0 ? (
            <ul className="space-y-4">
              {purchaseHistory.map((purchase) => (
                <li key={purchase.id} className="p-4 border border-border rounded-md shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                      <h4 className="text-lg font-semibold text-foreground">
                        {purchase.product_name || `Товар ID: ${purchase.product_id}`}
                        {purchase.product_pricing_option_duration_days && ` (${purchase.product_pricing_option_duration_days} дн.)`}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Дата: {formatPurchaseDate(purchase.purchase_date)}
                      </p>
                    </div>
                    <div className="mt-2 sm:mt-0 text-right">
                      <p className="text-lg font-bold text-primary">
                        -{purchase.amount_paid_gh.toFixed(2)} <span className="text-gradient-gh">GH</span>
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {purchase.status === 'completed' ? 'Завершено' : purchase.status}
                      </p>
                    </div>
                  </div>
                  {purchase.description && (
                     <p className="text-xs text-muted-foreground mt-1 pt-1 border-t border-dashed border-border/50">{purchase.description}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="min-h-[200px] flex items-center justify-center border-2 border-dashed border-border rounded-lg">
              <p className="text-muted-foreground">История покупок пока пуста.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
