
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { Card, CardContent, CardTitle } from '@/components/ui/card'; 
import { cn } from '@/lib/utils';
import { CheckCircle, RefreshCw, AlertTriangle, ShieldQuestion, ShoppingCart, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';


interface ProductCardProps {
  product: Product;
  className?: string;
}

const ProductCard = ({ product, className }: ProductCardProps) => {
  const statusDetailsMap = {
    safe: { text: 'Безопасен', icon: CheckCircle, glow: 'primary', iconColor: 'text-icon-color', badgeClass: 'bg-primary/20 text-primary border-primary/40' },
    updating: { text: 'На обновлении', icon: RefreshCw, glow: 'sky', iconColor: 'text-sky-400', badgeClass: 'bg-sky-500/20 text-sky-400 border-sky-500/40 animate-pulse' },
    risky: { text: 'Не безопасен', icon: AlertTriangle, glow: 'red', iconColor: 'text-red-400', badgeClass: 'bg-red-600/20 text-red-400 border-red-600/40' },
    unknown: { text: 'На обновлении', icon: RefreshCw, glow: 'sky', iconColor: 'text-sky-400', badgeClass: 'bg-sky-500/20 text-sky-400 border-sky-500/40 animate-pulse' },
  };

  const currentStatus = statusDetailsMap[product.status] || statusDetailsMap.unknown;
  const StatusIcon = currentStatus.icon;


  const glowClasses = {
    primary: 'hover:shadow-[0_0_15px_3px_hsl(var(--icon-color-hsl)/0.4)] border-icon-color', 
    orange: 'hover:shadow-[0_0_15px_3px_rgba(251,146,60,0.4)] border-orange-500/70', 
    red: 'hover:shadow-[0_0_15px_3px_rgba(239,68,68,0.4)] border-red-500/70',
    sky: 'hover:shadow-[0_0_15px_3px_rgba(56,189,248,0.4)] border-sky-500/70', 
  };
  const effectiveGlowClass = currentStatus.glow ? glowClasses[currentStatus.glow as keyof typeof glowClasses] : 'hover:border-icon-color/50';

  const formatValue = (value: number | undefined | null): string => {
    if (typeof value !== 'number' || value === null || isNaN(value)) {
      return '';
    }
    if (value % 1 === 0) {
      return value.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return value.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatPriceDisplay = (product: Product) => {
    const hasRubPrice = product.min_price_rub !== undefined && product.min_price_rub !== null && product.min_price_rub >= 0;
    const hasGhPrice = product.min_price_gh !== undefined && product.min_price_gh !== null && product.min_price_gh >= 0;

    const rubPriceFormatted = hasRubPrice ? `${formatValue(product.min_price_rub!)} ₽` : '';
    const ghPriceFormatted = hasGhPrice ? `${formatValue(product.min_price_gh!)} GH` : '';

    if (hasRubPrice && hasGhPrice) {
      return `от ${rubPriceFormatted} / ${ghPriceFormatted}`;
    }
    if (hasRubPrice) {
      return `от ${rubPriceFormatted}`;
    }
    if (hasGhPrice) {
      return `от ${ghPriceFormatted}`;
    }
    return product.price_text || 'Подробнее';
  };

  return (
    <Card
      className={cn(
        "overflow-hidden shadow-lg hover:shadow-primary/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 h-full flex flex-col border-2 border-card hover:border-icon-color/70 rounded-xl group",
        effectiveGlowClass,
        className
      )}
    >
      <Link href={`/products/${product.slug}`} className="block flex flex-col flex-grow">
        <div className="relative w-full h-52 md:h-56 overflow-hidden">
          <Image
            src={product.imageUrl || product.image_url || 'https://placehold.co/400x300.png'}
            alt={product.name}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-500 ease-out group-hover:scale-110"
            data-ai-hint={product.data_ai_hint || `${product.name} game art`}
          />
           {product.gameLogoUrl && (
            <div className="absolute top-3 right-3 bg-background/80 p-1.5 rounded-md shadow-md">
              <Image src={product.gameLogoUrl} alt={`${product.gameName || 'Game'} logo`} width={28} height={28} data-ai-hint="game logo icon"/>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-grow justify-between bg-card/50">
          <div>
            <CardTitle className="text-lg md:text-xl font-semibold text-icon-color group-hover:text-primary transition-colors mb-1 truncate" title={product.name}>
              {product.name}
            </CardTitle>
            <Badge variant={currentStatus.badgeClass?.includes('primary') ? 'default' : currentStatus.badgeClass?.includes('orange') || currentStatus.badgeClass?.includes('sky') ? 'secondary' : currentStatus.badgeClass?.includes('red') ? 'destructive' : 'outline'} className={cn("text-xs py-0.5 px-2 mb-2", currentStatus.badgeClass)}>
                {StatusIcon && <StatusIcon className={cn("h-3 w-3 mr-1", currentStatus.iconColor, product.status === 'updating' || product.status === 'unknown' ? 'animate-pulse' : '')} />}
                {currentStatus.text}
            </Badge>
            {product.short_description && (
              <CardContent className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2 p-0">
                {product.short_description}
              </CardContent>
            )}
          </div>
          <div className="mt-auto flex items-center justify-between pt-2">
             <p className="text-base md:text-lg font-bold text-icon-color">{formatPriceDisplay(product)}</p>
            <Button variant="ghost" size="sm" className="text-icon-color hover:text-primary/80 hover:bg-transparent p-0 h-auto text-sm">
              Перейти <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Link>
    </Card>
  );
};

export default ProductCard;
