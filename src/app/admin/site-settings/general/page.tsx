
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Settings, Menu as MenuIconLucide, Edit, Trash2, PlusCircle, GripVertical, Eye, EyeOff, LinkIcon as LinkLucideIcon, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SiteSettings, SiteNavigationItem } from '@/types';
import { Separator } from '@/components/ui/separator';
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle as DialogTitlePrimitive, 
  DialogFooter,
} from "@/components/ui/dialog";


const siteSettingsSchema = z.object({
  site_name: z.string().min(1, "Название сайта обязательно.").max(255).nullable(),
  site_description: z.string().max(1000).nullable().optional(),
  logo_url: z.string().url({ message: "Неверный URL для логотипа." }).nullable().optional().or(z.literal('')),
  footer_text: z.string().max(500).nullable().optional(),
  faq_page_main_title: z.string().max(255).optional().nullable(),
  faq_page_contact_prompt_text: z.string().max(500).optional().nullable(),
});

type SiteSettingsFormValues = z.infer<typeof siteSettingsSchema>;

const navigationItemSchema = z.object({
  id: z.number().optional(),
  label: z.string().min(1, "Название обязательно."),
  href: z.string().min(1, "Ссылка обязательна."),
  icon_name: z.string().optional().nullable(),
  item_order: z.coerce.number().default(0),
  is_visible: z.boolean().default(true),
});
type NavigationItemFormValues = z.infer<typeof navigationItemSchema>;


export default function AdminGeneralSettingsPage() {
  const { toast } = useToast();
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [isSettingsFetching, setIsSettingsFetching] = useState(true);
  
  const [navItems, setNavItems] = useState<SiteNavigationItem[]>([]);
  const [isNavLoading, setIsNavLoading] = useState(false);
  const [isNavFetching, setIsNavFetching] = useState(true);

  const [editingNavItem, setEditingNavItem] = useState<SiteNavigationItem | null>(null);
  const [isNavItemModalOpen, setIsNavItemModalOpen] = useState(false);
  const [navItemToDelete, setNavItemToDelete] = useState<SiteNavigationItem | null>(null);


  const settingsForm = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      site_name: '',
      site_description: '',
      logo_url: '',
      footer_text: '',
      faq_page_main_title: '',
      faq_page_contact_prompt_text: '',
    },
  });

  const navItemForm = useForm<NavigationItemFormValues>({
    resolver: zodResolver(navigationItemSchema),
    defaultValues: {
        label: '',
        href: '/',
        icon_name: '',
        item_order: 0,
        is_visible: true,
    }
  });


  const fetchSettings = useCallback(async () => {
    setIsSettingsFetching(true);
    try {
      const response = await fetch('/api/admin/site-settings');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Не удалось загрузить настройки сайта.' }));
        throw new Error(errorData.message);
      }
      const data: SiteSettings = await response.json();
      settingsForm.reset({
        site_name: data.site_name || '',
        site_description: data.site_description || '',
        logo_url: data.logo_url || '',
        footer_text: data.footer_text || '',
        faq_page_main_title: data.faq_page_main_title || 'Часто Задаваемые Вопросы',
        faq_page_contact_prompt_text: data.faq_page_contact_prompt_text || 'Не нашли ответ на свой вопрос? Напишите в поддержку',
      });
    } catch (error: any) {
      toast({ title: "Ошибка загрузки настроек", description: error.message, variant: "destructive" });
    } finally {
      setIsSettingsFetching(false);
    }
  }, [settingsForm, toast]);

  const fetchNavItems = useCallback(async () => {
    setIsNavFetching(true);
    try {
      const response = await fetch('/api/admin/site-navigation');
      if(!response.ok) throw new Error('Failed to fetch navigation items');
      const data: SiteNavigationItem[] = await response.json();
      setNavItems(data.sort((a, b) => a.item_order - b.item_order));
    } catch (error: any) {
      toast({ title: "Ошибка загрузки меню", description: error.message, variant: "destructive" });
    } finally {
      setIsNavFetching(false);
    }
  }, [toast]);


  useEffect(() => {
    fetchSettings();
    fetchNavItems();
  }, [fetchSettings, fetchNavItems]);

  const onSettingsSubmit = async (data: SiteSettingsFormValues) => {
    setIsSettingsLoading(true);
    try {
      const response = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Не удалось сохранить настройки.');
      toast({ title: "Настройки сохранены", description: "Общие настройки сайта были успешно обновлены." });
      if(result.settings) {
        settingsForm.reset({
          site_name: result.settings.site_name || '',
          site_description: result.settings.site_description || '',
          logo_url: result.settings.logo_url || '',
          footer_text: result.settings.footer_text || '',
          faq_page_main_title: result.settings.faq_page_main_title || 'Часто Задаваемые Вопросы',
          faq_page_contact_prompt_text: result.settings.faq_page_contact_prompt_text || 'Не нашли ответ на свой вопрос? Напишите в поддержку',
        });
      }
    } catch (error: any) {
      toast({ title: "Ошибка сохранения", description: error.message, variant: "destructive" });
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const handleOpenNavItemModal = (item?: SiteNavigationItem) => {
    if (item) {
      setEditingNavItem(item);
      navItemForm.reset({
        id: item.id,
        label: item.label,
        href: item.href,
        icon_name: item.icon_name || '',
        item_order: item.item_order,
        is_visible: item.is_visible,
      });
    } else {
      setEditingNavItem(null);
      navItemForm.reset({ label: '', href: '/', icon_name: '', item_order: navItems.length > 0 ? Math.max(...navItems.map(i => i.item_order)) + 1 : 0, is_visible: true });
    }
    setIsNavItemModalOpen(true);
  };
  
  const handleNavItemSubmit = async (data: NavigationItemFormValues) => {
    setIsNavLoading(true);
    const method = editingNavItem ? 'PUT' : 'POST';
    const url = editingNavItem ? `/api/admin/site-navigation/${editingNavItem.id}` : '/api/admin/site-navigation';
    
    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Не удалось сохранить пункт меню.');
      
      toast({ title: editingNavItem ? "Пункт меню обновлен" : "Пункт меню создан", description: result.message });
      fetchNavItems(); 
      setIsNavItemModalOpen(false);
      setEditingNavItem(null);
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setIsNavLoading(false);
    }
  };

  const handleToggleNavItemVisibility = async (item: SiteNavigationItem) => {
    setIsNavLoading(true);
    try {
      const response = await fetch(`/api/admin/site-navigation/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, is_visible: !item.is_visible }),
      });
      if (!response.ok) throw new Error('Не удалось изменить видимость.');
      toast({ description: `Видимость для "${item.label}" изменена.`});
      fetchNavItems();
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setIsNavLoading(false);
    }
  };
  
  const handleChangeNavItemOrder = async (item: SiteNavigationItem, newOrder: number) => {
    setIsNavLoading(true);
    try {
      const response = await fetch(`/api/admin/site-navigation/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, item_order: newOrder }),
      });
      if (!response.ok) throw new Error('Не удалось изменить порядок.');
      toast({ description: `Порядок для "${item.label}" изменен.`});
      fetchNavItems(); 
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setIsNavLoading(false);
    }
  };


  const handleDeleteNavItem = async () => {
    if (!navItemToDelete) return;
    setIsNavLoading(true);
    try {
      const response = await fetch(`/api/admin/site-navigation/${navItemToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(()=>({message: 'Failed to delete item'}));
        throw new Error(errorData.message || 'Не удалось удалить пункт меню.');
      }
      toast({ description: `Пункт меню "${navItemToDelete.label}" удален.` });
      fetchNavItems();
    } catch (error: any) {
      toast({ title: "Ошибка удаления", description: error.message, variant: "destructive" });
    } finally {
      setIsNavLoading(false);
      setNavItemToDelete(null);
    }
  };


  if (isSettingsFetching || isNavFetching) {
    return (
        <div className="flex items-center justify-center p-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Загрузка настроек...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl font-bold text-primary flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    Общие настройки сайта
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="site_name" className="text-foreground">Название сайта</Label>
                        <Input id="site_name" {...settingsForm.register("site_name")} placeholder="Green Hack" disabled={isSettingsLoading}/>
                        {settingsForm.formState.errors.site_name && <p className="text-sm text-destructive mt-1">{settingsForm.formState.errors.site_name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="site_description" className="text-foreground">Описание сайта (для SEO)</Label>
                        <Textarea id="site_description" {...settingsForm.register("site_description")} placeholder="Лучшие читы для ваших любимых игр!" disabled={isSettingsLoading} />
                        {settingsForm.formState.errors.site_description && <p className="text-sm text-destructive mt-1">{settingsForm.formState.errors.site_description.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="logo_url" className="text-foreground">URL Логотипа</Label>
                        <Input id="logo_url" {...settingsForm.register("logo_url")} placeholder="https://example.com/logo.png" disabled={isSettingsLoading}/>
                        {settingsForm.formState.errors.logo_url && <p className="text-sm text-destructive mt-1">{settingsForm.formState.errors.logo_url.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="footer_text" className="text-foreground">Текст в подвале</Label>
                        <Textarea id="footer_text" {...settingsForm.register("footer_text")} placeholder={`© ${new Date().getFullYear()} Green Hack. Все права защищены.`} disabled={isSettingsLoading}/>
                        {settingsForm.formState.errors.footer_text && <p className="text-sm text-destructive mt-1">{settingsForm.formState.errors.footer_text.message}</p>}
                    </div>
                    <Separator />
                     <h4 className="text-md font-semibold text-foreground pt-2 flex items-center"><HelpCircle className="mr-2 h-5 w-5 text-primary/80"/>Настройки страницы FAQ</h4>
                     <div className="space-y-2">
                        <Label htmlFor="faq_page_main_title" className="text-foreground">Заголовок страницы FAQ</Label>
                        <Input id="faq_page_main_title" {...settingsForm.register("faq_page_main_title")} placeholder="Часто Задаваемые Вопросы" disabled={isSettingsLoading}/>
                        {settingsForm.formState.errors.faq_page_main_title && <p className="text-sm text-destructive mt-1">{settingsForm.formState.errors.faq_page_main_title.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="faq_page_contact_prompt_text" className="text-foreground">Текст "Не нашли ответ..." на FAQ</Label>
                        <Textarea id="faq_page_contact_prompt_text" {...settingsForm.register("faq_page_contact_prompt_text")} placeholder="Не нашли ответ на свой вопрос? Напишите в поддержку" disabled={isSettingsLoading}/>
                        {settingsForm.formState.errors.faq_page_contact_prompt_text && <p className="text-sm text-destructive mt-1">{settingsForm.formState.errors.faq_page_contact_prompt_text.message}</p>}
                    </div>
                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSettingsLoading || isSettingsFetching}>
                        {isSettingsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Сохранить общие настройки
                    </Button>
                </form>
            </CardContent>
        </Card>

        <Separator />

        <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl font-bold text-primary flex items-center">
                        <MenuIconLucide className="mr-2 h-5 w-5" />
                        Управление пунктами меню
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Настройте навигацию вашего сайта.</CardDescription>
                </div>
                <Button variant="outline" onClick={() => handleOpenNavItemModal()} className="border-primary text-primary hover:bg-primary/10">
                    <PlusCircle className="mr-2 h-4 w-4"/> Добавить пункт
                </Button>
            </CardHeader>
            <CardContent>
                {isNavFetching ? (
                    <div className="flex justify-center items-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : navItems.length > 0 ? (
                    <div className="space-y-3">
                        {navItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/20 hover:bg-muted/40 transition-colors">
                                <div className="flex items-center gap-3">
                                    {/* <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" /> */}
                                    <div className="flex flex-col">
                                        <span className="font-medium text-foreground">{item.label}</span>
                                        <span className="text-xs text-muted-foreground">{item.href} {item.icon_name && `(Иконка: ${item.icon_name})`}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input 
                                        type="number" 
                                        value={item.item_order}
                                        onChange={(e) => handleChangeNavItemOrder(item, parseInt(e.target.value) || 0)}
                                        className="w-16 h-8 text-xs"
                                        disabled={isNavLoading}
                                    />
                                    <Switch
                                        id={`visibility-${item.id}`}
                                        checked={item.is_visible}
                                        onCheckedChange={() => handleToggleNavItemVisibility(item)}
                                        disabled={isNavLoading}
                                        aria-label="Видимость пункта меню"
                                    />
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleOpenNavItemModal(item)} disabled={isNavLoading}>
                                        <Edit className="h-4 w-4"/>
                                    </Button>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => setNavItemToDelete(item)} disabled={isNavLoading}>
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Удалить пункт меню?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Вы уверены, что хотите удалить пункт меню "{navItemToDelete?.label}"? Это действие нельзя отменить.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel onClick={() => setNavItemToDelete(null)}>Отмена</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeleteNavItem} className="bg-destructive hover:bg-destructive/90">Удалить</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-4">Пункты меню еще не добавлены.</p>
                )}
            </CardContent>
        </Card>

        <Dialog open={isNavItemModalOpen} onOpenChange={(open) => { if (!open && !isNavLoading) { setIsNavItemModalOpen(false); setEditingNavItem(null); navItemForm.reset(); } else if (open) { setIsNavItemModalOpen(true); }}}>
            <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader>
                    <DialogTitlePrimitive className="text-primary">{editingNavItem ? 'Редактировать пункт меню' : 'Добавить новый пункт меню'}</DialogTitlePrimitive>
                </DialogHeader>
                <form onSubmit={navItemForm.handleSubmit(handleNavItemSubmit)} className="space-y-4 py-2">
                    <div>
                        <Label htmlFor="nav-label" className="text-foreground">Название</Label>
                        <Input id="nav-label" {...navItemForm.register("label")} placeholder="Главная" className="mt-1" disabled={isNavLoading} />
                        {navItemForm.formState.errors.label && <p className="text-sm text-destructive mt-1">{navItemForm.formState.errors.label.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="nav-href" className="text-foreground">Ссылка (Href)</Label>
                        <Input id="nav-href" {...navItemForm.register("href")} placeholder="/about" className="mt-1" disabled={isNavLoading} />
                        {navItemForm.formState.errors.href && <p className="text-sm text-destructive mt-1">{navItemForm.formState.errors.href.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="nav-icon_name" className="text-foreground">Имя иконки (Lucide, опционально)</Label>
                        <Input id="nav-icon_name" {...navItemForm.register("icon_name")} placeholder="Home" className="mt-1" disabled={isNavLoading} />
                        {navItemForm.formState.errors.icon_name && <p className="text-sm text-destructive mt-1">{navItemForm.formState.errors.icon_name.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="nav-item_order" className="text-foreground">Порядок</Label>
                        <Input id="nav-item_order" type="number" {...navItemForm.register("item_order")} className="mt-1" disabled={isNavLoading} />
                        {navItemForm.formState.errors.item_order && <p className="text-sm text-destructive mt-1">{navItemForm.formState.errors.item_order.message}</p>}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Controller
                            control={navItemForm.control}
                            name="is_visible"
                            render={({ field }) => (
                                <Switch
                                    id="nav-is_visible"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isNavLoading}
                                />
                            )}
                        />
                        <Label htmlFor="nav-is_visible" className="text-foreground">Видимый</Label>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => { setIsNavItemModalOpen(false); setEditingNavItem(null); navItemForm.reset(); }} disabled={isNavLoading}>Отмена</Button>
                        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isNavLoading}>
                            {isNavLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingNavItem ? 'Сохранить' : 'Добавить'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}
    

