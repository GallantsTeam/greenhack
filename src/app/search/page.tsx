
'use client';

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useMemo, Suspense } from 'react';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types';
import { AlertCircle, SearchIcon as SearchIconLucide, Loader2 } from 'lucide-react'; // Renamed SearchIcon to avoid conflict if any
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function SearchPageLoadingFallback() {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg text-muted-foreground">Загрузка результатов поиска...</p>
        </div>
    );
}

function SearchResults() {
  const searchParams = useSearchParams();
  const queryTerm = searchParams.get('q');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (queryTerm) {
      setLoading(true);
      setError(null);
      fetch(`/api/search?q=${encodeURIComponent(queryTerm)}`)
        .then(res => {
          if (!res.ok) {
            return res.json().then(errData => {
              throw new Error(errData.message || `Failed to fetch search results: ${res.statusText}`);
            });
          }
          return res.json();
        })
        .then((data: Product[]) => {
          setSearchResults(data);
        })
        .catch(err => {
          console.error("Search fetch error:", err);
          setError(err.message || "Failed to load search results.");
          setSearchResults([]);
        })
        .finally(() => setLoading(false));
    } else {
      setSearchResults([]);
      setLoading(false);
    }
  }, [queryTerm]);

  const titleText = useMemo(() => {
    if (!queryTerm) return "Пожалуйста, введите поисковый запрос.";
    return <>Результаты поиска для: "<span className='text-primary'>{queryTerm}</span>"</>;
  }, [queryTerm]);

  if (loading && queryTerm) {
    return (
      <div className="text-center py-10">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Поиск...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <p className="text-lg text-destructive-foreground">Ошибка поиска:</p>
        <p className="text-sm text-muted-foreground">{error}</p>
         <Button asChild variant="outline" className="mt-6 border-primary text-primary hover:bg-primary/10 hover:text-primary/90">
          <Link href="/games">Посмотреть все игры</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <>
      <Card className="shadow-md bg-card mb-8">
        <CardHeader>
          <CardTitle className="page-title text-xl md:text-2xl text-center text-foreground">
            {titleText}
          </CardTitle>
        </CardHeader>
      </Card>

      {!queryTerm && !loading && (
        <Card>
          <CardContent className="py-10 text-center">
            <SearchIconLucide className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              Используйте панель поиска в шапке для поиска товаров.
            </p>
          </CardContent>
        </Card>
      )}

      {queryTerm && searchResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {searchResults.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {queryTerm && searchResults.length === 0 && !loading && (
         <Card>
          <CardContent className="py-10 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl text-foreground mb-2">Товары по запросу "<span className='text-primary'>{queryTerm}</span>" не найдены.</p>
            <p className="text-muted-foreground mb-6">
              Попробуйте другой поисковый запрос или посмотрите все игры.
            </p>
            <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary/90">
              <Link href="/games">Посмотреть все игры</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}

export default function SearchPage() {
    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <Suspense fallback={<SearchPageLoadingFallback />}>
                <SearchResults />
            </Suspense>
        </div>
    );
}
