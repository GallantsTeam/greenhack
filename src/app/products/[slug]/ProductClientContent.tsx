
'use client'; 

import React, { useState, useEffect } from 'react'; 
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, RefreshCw, AlertTriangle, ShieldQuestion, ArrowLeft, Edit, Cog, Info, Palette, VenetianMask, Eye, Sparkles, Ticket, MessageSquare } from 'lucide-react'; 
import { cn } from '@/lib/utils';
// ProductPricingClient import removed, it's now part of ProductClientContent
import GalleryImageClient from './GalleryImageClient';
import ProductCard from '@/components/ProductCard'; 
import type { Product, Category, ProductPricingOption } from '@/types';
import ProductReviewForm from '@/components/products/ProductReviewForm'; 
import ProductReviewsDisplay from '@/components/products/ProductReviewsDisplay'; 
import { useToast } from '@/hooks/use-toast'; // Added useToast
import { ShoppingCart } from 'lucide-react'; // Added ShoppingCart

const statusDetailsMap = {
  safe: { text: 'Безопасен', icon: CheckCircle, colorClass: 'text-primary', badgeClass: 'bg-primary/20 text-primary border-primary/40' },
  updating: { text: 'На обновлении', icon: RefreshCw, colorClass: 'text-sky-400', badgeClass: 'bg-sky-500/20 text-sky-400 border-sky-500/40 animate-pulse' },
  risky: { text: 'Не безопасен', icon: AlertTriangle, colorClass: 'text-red-400', badgeClass: 'bg-red-600/20 text-red-400 border-red-600/40' },
  unknown: { text: 'На обновлении', icon: RefreshCw, colorClass: 'text-sky-400', badgeClass: 'bg-sky-500/20 text-sky-400 border-sky-500/40 animate-pulse' },
};

const isValidImageUrl = (url: string | undefined | null): url is string => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false;
  }
  try {
    // Basic check: does it start with http/https and have some common image extension?
    // This is not foolproof but better than just new URL().
    const trimmedUrl = url.trim();
    if (!trimmedUrl.match(/^https?:\/\/.+/i)) {
      console.warn(`isValidImageUrl: URL "${trimmedUrl}" does not start with http/https. Filtering out.`);
      return false;
    }
    // Check for common image extensions. This might need adjustment if you use extension-less URLs.
    const hasExtension = /\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i.test(trimmedUrl);
    if (!hasExtension) {
        console.warn(`isValidImageUrl: URL "${trimmedUrl}" does not seem to have a common image extension. Filtering out for gallery.`);
        // return false; // Temporarily allow extension-less URLs if they are valid resources.
    }
    new URL(trimmedUrl); // This will throw if the URL is fundamentally malformed
    return true;
  } catch (e) {
    console.warn(`isValidImageUrl: URL "${url}" is invalid or malformed. Error: ${e}. Filtering out.`);
    return false;
  }
};


interface ProductPricingClientInternalProps {
  productName: string;
  productId: string; 
  allPricingOptions?: ProductPricingOption[];
}

const ProductPricingClientInternal: React.FC<ProductPricingClientInternalProps> = ({
  productName,
  productId,
  allPricingOptions = [],
}) => {
  const { toast } = useToast();
  const { currentUser, fetchUserDetails } = useAuth();

  const [uniqueModes, setUniqueModes] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  
  const optionsForSelectedMode = React.useMemo(() => {
    if (!selectedMode || !allPricingOptions) return [];
    return allPricingOptions.filter(opt => {
      const optModeLabel = opt.mode_label?.trim();
      if (selectedMode === 'По умолчанию') {
        return !optModeLabel; 
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

  const handleBuyRub = async () => {
    if (!selectedOption) {
      toast({ title: "Ошибка", description: "Пожалуйста, выберите вариант.", variant: "destructive" });
      return;
    }
    if (!currentUser) {
      toast({ title: "Требуется вход", description: "Для покупки необходимо авторизоваться.", variant: "default" });
      // Consider redirecting to login or opening login modal
      return;
    }
    
    // Redirect to balance page if test mode is active and RUB payment is chosen
    const paymentSettingsRes = await fetch('/api/admin/site-settings/payment');
    if (paymentSettingsRes.ok) {
        const paymentSettings = await paymentSettingsRes.json();
        if (paymentSettings?.is_test_mode_active) {
            toast({ title: "Тестовый режим", description: "Оплата RUB в тестовом режиме невозможна. Пополните баланс GH.", variant: "default" });
            // router.push('/account/balance'); // Option to redirect
            return;
        }
    } else {
        console.warn("Failed to fetch payment settings before RUB purchase.");
    }

    // Call YooMoney payment creation
    try {
      const response = await fetch('/api/payment/create-yoomoney-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          amountRub: selectedOption.price_rub, // Assuming you'll handle RUB amount on backend
          productId: productId,
          productPricingOptionId: selectedOption.id,
          description: `Покупка товара: ${productName} (${selectedOption.duration_days} дн.)`
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Не удалось создать платеж YooMoney.");
      }
      if (result.confirmation_url) {
        window.location.href = result.confirmation_url;
      } else {
        toast({ title: "Ошибка платежа", description: "Не удалось получить ссылку на оплату.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Ошибка при оплате RUB", description: error.message, variant: "destructive" });
    }
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


interface ProductClientContentProps {
  product: Product;
  category: Category | undefined;
  relatedProducts: Product[];
}

const ProductClientContent: React.FC<ProductClientContentProps> = ({ product, category, relatedProducts }) => {
  const { currentUser } = useAuth();
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0); 

  const currentStatus = statusDetailsMap[product.status] || statusDetailsMap.unknown;
  const StatusIcon = currentStatus.icon;

  const validGalleryImageUrls = (product.gallery_image_urls?.map(url => url.trim()).filter(isValidImageUrl) || []);
  
  const handleReviewSubmitted = () => {
    setReviewRefreshTrigger(prev => prev + 1); 
  };

  const FunctionSection: React.FC<{title?: string | null, description?: string | null, functions?: string[] | null, icon?: React.ElementType}> = 
    ({ title, description, functions, icon: IconComponent }) => {
    if (!title || !functions || functions.length === 0) return null;
    return (
      <div className="p-4 border border-border/30 rounded-md bg-card/50 shadow-sm">
        <h4 className="text-md font-semibold text-primary mb-1.5 flex items-center">
          {IconComponent && <IconComponent className="mr-2 h-5 w-5 text-primary/80"/>}
          {title}
        </h4>
        {description && <p className="text-xs text-muted-foreground mb-2">{description}</p>}
        <div className="flex flex-wrap gap-2">
          {functions.map((func, idx) => (
            <Badge key={`${title}-${idx}`} variant="outline" className="border-primary/50 text-foreground/90 text-xs">
              {func}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10">
          <Link href={category ? `/games/${category.slug}` : "/games"}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к {category ? category.name : 'Каталогу'}
          </Link>
        </Button>
        {currentUser?.role === 'admin' && (
          <Button asChild variant="outline" className="border-icon-color text-icon-color hover:bg-icon-color/10 hover:text-icon-color/90">
            <Link href={`/admin/products/${product.slug}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Редактировать товар
            </Link>
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-xl overflow-hidden">
            <CardHeader className="p-6 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-1">{product.name}</h1>
                  {category && (
                    <Link href={`/games/${category.slug}`} className="text-sm text-muted-foreground hover:text-primary transition-colors block mb-2 sm:mb-0">
                      Категория: {category.name}
                    </Link>
                  )}
                </div>
                 <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    {StatusIcon && <StatusIcon className={cn("h-4 w-4 sm:h-5 sm:w-5", currentStatus.colorClass, product.status === 'updating' || product.status === 'unknown' ? 'animate-pulse' : '')} />}
                    <span className={cn("text-xs sm:text-sm font-medium", currentStatus.colorClass)}>
                      {product.status_text || currentStatus.text}
                    </span>
                </div>
              </div>
            </CardHeader>

            {validGalleryImageUrls && validGalleryImageUrls.length > 0 && (
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-3 uppercase">Галерея (Меню софта)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {validGalleryImageUrls.map((url, index) => (
                     <GalleryImageClient key={index} src={url} alt={`${product.name} - Gallery image ${index + 1}`} />
                  ))}
                </div>
              </CardContent>
            )}
            
            <CardContent className="p-6 border-t border-border">
              <h3 className="text-xl font-bold text-foreground mb-3 uppercase">Описание</h3>
              {product.long_description ? (
                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80" dangerouslySetInnerHTML={{ __html: product.long_description }} />
              ) : product.short_description ? (
                <p className="text-foreground/80">{product.short_description}</p>
              ) : (
                <p className="text-muted-foreground">Описание для этого товара еще не добавлено.</p>
              )}
            </CardContent>


            { (product.functions_aim_title && product.functions_aim && product.functions_aim.length > 0) || 
              (product.functions_esp_title && product.functions_wallhack && product.functions_wallhack.length > 0) || 
              (product.functions_misc_title && product.functions_misc && product.functions_misc.length > 0) ? (
              <CardContent className="p-6 border-t border-border">
                <h3 className="text-xl font-bold text-foreground mb-4 uppercase">Функционал</h3>
                 <div className="space-y-4">
                    <FunctionSection 
                        title={product.functions_aim_title} 
                        description={product.functions_aim_description}
                        functions={product.functions_aim}
                        icon={VenetianMask} 
                    />
                    <FunctionSection 
                        title={product.functions_esp_title} 
                        description={product.functions_esp_description}
                        functions={product.functions_wallhack}
                        icon={Eye} 
                    />
                    <FunctionSection 
                        title={product.functions_misc_title} 
                        description={product.functions_misc_description}
                        functions={product.functions_misc}
                        icon={Sparkles} 
                    />
                 </div>
              </CardContent>
            ) : null }
          </Card>

          <ProductReviewsDisplay 
            productId={product.slug} 
            productName={product.name} 
            refreshTrigger={reviewRefreshTrigger}
          />

          <ProductReviewForm 
            productId={product.slug} 
            productName={product.name} 
            onReviewSubmitted={handleReviewSubmitted}
          />


          <div className="mt-8">
             <h3 className="text-xl text-foreground font-bold uppercase mb-4">Похожие товары</h3>
             {relatedProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {relatedProducts.map((relatedProd) => (
                        <ProductCard key={relatedProd.id} product={relatedProd} />
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground">Других товаров в этой категории пока нет.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-primary flex items-center font-bold uppercase"><Ticket className="mr-2 h-6 w-6"/>Стоимость</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductPricingClientInternal
                  productName={product.name}
                  productId={product.id} 
                  allPricingOptions={product.pricing_options || []}
                />
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                  <CardTitle className="text-xl text-primary flex items-center font-bold uppercase"><Info className="mr-2 h-6 w-6"/>Важно</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-foreground/80">
                {product.system_os && <p><strong className="text-foreground/90">Система:</strong> {product.system_os}</p>}
                {product.system_build && <p><strong className="text-foreground/90">Сборка:</strong> {product.system_build}</p>}
                {product.system_gpu && <p><strong className="text-foreground/90">Видеокарта:</strong> {product.system_gpu}</p>}
                {product.system_cpu && <p><strong className="text-foreground/90">Процессор:</strong> {product.system_cpu}</p>}
                {!product.system_os && !product.system_build && !product.system_gpu && !product.system_cpu && (
                  <p className="text-muted-foreground">Требования к системе не указаны.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductClientContent;

