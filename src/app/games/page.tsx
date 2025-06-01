
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import GameCard from '@/components/GameCard';
import type { Category } from '@/types';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card'; 
import { AlertCircle, Loader2, Search as SearchIcon, LayoutGrid } from 'lucide-react';
// Removed Breadcrumbs import
import CategoryScroller from '@/components/CategoryScroller';

const GamesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const categoriesRes = await fetch('/api/categories');
        if (!categoriesRes.ok) {
          const categoriesErr = await categoriesRes.json().catch(() => ({ message: `Failed to fetch categories: ${categoriesRes.statusText}`}));
          throw new Error(categoriesErr.message || 'Failed to fetch categories');
        }
        const categoriesData = await categoriesRes.json();
        setAllCategories(categoriesData);
      } catch (err: any) {
        console.error("Failed to fetch categories for GamesPage:", err);
        setError(err.message || "An unknown error occurred while fetching categories.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredCategories = useMemo(() => {
    return allCategories.filter(category => {
      const searchLower = searchTerm.toLowerCase();
      return searchTerm === '' || 
             category.name.toLowerCase().includes(searchLower) ||
             category.slug.toLowerCase().includes(searchLower) ||
             (category.description && category.description.toLowerCase().includes(searchLower));
    });
  }, [allCategories, searchTerm]);

  // Breadcrumb items definition removed

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8 text-center min-h-[calc(100vh-var(--header-height)-var(--footer-height))] flex flex-col justify-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Загрузка категорий...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8 text-center min-h-[calc(100vh-var(--header-height)-var(--footer-height))] flex flex-col justify-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <p className="text-lg text-destructive-foreground">Ошибка загрузки данных:</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section for Catalog */}
      <section className="relative py-16 md:py-24 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-primary/20 via-primary/5 to-background border-b border-border/20">
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-2xl mx-auto">
            {/* Breadcrumbs component removed */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary uppercase tracking-wider mb-4 md:mb-6 [text-shadow:_1px_1px_8px_hsl(var(--primary)/0.5)]">
              Каталог
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              В каталоге все игры, представленные на сайте. Выберите интересующую вас игру, чтобы увидеть доступные товары.
            </p>
            <div className="relative max-w-md mx-auto">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Поиск по играм..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 text-base h-12 rounded-lg bg-card/70 border-border focus:border-primary text-foreground placeholder:text-muted-foreground shadow-md focus:shadow-primary/30 transition-shadow"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Scroller */}
      <CategoryScroller categories={allCategories} className="border-b border-border/20 shadow-sm" />
      
      {/* Categories Grid */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredCategories.map((category) => (
              <GameCard key={category.id} game={category} /> 
            ))}
          </div>
        ) : (
          <Card className="bg-card/50 border-border/30">
            <CardContent className="py-12 text-center">
              <LayoutGrid className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
              <p className="text-xl text-foreground mb-2">
                {`Игры по запросу "${searchTerm}" не найдены.`}
              </p>
              <p className="text-muted-foreground">
                Попробуйте другой поисковый запрос или просмотрите все доступные категории.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GamesPage;
    
    
