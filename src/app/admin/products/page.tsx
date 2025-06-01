
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Edit, Trash2, Eye, PlusCircle, Search, Loader2, AlertTriangle } from 'lucide-react';
import type { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from 'next/link'; 

const statusDetailsMap = {
  safe: { text: 'Безопасен', colorClass: 'text-primary' },
  updating: { text: 'Обновляется', colorClass: 'text-orange-400' },
  risky: { text: 'Рискованно', colorClass: 'text-red-400' },
  unknown: { text: 'Неизвестно', colorClass: 'text-muted-foreground' },
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/products');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || 'Failed to fetch products');
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
          console.error("Received non-array data from /api/admin/products:", data);
          setProducts([]);
          throw new Error('Received invalid data structure for products.');
      }
      setProducts(data);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      setError(error.message || "Не удалось загрузить список товаров.");
      toast({
        title: "Ошибка загрузки товаров",
        description: error.message || "Не удалось получить список товаров.",
        variant: "destructive",
      });
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.gameName && product.gameName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    product.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id.toString().includes(searchTerm.toLowerCase()) 
  );

  const handleEditProduct = (productSlug: string) => {
    router.push(`/admin/products/${productSlug}/edit`);
  };

  const handleDeleteProductConfirm = async () => {
    if (!productToDelete || !productToDelete.slug) return; 
    try {
      const response = await fetch(`/api/admin/products/${productToDelete.slug}`, { method: 'DELETE' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Не удалось удалить товар.');
      }
      toast({
        title: "Товар удален",
        description: result.message || `Товар ${productToDelete.name} был успешно удален.`,
      });
      fetchProducts(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Ошибка удаления",
        description: error.message || "Произошла ошибка при удалении товара.",
        variant: "destructive",
      });
    }
    setProductToDelete(null); 
  };
  
  const handleViewProduct = (slug: string) => {
    router.push(`/products/${slug}`);
  };

  const formatPrice = (price: number | undefined | null, currency: 'GH' | 'RUB'): string => {
    if (typeof price !== 'number' || price === null || isNaN(price)) {
      return '-';
    }
    const formattedNumber = Number.isInteger(price) 
      ? price.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) 
      : price.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); // Keep 2 decimals for GH if needed, or adjust
    return `${formattedNumber} ${currency === 'RUB' ? '₽' : currency}`;
  };
  
  const formatMode = (mode: Product['mode']): string => {
    if (!mode) return 'Не указан';
    switch (mode) {
      case 'PVE': return 'PVE';
      case 'PVP': return 'PVP';
      case 'BOTH': return 'PVP/PVE';
      default: return 'Не указан';
    }
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center">
              <Package className="mr-2 h-6 w-6" />
              Управление Товарами
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Просмотр, добавление, редактирование и удаление товаров.
            </CardDescription>
          </div>
          <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10">
            <Link href="/admin/products/add">
              <PlusCircle className="mr-2 h-4 w-4" />
              Добавить товар
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск по названию, игре, slug или ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full md:w-1/3 bg-background focus:border-primary"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Загрузка товаров...</p>
            </div>
          ) : error ? (
             <div className="text-center py-8 text-destructive">
                <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
                <p className="font-semibold">Не удалось загрузить товары</p>
                <p className="text-sm">{error}</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* <TableHead className="text-primary">ID</TableHead> */}
                    <TableHead className="text-primary">Название</TableHead>
                    <TableHead className="text-primary">Игра</TableHead>
                    <TableHead className="text-primary">Статус</TableHead>
                    <TableHead className="text-primary">Режим</TableHead>
                    <TableHead className="text-right text-primary">Цена в ₽</TableHead>
                    <TableHead className="text-right text-primary">Цена в GH</TableHead>
                    <TableHead className="text-center text-primary">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const statusInfo = statusDetailsMap[product.status] || statusDetailsMap.unknown;
                    return (
                    <TableRow key={product.id} className="hover:bg-muted/30">
                      {/* <TableCell className="font-medium text-foreground/90">{product.id}</TableCell> */}
                      <TableCell className="text-foreground/90 text-sm">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{product.gameName || product.game_slug}</TableCell>
                      <TableCell className={cn("text-xs", statusInfo.colorClass)}>{statusInfo.text}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatMode(product.mode)}</TableCell>
                      <TableCell className="text-right text-foreground/90 text-sm">{formatPrice(product.min_price_rub, 'RUB')}</TableCell>
                      <TableCell className="text-right text-foreground/90 text-sm">{formatPrice(product.min_price_gh, 'GH')}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleViewProduct(product.slug)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Просмотреть</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEditProduct(product.slug)}>
                            <Edit className="h-4 w-4" />
                             <span className="sr-only">Редактировать</span>
                          </Button>
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => setProductToDelete(product)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Удалить</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Это действие нельзя отменить. Товар {productToDelete?.name} будет удален.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setProductToDelete(null)}>Отмена</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteProductConfirm} className="bg-destructive hover:bg-destructive/90">Удалить</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Товары не найдены.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

