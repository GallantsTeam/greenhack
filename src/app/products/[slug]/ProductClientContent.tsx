
'use client'; 

import React, { useState } from 'react'; 
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, RefreshCw, AlertTriangle, ShieldQuestion, ArrowLeft, Edit, Cog, Info, Palette, VenetianMask, Eye, Sparkles, Ticket, MessageSquare } from 'lucide-react'; 
import { cn } from '@/lib/utils';
import ProductPricingClient from '@/components/products/ProductPricingClient';
import GalleryImageClient from './GalleryImageClient';
import ProductCard from '@/components/ProductCard'; 
import type { Product, Category } from '@/types';
import ProductReviewForm from '@/components/products/ProductReviewForm'; 
import ProductReviewsDisplay from '@/components/products/ProductReviewsDisplay'; 

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
    new URL(url.trim());
    return /\.(jpeg|jpg|gif|png|webp)$/i.test(new URL(url.trim()).pathname);
  } catch (e) {
    return false;
  }
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
                    {StatusIcon && <StatusIcon className={cn("h-4 w-4 sm:h-5 sm:w-5", currentStatus.iconColor, product.status === 'updating' || product.status === 'unknown' ? 'animate-pulse' : '')} />}
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
                <ProductPricingClient
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
