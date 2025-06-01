
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Loader2, AlertTriangle, CheckCircle, RefreshCw, ShieldQuestion } from 'lucide-react';
import type { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import StatusProductItem from '@/components/StatusProductItem';
// Removed Breadcrumbs import
import { Button } from '@/components/ui/button';

export default function StatusesPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'safe' | 'updating' | 'risky'>('safe');
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch products' }));
        throw new Error(errorData.message || 'Failed to fetch products');
      }
      const data: Product[] = await response.json();
      setAllProducts(data);
    } catch (err: any) {
      console.error("Error fetching products for statuses page:", err);
      setError(err.message || "Не удалось загрузить список товаров.");
      toast({ title: "Ошибка загрузки", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    if (activeTab === 'safe') {
      return allProducts.filter(p => p.status === 'safe');
    }
    if (activeTab === 'updating') {
      return allProducts.filter(p => p.status === 'updating' || p.status === 'unknown');
    }
    if (activeTab === 'risky') {
      return allProducts.filter(p => p.status === 'risky');
    }
    return [];
  }, [allProducts, activeTab]);

  // Breadcrumb items definition removed

  if (isLoading && allProducts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8 text-center min-h-[calc(100vh-var(--header-height)-var(--footer-height))] flex flex-col justify-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Загрузка статусов...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <section className="relative py-16 md:py-24 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-primary/20 via-primary/5 to-background border-b border-border/20">
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-2xl mx-auto">
            {/* Breadcrumbs component removed */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary uppercase tracking-wider mb-4 md:mb-6 [text-shadow:_1px_1px_8px_hsl(var(--primary)/0.5)]">
              Статус Читов
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Актуальная информация о безопасности и работоспособности наших продуктов.
            </p>
          </div>
        </div>
      </section>
      
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex justify-center mb-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'safe' | 'updating' | 'risky')} className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-3 bg-card/80 backdrop-blur-sm border border-border/30 shadow-sm rounded-lg">
                <TabsTrigger value="safe" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-muted-foreground hover:bg-muted/50 rounded-md">Безопасные</TabsTrigger>
                <TabsTrigger value="updating" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-muted-foreground hover:bg-muted/50 rounded-md">На обновлении</TabsTrigger>
                <TabsTrigger value="risky" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-muted-foreground hover:bg-muted/50 rounded-md">Не безопасные</TabsTrigger>
            </TabsList>
            </Tabs>
        </div>

        {isLoading && filteredProducts.length === 0 ? (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        ) : error ? (
          <div className="text-center py-10 text-destructive">
            <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
            <p className="font-semibold">Не удалось загрузить статусы товаров</p>
            <p className="text-sm">{error}</p>
            <Button onClick={() => fetchProducts()} variant="outline" className="mt-4">Попробовать снова</Button>
          </div>
        ) : (
          <div className="mt-0">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                {filteredProducts.map((product) => (
                  <StatusProductItem key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">
                  Товаров со статусом "{
                    activeTab === 'safe' ? 'Безопасные' : 
                    activeTab === 'updating' ? 'На обновлении' : 
                    'Не безопасные'
                  }" не найдено.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

