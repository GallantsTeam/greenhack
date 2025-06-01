
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { ProductPricingOption } from '@/types';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext'; 
import Link from 'next/link';


interface ProductPricingClientProps {
  productName: string;
  productId: number; 
  pveOptions: ProductPricingOption[];
  pvpOptions: ProductPricingOption[];
  defaultMode: 'PVE' | 'PVP' | 'BOTH' | null;
}

const ProductPricingClient: React.FC<ProductPricingClientProps> = ({
  productName,
  productId, 
  pveOptions,
  pvpOptions,
  defaultMode,
}) => {
  const { toast } = useToast();
  const { currentUser, fetchUserDetails } = useAuth(); 

  const [selectedMode, setSelectedMode] = useState<'PVE' | 'PVP'>(defaultMode === 'PVP' ? 'PVP' : 'PVE');
  const [selectedOption, setSelectedOption] = useState<ProductPricingOption | null>(null);


  const activeOptions = selectedMode === 'PVE' ? pveOptions : pvpOptions;

  useEffect(() => {
    if (activeOptions.length > 0) {
      setSelectedOption(activeOptions[0]);
    } else {
      setSelectedOption(null);
    }
  }, [activeOptions, selectedMode]); 

  const handleDurationSelect = (option: ProductPricingOption) => {
    setSelectedOption(option);
  };

  const handleBuyRub = () => {
    toast({
      title: "Оплата временно недоступна",
      description: "Мы работаем над этим. Пожалуйста, попробуйте позже.",
      variant: "default", 
    });
  };

  const formatRubPrice = (price: number) => {
    const formattedNumber = Number.isInteger(price) 
      ? price.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) 
      : price.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${formattedNumber} ₽`;
  };

  const formatGhPrice = (price: number) => {
    const formattedNumber = Number.isInteger(price) 
      ? price.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) 
      : price.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${formattedNumber} GH`;
  };


  const handleBuyGh = async () => {
    if (!currentUser) {
      toast({ title: "Ошибка", description: "Пожалуйста, войдите в аккаунт для покупки за GH.", variant: "destructive" });
      return;
    }
    if (!selectedOption) {
      toast({ title: "Ошибка", description: "Пожалуйста, выберите вариант длительности.", variant: "destructive" });
      return;
    }
    if (currentUser.balance < selectedOption.price_gh) {
      toast({ title: "Недостаточно средств", description: `На вашем балансе ${currentUser.balance.toFixed(2)} GH. Требуется ${selectedOption.price_gh.toFixed(2)} GH.`, variant: "destructive" });
      return;
    }

    try {
      const response = await fetch('/api/purchase/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUser.id, 
          productId: productId, 
          productPricingOptionId: selectedOption.id, 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Не удалось совершить покупку.");
      }
      
      if(currentUser.id) await fetchUserDetails(currentUser.id); 

      toast({
        title: "Покупка успешна!",
        description: `${productName} (${selectedOption.duration_days} дн.) добавлен в ваш инвентарь.`,
        action: (
          <Button variant="link" size="sm" asChild className="text-primary">
            <Link href="/account/inventory">Инвентарь</Link> 
          </Button>
        ),
      });
    } catch (error: any) {
      toast({ title: "Ошибка покупки", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Режим:</p>
        <div className="flex gap-2">
          { (defaultMode === 'PVE' || defaultMode === 'BOTH' || pveOptions.length > 0) && (
            <Button
              variant={selectedMode === 'PVE' ? "default" : "outline"}
              onClick={() => setSelectedMode('PVE')}
              className={cn(selectedMode === 'PVE' ? "bg-primary text-primary-foreground" : "border-primary text-primary hover:bg-primary/10")}
            >
              PVE
            </Button>
          )}
          { (defaultMode === 'PVP' || defaultMode === 'BOTH' || pvpOptions.length > 0) && (
            <Button
              variant={selectedMode === 'PVP' ? "default" : "outline"}
              onClick={() => {
                if (pvpOptions.length > 0) {
                  setSelectedMode('PVP');
                } else {
                  toast({ title: "PVP режим", description: "Данный товар временно недоступен для PVP режима.", variant: "default" });
                }
              }}
              className={cn(selectedMode === 'PVP' ? "bg-primary text-primary-foreground" : "border-primary text-primary hover:bg-primary/10", pvpOptions.length === 0 && "opacity-50 cursor-not-allowed")}
              disabled={pvpOptions.length === 0}
            >
              PVP {pvpOptions.length === 0 && <span className="text-xs ml-1">(недоступно)</span>}
            </Button>
          )}
        </div>
        {selectedMode === 'PVP' && pvpOptions.length === 0 && (
            <p className="text-xs text-destructive mt-1">Товары для PVP режима временно отсутствуют.</p>
        )}
      </div>

      {activeOptions.length > 0 && selectedOption ? (
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Длительность:</p>
          <div className="grid grid-cols-2 gap-2">
            {activeOptions.map((option) => (
              <Button
                key={option.id}
                variant={selectedOption?.id === option.id ? "default" : "outline"}
                onClick={() => handleDurationSelect(option)}
                className={cn(selectedOption?.id === option.id ? "bg-primary text-primary-foreground" : "border-primary text-primary hover:bg-primary/10")}
              >
                {option.duration_days} дн.
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Варианты для выбранного режима отсутствуют.</p>
      )}
      
      {selectedOption && (
        <div className="pt-4 border-t border-border space-y-3">
            <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">Цена RUB:</span>
                <span className="text-2xl font-bold text-primary">{formatRubPrice(selectedOption.price_rub)}</span>
            </div>
             <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">Цена GH:</span>
                <span className="text-2xl font-bold text-primary">{formatGhPrice(selectedOption.price_gh)}</span>
            </div>
          <Button onClick={handleBuyRub} size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Купить за {formatRubPrice(selectedOption.price_rub)}
          </Button>
          <Button onClick={handleBuyGh} size="lg" variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 hover:text-primary/90 shadow-md">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Купить за {formatGhPrice(selectedOption.price_gh)}
          </Button>
        </div>
      )}
       {activeOptions.length === 0 && selectedMode === 'PVE' && (
         <p className="text-sm text-destructive mt-2">Для PVE режима товары не найдены.</p>
       )}
    </div>
  );
};

export default ProductPricingClient;
