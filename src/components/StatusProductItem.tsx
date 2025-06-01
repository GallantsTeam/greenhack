
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, RefreshCw, AlertTriangle, ShieldQuestion, Gamepad2, Computer, Layers3 } from 'lucide-react';

interface StatusProductItemProps {
  product: Product;
  className?: string;
}

const StatusProductItem = ({ product, className }: StatusProductItemProps) => {
  const statusDetailsMap = {
    safe: { text: 'Безопасен', icon: CheckCircle, colorClass: 'text-green-400', badgeClass: 'bg-green-500/10 border-green-500/30' },
    updating: { text: 'На обновлении', icon: RefreshCw, colorClass: 'text-sky-400', badgeClass: 'bg-sky-500/10 border-sky-500/30 animate-pulse' },
    risky: { text: 'Не безопасен', icon: AlertTriangle, colorClass: 'text-red-400', badgeClass: 'bg-red-500/10 border-red-500/30' },
    unknown: { text: 'На обновлении', icon: RefreshCw, colorClass: 'text-sky-400', badgeClass: 'bg-sky-500/10 border-sky-500/30 animate-pulse' },
  };

  const currentStatus = statusDetailsMap[product.status] || statusDetailsMap.unknown;
  const StatusIcon = currentStatus.icon;

  return (
    <Link href={`/products/${product.slug}`} className="block group">
      <Card className={cn("overflow-hidden rounded-lg border bg-card shadow-md hover:shadow-primary/20 transition-shadow duration-300 h-full flex flex-col", className)}>
        {/* Top Section: Game Info & Status */}
        <div className="p-2.5 border-b border-border/30 bg-muted/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {product.gameLogoUrl ? (
                <div className="relative w-5 h-5 shrink-0">
                  <Image 
                    src={product.gameLogoUrl} 
                    alt={`${product.gameName || 'Game'} logo`} 
                    layout="fill" 
                    objectFit="contain"
                    data-ai-hint="game logo"
                  />
                </div>
              ) : (
                <Layers3 className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-grow min-w-0">
                <p className="text-[11px] font-medium text-foreground/80 truncate group-hover:text-primary" title={product.gameName || product.game_slug}>
                  {product.gameName || product.game_slug}
                </p>
                {product.gamePlatform && (
                  <p className="text-[10px] text-muted-foreground/80 flex items-center">
                    {product.gamePlatform.toLowerCase().includes('pc') || product.gamePlatform.toLowerCase().includes('windows') ? 
                     <Computer className="h-2.5 w-2.5 mr-0.5"/> : <Gamepad2 className="h-2.5 w-2.5 mr-0.5"/> }
                    {product.gamePlatform}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 whitespace-nowrap leading-tight", currentStatus.badgeClass, currentStatus.colorClass)}>
              <StatusIcon className={cn("h-2.5 w-2.5 mr-0.5", currentStatus.iconColor)} />
              {currentStatus.text}
            </Badge>
          </div>
        </div>

        {/* Bottom Section: Product Info */}
        <CardContent className="p-3 flex-grow flex items-center gap-2.5">
            {product.imageUrl && (
                <div className="relative w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-md overflow-hidden border border-border/20">
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        layout="fill"
                        objectFit="cover"
                        className="transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={product.data_ai_hint || 'product icon'}
                    />
                </div>
            )}
            <div className="flex-grow min-w-0">
                <p className="text-[10px] text-muted-foreground">Товар:</p>
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate" title={product.name}>
                {product.name}
                </h3>
            </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default StatusProductItem;

