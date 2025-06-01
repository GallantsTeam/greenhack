
import { getCategoryBySlug, getProductsByCategorySlug, getAllCategories } from '@/lib/data';
import type { Product, Category } from '@/types';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, ChevronsRight, GamepadIcon, List, Loader2, ShoppingCart, ShieldQuestion, RefreshCw, Tag, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ProductCard from '@/components/ProductCard'; 
import CategoryScroller from '@/components/CategoryScroller'; 
// Removed Breadcrumbs import

export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map(category => ({ gameId: category.slug }));
}

const statusDetailsMap = {
  safe: { text: 'Безопасен', icon: CheckCircle, colorClass: 'text-primary', badgeClass: 'bg-primary/20 text-primary border-primary/40' },
  updating: { text: 'Обновляется', icon: RefreshCw, colorClass: 'text-orange-400', badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  risky: { text: 'Рискованно', icon: AlertCircle, colorClass: 'text-red-400', badgeClass: 'bg-red-600/20 text-red-400 border-red-600/40' },
  unknown: { text: 'Неизвестно', icon: ShieldQuestion, colorClass: 'text-muted-foreground', badgeClass: 'bg-muted/50 text-muted-foreground border-muted-foreground/30' },
};

export default async function GameDetailPage({ params }: { params: { gameId: string } }) {
  const category = await getCategoryBySlug(params.gameId);

  if (!category) {
    notFound();
  }

  const products = await getProductsByCategorySlug(category.slug);
  const allCategoriesForScroller = await getAllCategories(); 

  // Breadcrumb items definition removed

  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative h-[40vh] md:h-[50vh] lg:h-[60vh] flex items-end px-6 pb-6 md:px-10 md:pb-10 text-white overflow-hidden"> {/* Removed pt-6 md:pt-10 */}
        <Image
          src={category.banner_url || category.imageUrl} 
          alt={`${category.name} Banner`}
          layout="fill"
          objectFit="cover"
          style={{ objectPosition: 'center top' }}
          priority
          className="absolute inset-0 z-0 opacity-40"
          data-ai-hint={`${category.slug} game banner`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent z-10" />
        <div className="container mx-auto relative z-20 flex flex-col md:flex-row items-end justify-between">
          <div className="flex items-center gap-4">
            {category.logoUrl && (
              <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-md overflow-hidden shadow-lg border-2 border-primary/30 bg-card/50 p-1">
                <Image
                  src={category.logoUrl}
                  alt={`${category.name} Logo`}
                  layout="fill"
                  objectFit="contain"
                  data-ai-hint={`${category.slug} game logo`}
                />
              </div>
            )}
            <div>
              {/* Breadcrumbs component removed */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-wider text-foreground [text-shadow:_2px_2px_8px_hsl(var(--background)/0.8)] mt-4 md:mt-0">{category.name}</h1>
            </div>
          </div>
           <div className="mt-4 md:mt-0 md:ml-8 text-muted-foreground max-w-md md:text-right">
            <ul className="space-y-1.5"> 
              {(category.hero_bullet_points && category.hero_bullet_points.length > 0) ? (
                category.hero_bullet_points.map((point, index) => (
                  <li key={index} className="flex items-center justify-end text-lg md:text-xl"> {/* Increased font size */}
                    <ChevronsRight className="h-5 w-5 md:h-6 md:w-6 text-primary mr-1.5 shrink-0" /> {/* Increased icon size */}
                    {point}
                  </li>
                ))
              ) : category.description ? (
                 <li className="flex items-center justify-end text-lg md:text-xl">
                    <ChevronsRight className="h-5 w-5 md:h-6 md:w-6 text-primary mr-1.5 shrink-0" />
                    {category.description.length > 100 ? `${category.description.substring(0, 97)}...` : category.description}
                  </li>
              ) : null}
              {category.min_price > 0 && (
                 <li className="flex items-center justify-end text-lg md:text-xl">
                    <ChevronsRight className="h-5 w-5 md:h-6 md:w-6 text-primary mr-1.5 shrink-0" />
                    Цены от {category.min_price.toFixed(0)}₽
                  </li>
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Category Scroller */}
      <CategoryScroller categories={allCategoriesForScroller} currentSlug={category.slug} />
      
      {/* Products Section */}
      <div className="container mx-auto px-4 py-8">
        <p className="text-sm text-muted-foreground mb-6">
          {products.length} {products.length === 1 ? 'продукт' : products.length >= 2 && products.length <= 4 ? 'продукта' : 'продуктов'}
        </p>
        
        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">Товары для этой игры еще не добавлены.</p>
            <p className="text-sm text-muted-foreground">Загляните позже!</p>
          </div>
        )}
      </div>
    </div>
  );
}

