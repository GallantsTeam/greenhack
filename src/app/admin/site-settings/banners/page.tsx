
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ImageIcon as ImageIconLucide, Edit, Trash2, PlusCircle, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { SiteBanner } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<SiteBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [bannerToDelete, setBannerToDelete] = useState<SiteBanner | null>(null);

  const fetchBanners = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/site-banners');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch banners' }));
        throw new Error(errorData.message);
      }
      const data: SiteBanner[] = await response.json();
      setBanners(data);
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить список баннеров.");
      toast({ title: "Ошибка загрузки баннеров", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleAddBanner = () => {
    router.push('/admin/site-settings/banners/add');
  };

  const handleEditBanner = (bannerId: number) => {
    router.push(`/admin/site-settings/banners/${bannerId}/edit`);
  };

  const handleDeleteBannerConfirm = async () => {
    if (!bannerToDelete || !bannerToDelete.id) return;
    try {
      const response = await fetch(`/api/admin/site-banners/${bannerToDelete.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to delete banner');
      toast({ title: "Баннер удален", description: `Баннер "${bannerToDelete.title}" был успешно удален.` });
      fetchBanners();
    } catch (error: any) {
      toast({ title: "Ошибка удаления", description: error.message, variant: "destructive" });
    }
    setBannerToDelete(null);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
            <CardTitle className="text-xl font-bold text-primary flex items-center">
                <ImageIconLucide className="mr-2 h-5 w-5" />
                Управление Баннерами
            </CardTitle>
            <CardDescription className="text-muted-foreground">Добавление, редактирование и удаление баннеров для главной страницы.</CardDescription>
        </div>
        <Button onClick={handleAddBanner} variant="outline" className="border-primary text-primary hover:bg-primary/10">
            <PlusCircle className="mr-2 h-4 w-4"/> Добавить новый баннер
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Загрузка баннеров...</p>
          </div>
        ) : error ? (
           <div className="text-center py-8 text-destructive">
              <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
              <p className="font-semibold">Не удалось загрузить баннеры</p>
              <p className="text-sm">{error}</p>
          </div>
        ) : banners.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-primary w-16">Превью</TableHead>
                  <TableHead className="text-primary">Заголовок</TableHead>
                  <TableHead className="text-primary">Порядок</TableHead>
                  <TableHead className="text-primary text-center">Активен</TableHead>
                  <TableHead className="text-center text-primary">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner) => (
                  <TableRow key={banner.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="relative w-12 h-8 overflow-hidden rounded">
                        <Image src={banner.image_url || 'https://placehold.co/100x50.png?text=N/A'} alt={banner.title} layout="fill" objectFit="cover" data-ai-hint="banner preview" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground/90">{banner.title}</TableCell>
                    <TableCell className="text-muted-foreground">{banner.item_order}</TableCell>
                    <TableCell className="text-center">
                        {banner.is_active ? <CheckCircle className="h-5 w-5 text-primary mx-auto" /> : <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => banner.id && handleEditBanner(banner.id)}>
                          <Edit className="h-4 w-4" />
                           <span className="sr-only">Редактировать</span>
                        </Button>
                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => setBannerToDelete(banner)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Удалить</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Это действие нельзя отменить. Баннер "{bannerToDelete?.title}" будет удален.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setBannerToDelete(null)}>Отмена</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteBannerConfirm} className="bg-destructive hover:bg-destructive/90">Удалить</AlertDialogAction>
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
          <p className="text-muted-foreground text-center py-8">Баннеры еще не добавлены.</p>
        )}
      </CardContent>
    </Card>
  );
}
    
    
