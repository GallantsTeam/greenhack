
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle as DialogTitlePrimitive, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Edit, Trash2, HelpCircle, Eye, EyeOff, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import type { FaqItem } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const faqItemSchema = z.object({
  id: z.number().optional(),
  question: z.string().min(5, "Вопрос должен быть не менее 5 символов."),
  answer: z.string().min(10, "Ответ должен быть не менее 10 символов."),
  item_order: z.coerce.number().optional().default(0),
  is_active: z.boolean().default(true),
});

type FaqFormValues = z.infer<typeof faqItemSchema>;

export default function AdminFaqEditorPage() {
  const { toast } = useToast();
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FaqItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<FaqItem | null>(null);

  const form = useForm<FaqFormValues>({
    resolver: zodResolver(faqItemSchema),
    defaultValues: {
      question: '',
      answer: '',
      item_order: 0,
      is_active: true,
    },
  });

  const fetchFaqItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/faq-items');
      if (!response.ok) throw new Error('Не удалось загрузить FAQ');
      const data: FaqItem[] = await response.json();
      setFaqItems(data.sort((a, b) => (a.item_order || 0) - (b.item_order || 0)));
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFaqItems();
  }, [fetchFaqItems]);

  const handleOpenModal = (item?: FaqItem) => {
    if (item) {
      setEditingItem(item);
      form.reset({
        id: item.id,
        question: item.question,
        answer: item.answer,
        item_order: item.item_order || 0,
        is_active: item.is_active === undefined ? true : item.is_active,
      });
    } else {
      setEditingItem(null);
      form.reset({ question: '', answer: '', item_order: faqItems.length > 0 ? Math.max(...faqItems.map(i => i.item_order || 0)) + 1 : 0, is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: FaqFormValues) => {
    setIsLoading(true);
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `/api/admin/faq-items/${editingItem.id}` : '/api/admin/faq-items';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Не удалось сохранить элемент FAQ.');
      
      toast({ title: editingItem ? "FAQ обновлен" : "FAQ создан", description: result.message });
      fetchFaqItems();
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/faq-items/${itemToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete FAQ item.' }));
        throw new Error(errorData.message);
      }
      toast({ description: `FAQ "${itemToDelete.question.substring(0,20)}..." удален.` });
      fetchFaqItems();
    } catch (err: any) {
      toast({ title: "Ошибка удаления", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setItemToDelete(null);
    }
  };

  const handleChangeOrder = async (item: FaqItem, direction: 'up' | 'down') => {
    const currentIndex = faqItems.findIndex(fi => fi.id === item.id);
    if (currentIndex === -1) return;

    let newOrder: number;
    if (direction === 'up') {
      if (currentIndex === 0) return; // Already at the top
      const prevItem = faqItems[currentIndex - 1];
      newOrder = (prevItem.item_order || 0) - 0.5; // Temporarily use float to place between, then re-normalize
    } else {
      if (currentIndex === faqItems.length - 1) return; // Already at the bottom
      const nextItem = faqItems[currentIndex + 1];
      newOrder = (nextItem.item_order || 0) + 0.5;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/faq-items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_order: newOrder }),
      });
      if (!response.ok) throw new Error('Не удалось изменить порядок.');
      
      // Re-normalize orders after successful update
      const tempSortedItems = [...faqItems.map(i => i.id === item.id ? {...i, item_order: newOrder} : i)]
                                .sort((a,b) => (a.item_order || 0) - (b.item_order || 0));
      
      for (let i = 0; i < tempSortedItems.length; i++) {
        if ((tempSortedItems[i].item_order || 0) !== i) {
           await fetch(`/api/admin/faq-items/${tempSortedItems[i].id}`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ item_order: i }),
           });
        }
      }
      fetchFaqItems(); // Re-fetch for final state
    } catch (err: any) {
      toast({ title: "Ошибка изменения порядка", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold text-primary flex items-center">
              <HelpCircle className="mr-2 h-5 w-5" />
              Редактор страницы FAQ
          </CardTitle>
          <CardDescription className="text-muted-foreground">Управление вопросами и ответами на странице FAQ.</CardDescription>
        </div>
        <Button onClick={() => handleOpenModal()} variant="outline" className="border-primary text-primary hover:bg-primary/10">
            <PlusCircle className="mr-2 h-4 w-4"/> Добавить Вопрос-Ответ
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && faqItems.length === 0 ? (
          <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Загрузка...</p></div>
        ) : error ? (
          <div className="text-center py-10 text-destructive"><AlertTriangle className="mx-auto h-10 w-10 mb-2" /><p>{error}</p></div>
        ) : faqItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-10">Вопросы и ответы еще не добавлены.</p>
        ) : (
          <Accordion type="multiple" className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem value={`item-${item.id}`} key={item.id} className="border-border/50">
                <AccordionTrigger className="hover:bg-muted/30 px-2 rounded-t-md group">
                  <div className="flex-1 text-left font-medium text-foreground group-hover:text-primary">
                    {item.question}
                  </div>
                  <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
                    <Button asChild variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleChangeOrder(item, 'up'); }} disabled={index === 0 || isLoading}><ChevronUp className="h-4 w-4"/></Button>
                    <Button asChild variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleChangeOrder(item, 'down'); }} disabled={index === faqItems.length - 1 || isLoading}><ChevronDown className="h-4 w-4"/></Button>
                    <Button asChild variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleOpenModal(item); }} disabled={isLoading}><Edit className="h-4 w-4"/></Button>
                    <Button asChild variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80" onClick={(e) => { e.stopPropagation(); setItemToDelete(item); }} disabled={isLoading}><Trash2 className="h-4 w-4"/></Button>
                  </div>
                  {item.is_active ? <Eye className="h-4 w-4 text-primary/70 ml-2 shrink-0" /> : <EyeOff className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />}
                </AccordionTrigger>
                <AccordionContent className="px-2 py-3 text-muted-foreground bg-muted/10 rounded-b-md">
                  <div className="whitespace-pre-wrap">{item.answer}</div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open && !isLoading) { setIsModalOpen(false); setEditingItem(null); form.reset(); } else if (open) {setIsModalOpen(true); }}}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
            <DialogHeader>
                <DialogTitlePrimitive className="text-primary">{editingItem ? 'Редактировать FAQ' : 'Добавить новый FAQ'}</DialogTitlePrimitive>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                    <Label htmlFor="question" className="text-foreground">Вопрос</Label>
                    <Textarea id="question" {...form.register("question")} placeholder="Например, Как активировать товар?" className="mt-1 min-h-[60px]" disabled={isLoading} />
                    {form.formState.errors.question && <p className="text-sm text-destructive mt-1">{form.formState.errors.question.message}</p>}
                </div>
                <div>
                    <Label htmlFor="answer" className="text-foreground">Ответ</Label>
                    <Textarea id="answer" {...form.register("answer")} placeholder="Подробный ответ на вопрос..." className="mt-1 min-h-[100px]" disabled={isLoading} />
                    {form.formState.errors.answer && <p className="text-sm text-destructive mt-1">{form.formState.errors.answer.message}</p>}
                </div>
                <div>
                    <Label htmlFor="item_order" className="text-foreground">Порядок сортировки</Label>
                    <Input id="item_order" type="number" {...form.register("item_order")} className="mt-1" disabled={isLoading} />
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="is_active" checked={form.watch("is_active")} onCheckedChange={(checked) => form.setValue("is_active", Boolean(checked))} disabled={isLoading} />
                    <Label htmlFor="is_active" className="text-sm font-medium text-foreground">Активен (виден пользователям)</Label>
                </div>
                <DialogFooter className="mt-4 pt-4 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingItem(null); form.reset();}} disabled={isLoading}>Отмена</Button>
                    <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingItem ? 'Сохранить' : 'Добавить'}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      {itemToDelete && (
        <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Удалить FAQ?</AlertDialogTitle>
                <AlertDialogDescription>
                    Вы уверены, что хотите удалить вопрос "{itemToDelete.question.substring(0,50)}..."? Это действие нельзя отменить.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setItemToDelete(null)}>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Удалить</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}

    