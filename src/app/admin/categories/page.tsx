
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Layers, Edit, Trash2, PlusCircle, Search, Loader2, AlertTriangle } from 'lucide-react';
import type { Category } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from 'next/link';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/categories'); 
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || 'Failed to fetch categories');
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
          console.error("Received non-array data from /api/categories:", data);
          setCategories([]);
          throw new Error('Received invalid data structure for categories.');
      }
      setCategories(data);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      setError(error.message || "Не удалось загрузить список категорий.");
      toast({
        title: "Ошибка загрузки категорий",
        description: error.message || "Не удалось получить список категорий.",
        variant: "destructive",
      });
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.id && category.id.toString().includes(searchTerm.toLowerCase()))
  );

  const handleAddCategory = () => {
    router.push('/admin/categories/add');
  };
  
  const handleEditCategory = (slug: string) => {
    router.push(`/admin/categories/${slug}/edit`);
  };

  const handleDeleteCategoryConfirm = async () => {
    if (!categoryToDelete || !categoryToDelete.slug) return;
    setIsLoading(true); // Indicate loading state for deletion
    try {
      const response = await fetch(`/api/admin/categories/${categoryToDelete.slug}`, { method: 'DELETE' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Не удалось удалить категорию.');
      }
      toast({
        title: "Категория удалена",
        description: result.message || `Категория ${categoryToDelete.name} была успешно удалена.`,
      });
      fetchCategories(); // Refresh list after deletion
    } catch (error: any) {
      toast({
        title: "Ошибка удаления",
        description: error.message || "Произошла ошибка при удалении категории.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setCategoryToDelete(null); 
    }
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center">
              <Layers className="mr-2 h-6 w-6" />
              Управление Категориями (Играми)
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Просмотр, добавление, редактирование и удаление категорий.
            </CardDescription>
          </div>
          <Button onClick={handleAddCategory} variant="outline" className="border-primary text-primary hover:bg-primary/10">
            <PlusCircle className="mr-2 h-4 w-4" />
            Добавить категорию
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск по названию, slug или ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full md:w-1/3 bg-background focus:border-primary"
              />
            </div>
          </div>

          {isLoading && categories.length === 0 ? ( // Show loader only if categories haven't been fetched yet
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Загрузка категорий...</p>
            </div>
          ) : error && categories.length === 0 ? (
             <div className="text-center py-8 text-destructive">
                <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
                <p className="font-semibold">Не удалось загрузить категории</p>
                <p className="text-sm">{error}</p>
            </div>
          ) : filteredCategories.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-primary">ID</TableHead>
                    <TableHead className="text-primary">Название</TableHead>
                    <TableHead className="text-primary">Slug</TableHead>
                    <TableHead className="text-primary text-center">Товаров</TableHead>
                    <TableHead className="text-center text-primary">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-foreground/90">{category.id}</TableCell>
                      <TableCell className="text-foreground/90">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{category.slug}</TableCell>
                      <TableCell className="text-center text-foreground/90">{category.product_count || 0}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEditCategory(category.slug)}>
                            <Edit className="h-4 w-4" />
                             <span className="sr-only">Редактировать</span>
                          </Button>
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => setCategoryToDelete(category)} disabled={isLoading}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Удалить</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Это действие нельзя отменить. Категория "{categoryToDelete?.name}" будет удалена. 
                                  Убедитесь, что в категории нет товаров, или они будут отвязаны (если это настроено в БД).
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Отмена</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteCategoryConfirm} className="bg-destructive hover:bg-destructive/90" disabled={isLoading}>
                                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null} Удалить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Категории не найдены {searchTerm && `по запросу "${searchTerm}"`}.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

