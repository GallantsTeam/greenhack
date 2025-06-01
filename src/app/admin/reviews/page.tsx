
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Edit, Trash2, PlusCircle, Search, Loader2, AlertTriangle, CheckCircle, XCircle, Star, RefreshCw } from 'lucide-react';
import type { Review } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge'; // Added import for Badge

type ReviewStatus = 'pending' | 'approved' | 'rejected';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<ReviewStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [reviewToUpdateStatus, setReviewToUpdateStatus] = useState<{ review: Review, newStatus: ReviewStatus } | null>(null);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/reviews');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch reviews' }));
        throw new Error(errorData.message);
      }
      const data: Review[] = await response.json();
      setReviews(data.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить список отзывов.");
      toast({ title: "Ошибка загрузки", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const filteredReviews = reviews.filter(review => {
    const matchesTab = activeTab === 'all' || review.status === activeTab;
    const matchesSearch = searchTerm === '' ||
      review.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.text.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleStatusUpdateConfirm = async () => {
    if (!reviewToUpdateStatus) return;
    const { review, newStatus } = reviewToUpdateStatus;
    
    setIsLoading(true); // Indicate loading for this specific action
    try {
      const apiUrl = newStatus === 'approved' 
        ? `/api/admin/reviews/${review.id}/approve` 
        : `/api/admin/reviews/${review.id}/reject`;
      
      const response = await fetch(apiUrl, { method: 'PUT' });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || `Не удалось ${newStatus === 'approved' ? 'одобрить' : 'отклонить'} отзыв.`);
      toast({ description: result.message });
      fetchReviews(); // Refresh list
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setReviewToUpdateStatus(null);
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (!reviewToDelete) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewToDelete.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Не удалось удалить отзыв.');
      toast({ description: result.message });
      fetchReviews(); // Refresh list
    } catch (error: any) {
      toast({ title: "Ошибка удаления", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setReviewToDelete(null);
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
  };
  
  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={cn("h-4 w-4", rating >= star ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/50")} />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center">
              <MessageSquare className="mr-2 h-6 w-6" />
              Управление Отзывами
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Просмотр, одобрение, отклонение и удаление отзывов пользователей.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchReviews} variant="outline" size="icon" className="border-primary text-primary hover:bg-primary/10" disabled={isLoading}>
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <Link href="/admin/reviews/add">
                <PlusCircle className="mr-2 h-4 w-4" />
                Добавить отзыв
                </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск по пользователю, товару или тексту..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full md:w-1/3 bg-background focus:border-primary"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReviewStatus | 'all')}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
              <TabsTrigger value="all">Все</TabsTrigger>
              <TabsTrigger value="pending">На модерации</TabsTrigger>
              <TabsTrigger value="approved">Одобренные</TabsTrigger>
              <TabsTrigger value="rejected">Отклоненные</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading && reviews.length === 0 ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Загрузка отзывов...</p></div>
          ) : error ? (
             <div className="text-center py-8 text-destructive"><AlertTriangle className="mx-auto h-10 w-10 mb-2" /><p className="font-semibold">Не удалось загрузить отзывы</p><p className="text-sm">{error}</p></div>
          ) : filteredReviews.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-primary">Пользователь</TableHead>
                    <TableHead className="text-primary">Товар</TableHead>
                    <TableHead className="text-primary text-center">Рейтинг</TableHead>
                    <TableHead className="text-primary max-w-xs">Текст</TableHead>
                    <TableHead className="text-primary">Статус</TableHead>
                    <TableHead className="text-primary">Дата</TableHead>
                    <TableHead className="text-center text-primary">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review) => (
                    <TableRow key={review.id} className="hover:bg-muted/30">
                      <TableCell className="text-sm text-foreground/90">{review.username}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{review.product_name}</TableCell>
                      <TableCell className="text-center"><StarRating rating={review.rating} /></TableCell>
                      <TableCell className="text-xs text-foreground/80 max-w-xs truncate" title={review.text}>{review.text}</TableCell>
                      <TableCell>
                        <Badge variant={review.status === 'approved' ? 'default' : review.status === 'rejected' ? 'destructive' : 'secondary'} className={cn(review.status === 'approved' && 'bg-primary/80 text-primary-foreground', review.status === 'pending' && 'bg-orange-500/80 text-white')}>
                          {review.status === 'pending' ? 'На модерации' : review.status === 'approved' ? 'Одобрен' : 'Отклонен'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(review.created_at)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {review.status === 'pending' && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500 hover:bg-green-500/10" onClick={() => setReviewToUpdateStatus({ review, newStatus: 'approved' })} disabled={isLoading}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-500/10" onClick={() => setReviewToUpdateStatus({ review, newStatus: 'rejected' })} disabled={isLoading}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {review.status === 'rejected' && (
                             <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500 hover:bg-green-500/10" onClick={() => setReviewToUpdateStatus({ review, newStatus: 'approved' })} disabled={isLoading}>
                                <CheckCircle className="h-4 w-4" /> <span className="sr-only">Одобрить</span>
                              </Button>
                          )}
                           {review.status === 'approved' && (
                             <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-500/10" onClick={() => setReviewToUpdateStatus({ review, newStatus: 'rejected' })} disabled={isLoading}>
                                <XCircle className="h-4 w-4" /> <span className="sr-only">Отклонить</span>
                              </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => setReviewToDelete(review)} disabled={isLoading}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Отзывы не найдены.</p>
          )}
        </CardContent>
      </Card>

      {reviewToDelete && (
        <AlertDialog open={!!reviewToDelete} onOpenChange={(open) => !open && setReviewToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Удалить отзыв?</AlertDialogTitle>
                <AlertDialogDescription>
                    Вы уверены, что хотите удалить этот отзыв от пользователя {reviewToDelete.username} на товар "{reviewToDelete.product_name}"? Это действие нельзя отменить.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setReviewToDelete(null)}>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Удалить</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
      {reviewToUpdateStatus && (
        <AlertDialog open={!!reviewToUpdateStatus} onOpenChange={(open) => !open && setReviewToUpdateStatus(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Изменить статус отзыва?</AlertDialogTitle>
                <AlertDialogDescription>
                    Вы уверены, что хотите {reviewToUpdateStatus.newStatus === 'approved' ? 'одобрить' : 'отклонить'} этот отзыв?
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setReviewToUpdateStatus(null)}>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={handleStatusUpdateConfirm} className={cn(reviewToUpdateStatus.newStatus === 'approved' ? "bg-primary hover:bg-primary/90" : "bg-destructive hover:bg-destructive/90")}>
                    {reviewToUpdateStatus.newStatus === 'approved' ? 'Одобрить' : 'Отклонить'}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

