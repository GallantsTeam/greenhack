
import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card'; // Removed CardHeader, CardTitle, CardDescription
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

type GameCardProps = {
  game: Category;
};

const GameCard = ({ game }: GameCardProps) => {
  return (
    <Card className="group relative flex flex-col overflow-hidden rounded-xl border-2 border-transparent bg-card shadow-lg transition-all duration-300 hover:border-primary/70 hover:shadow-primary/20 transform hover:-translate-y-1 h-full">
      <Link href={`/games/${game.slug}`} className="flex flex-col flex-grow">
        <div className="relative w-full aspect-[4/3] overflow-hidden">
          <Image
            src={game.imageUrl}
            alt={game.name}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-500 ease-out group-hover:scale-110"
            data-ai-hint={game.dataAiHint || `${game.name} game art`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-300 group-hover:opacity-90" />
          
          {game.logoUrl && (
            <div className="absolute top-3 left-3 bg-card/70 backdrop-blur-sm p-1.5 rounded-md shadow-md">
              <Image
                src={game.logoUrl}
                alt={`${game.name} Logo`}
                width={36}
                height={36}
                objectFit="contain"
                data-ai-hint={`${game.slug} game logo icon`}
              />
            </div>
          )}
        </div>

        <CardContent className="p-4 flex flex-col flex-grow justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate mb-1" title={game.name}>
              {game.name}
            </h3>
            <div className="flex items-center text-xs text-muted-foreground mb-2">
              <Package className="h-3.5 w-3.5 mr-1.5" />
              <span>{game.product_count || 0} товаров</span>
            </div>
          </div>
          
          <div className="mt-3 flex items-center justify-between">
            {game.min_price > 0 ? (
              <p className="text-base font-semibold text-primary">от {game.min_price.toFixed(0)}₽</p>
            ) : (
              <p className="text-base font-semibold text-muted-foreground">Скоро</p>
            )}
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-transparent p-0 h-auto text-sm">
              Подробнее <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default GameCard;
    