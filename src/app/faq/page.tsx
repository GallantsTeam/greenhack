
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search as SearchIcon, AlertTriangle, MessageSquareQuestion, Home, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import type { FaqItem, SiteSettings } from '@/types';
import { useToast } from '@/hooks/use-toast';
import FaqSidebarNav from '@/components/FaqSidebarNav'; 

export default function FaqPage() {
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [isLoadingFaq, setIsLoadingFaq] = useState(true);
  const [errorFaq, setErrorFaq] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const fetchFaqItems = useCallback(async () => {
    setIsLoadingFaq(true);
    setErrorFaq(null);
    try {
      const response = await fetch('/api/admin/faq-items');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Не удалось загрузить FAQ' }));
        throw new Error(errorData.message);
      }
      const data: FaqItem[] = await response.json();
      setFaqItems(data.filter(item => item.is_active).sort((a, b) => (a.item_order || 0) - (b.item_order || 0)));
    } catch (err: any) {
      setErrorFaq(err.message);
      toast({ title: "Ошибка загрузки FAQ", description: err.message, variant: "destructive" });
    } finally {
      setIsLoadingFaq(false);
    }
  }, [toast]);

  const fetchSiteSettings = useCallback(async () => {
    setIsLoadingSettings(true);
    try {
      const response = await fetch('/api/site-settings-public');
      if (!response.ok) throw new Error('Failed to fetch site settings for FAQ page');
      const data = await response.json();
      setSiteSettings(data);
    } catch (error) {
      console.error("FAQ Page: Error fetching site settings:", error);
      // Use defaults if fetch fails so page can still render somewhat
      setSiteSettings({
        faq_page_main_title: 'Часто Задаваемые Вопросы',
        faq_page_contact_prompt_text: 'Не нашли ответ на свой вопрос? Напишите в поддержку',
      } as SiteSettings);
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqItems();
    fetchSiteSettings();
  }, [fetchFaqItems, fetchSiteSettings]);

  const filteredFaqItems = useMemo(() => {
    if (!searchTerm) return faqItems;
    return faqItems.filter(item =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [faqItems, searchTerm]);
  
  const pageTitle = siteSettings?.faq_page_main_title || 'Часто Задаваемые Вопросы';
  const contactPromptText = siteSettings?.faq_page_contact_prompt_text || 'Не нашли ответ на свой вопрос? Напишите в поддержку';

  if (isLoadingFaq || isLoadingSettings) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8 text-center min-h-[calc(100vh-var(--header-height)-var(--footer-height))] flex flex-col justify-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <section className="relative py-16 md:py-24 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-primary/20 via-primary/5 to-background border-b border-border/20">
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary uppercase tracking-wider mb-4 md:mb-6 [text-shadow:_1px_1px_8px_hsl(var(--primary)/0.5)]">
              {pageTitle}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Найдите ответы на самые популярные вопросы о наших продуктах и сервисе.
            </p>
          </div>
        </div>
      </section>
      
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 xl:col-span-9">
            <div className="relative mb-6">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Поиск по вопросам и ответам..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 h-12 rounded-lg bg-card border-border focus:border-primary text-foreground placeholder:text-muted-foreground shadow-sm"
              />
            </div>

            {isLoadingFaq && filteredFaqItems.length === 0 ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : errorFaq ? (
              <div className="text-center py-10 text-destructive">
                <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
                <p>{errorFaq}</p>
              </div>
            ) : filteredFaqItems.length > 0 ? (
              <Accordion type="multiple" className="w-full space-y-3">
                {filteredFaqItems.map((item) => (
                  <AccordionItem key={item.id} value={`item-${item.id}`} className="border border-border/50 rounded-lg bg-card shadow-sm transition-shadow hover:shadow-md">
                    <AccordionTrigger className="px-4 py-3 text-left text-base font-medium text-foreground hover:text-primary hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-0 text-sm text-muted-foreground whitespace-pre-wrap">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-center text-muted-foreground py-10">
                {searchTerm ? 'По вашему запросу ничего не найдено.' : 'Вопросы и ответы еще не добавлены.'}
              </p>
            )}
            <div className="mt-8 text-center">
              <p className="text-muted-foreground">
                {contactPromptText.split('Напишите в поддержку')[0]}
                <Link href="/#contacts" className="text-primary hover:underline">
                  Напишите в поддержку
                </Link>
                {contactPromptText.split('Напишите в поддержку')[1]}
              </p>
            </div>
          </div>

          <aside className="lg:col-span-4 xl:col-span-3">
             <FaqSidebarNav />
          </aside>
        </div>
      </div>
    </div>
  );
}
