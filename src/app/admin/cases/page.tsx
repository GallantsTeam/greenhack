
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Palette, Edit, Trash2, PlusCircle, Search, Loader2, AlertTriangle, CheckCircle, XCircle, Flame } from 'lucide-react'; // Added Flame
import type { CaseItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
// Import AlertDialog components later when delete functionality is fully implemented

export default function AdminCasesPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  // const [caseToDelete, setCaseToDelete] = useState<CaseItem | null>(null); // For delete confirmation modal

  const fetchCases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/cases');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || 'Failed to fetch cases');
      }
      const data: CaseItem[] = await response.json();
      setCases(data);
    } catch (error: any) {
      console.error("Error fetching cases:", error);
      setError(error.message || "Не удалось загрузить список кейсов.");
      toast({
        title: "Ошибка загрузки кейсов",
        description: error.message || "Не удалось получить список кейсов.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const filteredCases = cases.filter(caseItem =>
    caseItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caseItem.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCase = () => {
    router.push('/admin/cases/add');
  };
  
  const handleEditCase = (caseId: string) => {
    router.push(`/admin/cases/${caseId}/edit`);
  };

  const handleDeleteCase = (caseItem: CaseItem) => {
    // setCaseToDelete(caseItem); // For confirmation modal
    toast({ title: "Удаление в разработке", description: `Удаление кейса ${caseItem.name} будет доступно позже.` });
    // Implement actual delete logic with confirmation and API call
  };

  const formatPrice = (price: number | undefined): string => {
    if (typeof price !== 'number') return 'N/A';
    return `${price.toFixed(2)} GH`;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center">
              <Palette className="mr-2 h-6 w-6" />
              Управление Кейсами
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Просмотр, добавление, редактирование и удаление кейсов.
            </CardDescription>
          </div>
          <Button onClick={handleAddCase} variant="outline" className="border-primary text-primary hover:bg-primary/10">
            <PlusCircle className="mr-2 h-4 w-4" />
            Добавить кейс
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск по названию или ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full md:w-1/3 bg-background focus:border-primary"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Загрузка кейсов...</p>
            </div>
          ) : error ? (
             <div className="text-center py-8 text-destructive">
                <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
                <p className="font-semibold">Не удалось загрузить кейсы</p>
                <p className="text-sm">{error}</p>
            </div>
          ) : filteredCases.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-primary">ID</TableHead>
                    <TableHead className="text-primary">Название</TableHead>
                    <TableHead className="text-primary text-center">Цена (GH)</TableHead>
                    <TableHead className="text-primary text-center">Призов</TableHead>
                    <TableHead className="text-primary text-center">Активен</TableHead>
                    <TableHead className="text-primary text-center">Горячее</TableHead>
                    <TableHead className="text-center text-primary">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.map((caseItem) => (
                    <TableRow key={caseItem.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-foreground/90">{caseItem.id}</TableCell>
                      <TableCell className="text-foreground/90">{caseItem.name}</TableCell>
                      <TableCell className="text-center text-foreground/90">{formatPrice(caseItem.base_price_gh)}</TableCell>
                      <TableCell className="text-center text-foreground/90">{caseItem.prize_count}</TableCell>
                      <TableCell className="text-center">
                        {caseItem.is_active ? 
                          <CheckCircle className="h-5 w-5 text-primary mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                        }
                      </TableCell>
                      <TableCell className="text-center">
                        {caseItem.is_hot_offer ? 
                          <Flame className="h-5 w-5 text-orange-500 mx-auto" /> : 
                          <span className="text-muted-foreground">-</span>
                        }
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEditCase(caseItem.id)}>
                            <Edit className="h-4 w-4" />
                             <span className="sr-only">Редактировать</span>
                          </Button>
                          {/* AlertDialog for delete confirmation to be added here when functionality is complete */}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => handleDeleteCase(caseItem)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Удалить</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Кейсы не найдены.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
