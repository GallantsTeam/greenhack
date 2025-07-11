
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { ProductPricingOption } from '@/types';
import { ShoppingCart, Tag, CalendarDays, DollarSign, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '@/components/ui/card'; 

interface ProductPricingClientProps {
  productName: string;
  productId: string; 
  allPricingOptions?: ProductPricingOption[];
}

const ProductPricingClient: React.FC<ProductPricingClientProps> = ({
  productName,
  productId,
  allPricingOptions = [],
}) => {
  const { toast } = useToast();
  const { currentUser, fetchUserDetails } = useAuth();

  const [uniqueModes, setUniqueModes] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  
  const optionsForSelectedMode = useMemo(() => {
    if (!selectedMode || !allPricingOptions) return [];
    return allPricingOptions.filter(opt => {
      const optModeLabel = opt.mode_label?.trim();
      if (selectedMode === 'По умолчанию') {
        return !optModeLabel; // Include options with null or empty mode_label
      }
      return optModeLabel === selectedMode;
    });
  }, [selectedMode, allPricingOptions]);

  const [selectedOption, setSelectedOption] = useState<ProductPricingOption | null>(null);


  useEffect(() => {
    if (allPricingOptions && allPricingOptions.length > 0) {
      const modes = new Set<string>();
      let hasNullOrEmptyMode = false;
      allPricingOptions.forEach(opt => {
        if (opt.mode_label && opt.mode_label.trim() !== '') {
          modes.add(opt.mode_label.trim());
        } else {
          hasNullOrEmptyMode = true;
        }
      });
      
      const distinctModes = Array.from(modes);
      if (hasNullOrEmptyMode && distinctModes.length === 0) { 
        setUniqueModes(['По умолчанию']); 
        setSelectedMode('По умолчанию');
      } else if (hasNullOrEmptyMode && distinctModes.length > 0) { 
        setUniqueModes([...distinctModes, 'По умолчанию']);
        setSelectedMode(distinctModes[0]); 
      } else if (distinctModes.length > 0) { 
        setUniqueModes(distinctModes);
        setSelectedMode(distinctModes[0]);
      } else { 
        setUniqueModes([]);
        setSelectedMode(null);
      }
    } else {
      setUniqueModes([]);
      setSelectedMode(null);
    }
  }, [allPricingOptions]);

  useEffect(() => {
    if (optionsForSelectedMode.length > 0) {
      setSelectedOption(optionsForSelectedMode[0]);
    } else {
      setSelectedOption(null);
    }
  }, [optionsForSelectedMode]);


  const handleModeSelect = (mode: string) => {
    setSelectedMode(mode);
  };

  const handleDurationSelect = (option: ProductPricingOption) => {
    setSelectedOption(option);
  };

  const handleBuyRub = () => {
    // This will now be handled by your main payment gateway integration
    toast({
      title: "Оплата RUB",
      description: "Перенаправление на страницу оплаты...",
      variant: "default", 
    });
    // Simulate redirect or call payment gateway API
    // For example, router.push('/api/payment/initiate?productId=...&optionId=...')
  };

  const handleCustomPayment = (link: string | null | undefined) => {
    if (link && link.trim() !== '' && link.trim() !== '#') {
        window.open(link.trim(), '_blank');
    } else {
      toast({
        title: "Ссылка не настроена",
        description: "Ссылка на оплату для этого способа не указана.",
        variant: "default", 
      });
    }
  };


  const formatPrice = (price: number, currency: 'RUB' | 'GH') => {
    const formattedNumber = Number.isInteger(price) 
      ? price.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) 
      : price.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${formattedNumber} ${currency === 'RUB' ? '₽' : currency}`;
  };


  const handleBuyGh = async () => {
    if (!currentUser) {
      toast({ title: "Ошибка", description: "Пожалуйста, войдите в аккаунт для покупки за GH.", variant: "destructive" });
      return;
    }
    if (!selectedOption) {
      toast({ title: "Ошибка", description: "Пожалуйста, выберите вариант.", variant: "destructive" });
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
        description: `${productName} (${selectedOption.duration_days} дн.${selectedOption.mode_label && selectedOption.mode_label !== 'По умолчанию' ? `, ${selectedOption.mode_label}` : ''}) добавлен в ваш инвентарь.`,
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

  if (allPricingOptions.length === 0) {
    return <p className="text-sm text-muted-foreground">Варианты цен для этого товара еще не добавлены.</p>;
  }

  return (
    <div className="space-y-4">
      {uniqueModes.length > 1 && (
        <div>
          <p className="text-sm font-medium text-foreground mb-2 flex items-center"><Tag className="mr-2 h-4 w-4 text-primary/80"/>Выберите режим:</p>
          <div className="flex flex-wrap gap-2">
            {uniqueModes.map((mode) => (
              <Button
                key={mode}
                variant={selectedMode === mode ? "default" : "outline"}
                onClick={() => handleModeSelect(mode)}
                className={cn(
                  "text-sm px-4 py-2 h-auto", 
                  selectedMode === mode ? "bg-primary text-primary-foreground" : "border-primary text-primary hover:bg-primary/10"
                )}
                size="default"
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>
      )}
      {uniqueModes.length === 1 && selectedMode && selectedMode !== "По умолчанию" && (
         <div>
            <p className="text-sm font-medium text-foreground mb-0 flex items-center"><Tag className="mr-2 h-4 w-4 text-primary/80"/>Режим: <span className="ml-1 font-normal text-muted-foreground">{selectedMode}</span></p>
         </div>
      )}

      {optionsForSelectedMode.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-foreground mb-2 flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary/80"/>Выберите срок:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {optionsForSelectedMode.map((option) => (
              <Button
                key={option.id}
                variant={selectedOption?.id === option.id ? "default" : "outline"}
                onClick={() => handleDurationSelect(option)}
                className={cn(
                  "w-full justify-center text-center h-auto py-2 px-3 text-sm", 
                  selectedOption?.id === option.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-primary text-primary hover:bg-primary/10"
                )}
              >
                {option.duration_days} дн.
              </Button>
            ))}
          </div>
        </div>
      )}
       {optionsForSelectedMode.length === 0 && selectedMode && (
        <p className="text-sm text-muted-foreground mt-2">Варианты для режима "{selectedMode}" отсутствуют.</p>
       )}

      {selectedOption && (
        <Card className="mt-4 bg-muted/20 border-border/30 shadow-inner">
            <CardHeader className="p-3">
                <CardTitle className="text-sm text-muted-foreground text-center">
                    {selectedOption.mode_label && selectedOption.mode_label !== 'По умолчанию' ? `Режим: ${selectedOption.mode_label}` : 'Стандартный режим'}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground text-center">
                    Выбран срок: {selectedOption.duration_days} дн.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-1">
                <div className="flex justify-between items-baseline text-primary font-bold">
                    <span className="text-sm text-muted-foreground flex items-center"><CreditCard className="mr-1.5 h-4 w-4"/>Стоимость:</span>
                    <div className="text-right">
                        {selectedOption.price_rub > 0 && selectedOption.is_rub_payment_visible && <p className="text-lg">{formatPrice(selectedOption.price_rub, 'RUB')}</p>}
                        {selectedOption.price_gh > 0 && selectedOption.is_gh_payment_visible && <p className={cn("text-lg", selectedOption.price_rub > 0 && selectedOption.is_rub_payment_visible && "text-base")}>{formatPrice(selectedOption.price_gh, 'GH')}</p>}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-3 pt-2 flex flex-col gap-2">
                {selectedOption.price_rub > 0 && selectedOption.is_rub_payment_visible && (
                <Button
                    onClick={handleBuyRub}
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Купить за {formatPrice(selectedOption.price_rub, 'RUB')}
                </Button>
                )}
                {selectedOption.price_gh > 0 && selectedOption.is_gh_payment_visible && (
                <Button onClick={handleBuyGh} size="lg" variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 hover:text-primary/90 shadow-md">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Купить за {formatPrice(selectedOption.price_gh, 'GH')}
                </Button>
                )}
                {selectedOption.custom_payment_1_is_visible && selectedOption.custom_payment_1_label && selectedOption.custom_payment_1_price_rub !== null && (
                    <Button onClick={() => handleCustomPayment(selectedOption.custom_payment_1_link)} size="lg" variant="outline" className="w-full border-secondary text-secondary-foreground hover:bg-secondary/10 shadow-md">
                        {selectedOption.custom_payment_1_label} за {formatPrice(selectedOption.custom_payment_1_price_rub, 'RUB')}
                    </Button>
                )}
                {selectedOption.custom_payment_2_is_visible && selectedOption.custom_payment_2_label && selectedOption.custom_payment_2_price_rub !== null && (
                     <Button onClick={() => handleCustomPayment(selectedOption.custom_payment_2_link)} size="lg" variant="outline" className="w-full border-secondary text-secondary-foreground hover:bg-secondary/10 shadow-md">
                        {selectedOption.custom_payment_2_label} за {formatPrice(selectedOption.custom_payment_2_price_rub, 'RUB')}
                    </Button>
                )}
            </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default ProductPricingClient;

