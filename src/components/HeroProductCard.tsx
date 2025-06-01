
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle, RefreshCw, AlertTriangle, ShieldQuestion } from 'lucide-react';


interface HeroProductCardProps {
  product: Product;
  className?: string;
}

const HeroProductCard = ({ product, className }: HeroProductCardProps) => {
  
  const statusDetails = {
    safe: { text: 'Безопасен', icon: CheckCircle, glow: 'primary', iconColor: 'text-icon-color'},
    updating: { text: 'Обновляется', icon: RefreshCw, glow: 'orange', iconColor: 'text-orange-400'},
    risky: { text: 'Рискованно', icon: AlertTriangle, glow: 'red', iconColor: 'text-red-400'},
    unknown: { text: 'Неизвестно', icon: ShieldQuestion, glow: undefined, iconColor: 'text-muted-foreground'},
  } as const;

  const currentStatus = statusDetails[product.status] || statusDetails.unknown;
  const StatusIcon = currentStatus.icon;


  const glowClasses = {
    primary: 'hover:shadow-[0_0_15px_3px_hsl(var(--icon-color-hsl)/0.4)] border-icon-color', 
    orange: 'hover:shadow-[0_0_15px_3px_rgba(251,146,60,0.4)] border-orange-500/70', 
    red: 'hover:shadow-[0_0_15px_3px_rgba(239,68,68,0.4)] border-red-500/70',
  };
  const effectiveGlowClass = currentStatus.glow ? glowClasses[currentStatus.glow as keyof typeof glowClasses] : 'hover:border-icon-color/50';

  const formatValue = (value: number | undefined | null): string => {
    if (typeof value !== 'number' || value === null || isNaN(value)) {
      return '';
    }
    if (value % 1 === 0) {
      return value.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return value.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); // Keep 2 for consistency or change as needed
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
        "bg-card/70 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg group transition-all duration-300 border-2 border-transparent", 
        effectiveGlowClass,
        className
      )}
    >
      <Link href={`/products/${product.slug}`} className="block h-full flex flex-col">
        <div className="relative w-full h-32 sm:h-36 md:h-40 lg:h-44 xl:h-48"> 
          <Image
            src={product.imageUrl || product.image_url || 'https://placehold.co/300x350.png'}
            alt={product.name}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={product.data_ai_hint || `${product.gameName || 'product'} image`}
          />
        </div>
        <CardContent className="p-2 sm:p-3 md:p-3 flex-grow flex flex-col justify-between"> 
          <div>
            <div className="flex items-baseline gap-1.5 mb-0.5">
                <h4 className="text-sm md:text-base font-normal text-foreground group-hover:text-icon-color transition-colors truncate" title={product.name}>{product.name}</h4>
            </div>
             <span className={cn("text-[10px] sm:text-xs font-medium flex items-center", currentStatus.iconColor)}>
                {StatusIcon && <StatusIcon className="h-3 w-3 inline-block mr-0.5 relative -top-px" />} 
                {currentStatus.text}
            </span>
          </div>
          <div className="flex items-center justify-end text-xs mt-auto pt-1 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-icon-color self-end truncate">
              {formatPriceDisplay(product)}
            </p> 
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default HeroProductCard;
