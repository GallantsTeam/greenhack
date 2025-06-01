
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle as DialogTitlePrimitive, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Edit, Trash2, ListFilter, Eye, EyeOff, AlertTriangle, ImageIcon as ImageIconLucide, LinkIcon, Tag, ListOrdered, FileText } from 'lucide-react'; // Added FileText
import type { FaqSidebarNavItem } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea

const faqSidebarItemSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(3, "Заголовок должен быть не менее 3 символов.").max(255),
  href: z.string().min(1, "Ссылка обязательна (например, #anchor или /page).").max(255),
  image_url: z.string().url({ message: "Неверный URL изображения." }).max(512),
  image_alt_text: z.string().max(255).optional().nullable(),
  data_ai_hint: z.string().max(100).optional().nullable(),
  content: z.string().optional().nullable(), // Added content field
  item_order: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
});

type FaqSidebarFormValues = z.infer<typeof faqSidebarItemSchema>;

export default function AdminFaqSidebarEditorPage() {
  const { toast } = useToast();
  const [sidebarItems, setSidebarItems] = useState<FaqSidebarNavItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FaqSidebarNavItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<FaqSidebarNavItem | null>(null);

  const form = useForm<FaqSidebarFormValues>({
    resolver: zodResolver(faqSidebarItemSchema),
    defaultValues: {
      title: '',
      href: '#',
      image_url: '',
      image_alt_text: '',
      data_ai_hint: '',
      content: '',
      item_order: 0,
      is_active: true,
    },
  });

  const fetchSidebarItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/faq-sidebar-items');
      if (!response.ok) throw new Error('Не удалось загрузить элементы боковой панели FAQ');
      const data: FaqSidebarNavItem[] = await response.json();
      setSidebarItems(data.sort((a, b) => (a.item_order || 0) - (b.item_order || 0)));
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSidebarItems();
  }, [fetchSidebarItems]);

  const handleOpenModal = (item?: FaqSidebarNavItem) => {
    if (item) {
      setEditingItem(item);
      form.reset({
        id: item.id,
        title: item.title,
        href: item.href,
        image_url: item.image_url,
        image_alt_text: item.image_alt_text || '',
        data_ai_hint: item.data_ai_hint || '',
        content: item.content || '', // Load content
        item_order: item.item_order || 0,
        is_active: item.is_active === undefined ? true : item.is_active,
      });
    } else {
      setEditingItem(null);
      form.reset({ title: '', href: '#', image_url: '', image_alt_text: '', data_ai_hint: '', content: '', item_order: sidebarItems.length > 0 ? Math.max(...sidebarItems.map(i => i.item_order || 0)) + 1 : 0, is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: FaqSidebarFormValues) => {
    setIsLoading(true);
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `/api/admin/faq-sidebar-items/${editingItem.id}` : '/api/admin/faq-sidebar-items';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Не удалось сохранить элемент.');
      
      toast({ title: editingItem ? "Элемент обновлен" : "Элемент создан", description: result.message });
      fetchSidebarItems();
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
      const response = await fetch(`/api/admin/faq-sidebar-items/${itemToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete item.' }));
        throw new Error(errorData.message);
      }
      toast({ description: `Элемент "${itemToDelete.title.substring(0,20)}..." удален.` });
      fetchSidebarItems();
    } catch (err: any) {
      toast({ title: "Ошибка удаления", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setItemToDelete(null);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold text-primary flex items-center">
              <ListFilter className="mr-2 h-5 w-5" />
              Редактор Сайдбара FAQ
          </CardTitle>
          <CardDescription className="text-muted-foreground">Управление навигационными блоками и их содержимым в боковой панели страницы FAQ.</CardDescription>
        </div>
        <Button onClick={() => handleOpenModal()} variant="outline" className="border-primary text-primary hover:bg-primary/10">
            <PlusCircle className="mr-2 h-4 w-4"/> Добавить блок
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && sidebarItems.length === 0 ? (
          <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Загрузка...</p></div>
        ) : error ? (
          <div className="text-center py-10 text-destructive"><AlertTriangle className="mx-auto h-10 w-10 mb-2" /><p>{error}</p></div>
        ) : sidebarItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-10">Элементы боковой панели еще не добавлены.</p>
        ) : (
          <div className="space-y-3">
            {sidebarItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border border-border/50 rounded-md bg-card hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-10 rounded overflow-hidden shrink-0">
                    <Image src={item.image_url || 'https://placehold.co/120x80.png?text=N/A'} alt={item.title} layout="fill" objectFit="cover" data-ai-hint={item.data_ai_hint || 'sidebar item image'} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.href}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    {item.is_active ? <Eye className="h-4 w-4 text-primary/70" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    <Input type="number" defaultValue={item.item_order} onChange={(e) => {/* TODO: Implement order change via API */}} className="w-16 h-8 text-xs" disabled={isLoading} />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary/80 hover:text-primary" onClick={() => handleOpenModal(item)} disabled={isLoading}><Edit className="h-4 w-4"/></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/80" onClick={() => setItemToDelete(item)} disabled={isLoading}><Trash2 className="h-4 w-4"/></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open && !isLoading) { setIsModalOpen(false); setEditingItem(null); form.reset(); } else if (open) {setIsModalOpen(true); }}}>
        <DialogContent className="sm:max-w-lg md:max-w-2xl bg-card border-border"> {/* Increased width for content */}
            <DialogHeader>
                <DialogTitlePrimitive className="text-primary">{editingItem ? 'Редактировать блок сайдбара' : 'Добавить новый блок'}</DialogTitlePrimitive>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                    <Label htmlFor="title" className="text-foreground flex items-center"><Tag className="mr-1.5 h-4 w-4 text-primary/70"/>Заголовок</Label>
                    <Input id="title" {...form.register("title")} placeholder="КАК ЭКОНОМИТЬ..." className="mt-1" disabled={isLoading} />
                    {form.formState.errors.title && <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>}
                </div>
                <div>
                    <Label htmlFor="href" className="text-foreground flex items-center"><LinkIcon className="mr-1.5 h-4 w-4 text-primary/70"/>Ссылка (Href/Якорь)</Label>
                    <Input id="href" {...form.register("href")} placeholder="#economy-guide или /some-page" className="mt-1" disabled={isLoading} />
                    {form.formState.errors.href && <p className="text-sm text-destructive mt-1">{form.formState.errors.href.message}</p>}
                </div>
                 <div>
                    <Label htmlFor="image_url" className="text-foreground flex items-center"><ImageIconLucide className="mr-1.5 h-4 w-4 text-primary/70"/>URL Изображения</Label>
                    <Input id="image_url" {...form.register("image_url")} placeholder="https://example.com/image.png" className="mt-1" disabled={isLoading} />
                    {form.formState.errors.image_url && <p className="text-sm text-destructive mt-1">{form.formState.errors.image_url.message}</p>}
                </div>
                <div>
                    <Label htmlFor="image_alt_text" className="text-foreground">Alt текст для изображения</Label>
                    <Input id="image_alt_text" {...form.register("image_alt_text")} placeholder="Описание изображения" className="mt-1" disabled={isLoading} />
                </div>
                <div>
                    <Label htmlFor="data_ai_hint" className="text-foreground">Подсказка для AI (изображение)</Label>
                    <Input id="data_ai_hint" {...form.register("data_ai_hint")} placeholder="discount savings" className="mt-1" disabled={isLoading} />
                </div>
                <div>
                    <Label htmlFor="content" className="text-foreground flex items-center"><FileText className="mr-1.5 h-4 w-4 text-primary/70"/>HTML Содержимое</Label>
                    <Textarea id="content" {...form.register("content")} placeholder="<p>Ваш <b>HTML</b> контент здесь...</p>" className="mt-1 min-h-[150px]" disabled={isLoading} />
                    {form.formState.errors.content && <p className="text-sm text-destructive mt-1">{form.formState.errors.content.message}</p>}
                </div>
                <div>
                    <Label htmlFor="item_order" className="text-foreground flex items-center"><ListOrdered className="mr-1.5 h-4 w-4 text-primary/70"/>Порядок сортировки</Label>
                    <Input id="item_order" type="number" {...form.register("item_order")} className="mt-1" disabled={isLoading} />
                </div>
                <div className="flex items-center space-x-2 pt-1">
                    <Checkbox id="is_active" checked={form.watch("is_active")} onCheckedChange={(checked) => form.setValue("is_active", Boolean(checked))} disabled={isLoading} />
                    <Label htmlFor="is_active" className="text-sm font-medium text-foreground">Активен (виден)</Label>
                </div>
                <DialogFooter className="mt-4 pt-3 border-t border-border">
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
                <AlertDialogTitle>Удалить блок сайдбара?</AlertDialogTitle>
                <AlertDialogDescription>
                    Вы уверены, что хотите удалить блок "{itemToDelete.title.substring(0,50)}..."? Это действие нельзя отменить.
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

