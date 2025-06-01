
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import GameCard from '@/components/GameCard';
import type { Category, Product, CaseItem, SiteBanner, SiteSettings } from '@/types';
import { DollarSign, Headphones, Dices, ThumbsUp, Zap, ChevronUp, ChevronDown, ChevronsDown, Gift, AlertCircle, Loader2, Flame, Timer, X, ShieldCheck, ShoppingCart, TrendingUp } from 'lucide-react';
import HeroProductCard from '@/components/HeroProductCard';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle as CardTitleOriginal, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FEATURED_CASE_ID } from '@/lib/case-data';

interface CaseTimerDisplayProps {
  endsAt: string | null | undefined;
  onTimerEnd?: () => void;
}

const CaseTimerDisplay: React.FC<CaseTimerDisplayProps> = ({ endsAt, onTimerEnd }) => {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!endsAt) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = +new Date(endsAt) - +new Date();
      let newTimeLeft = null;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        newTimeLeft = `${days > 0 ? days + "д " : ""}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        newTimeLeft = "Время истекло!";
        if (onTimerEnd) onTimerEnd();
      }
      setTimeLeft(newTimeLeft);
    };

    calculateTimeLeft();
    const timerInterval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timerInterval);
  }, [endsAt, onTimerEnd]);

  if (!timeLeft) {
    return null;
  }
   if (timeLeft === "Время истекло!") {
    return <p className="text-xs text-destructive mt-1 text-center">{timeLeft}</p>;
  }

  return (
    <div className="mt-1.5 text-center">
      <p className="text-xs text-muted-foreground">До конца акции:</p>
      <p className="text-lg font-bold text-primary">{timeLeft}</p>
    </div>
  );
};


export default function HomePage() {
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [mainCaseData, setMainCaseData] = useState<CaseItem | null>(null);

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [heroBannersData, setHeroBannersData] = useState<SiteBanner[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBanners, setIsLoadingBanners] = useState(true);
  const [isCaseLoading, setIsCaseLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const defaultAdvantages = [
    { icon: "DollarSign", text: "Доступные цены" },
    { icon: "Headphones", text: "Отзывчивая поддержка" },
    { icon: "Dices", text: "Большой выбор игр" },
    { icon: "ThumbsUp", text: "Хорошие отзывы" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setIsLoadingBanners(true);
      setIsCaseLoading(true);
      setError(null);
      try {
        const [productsRes, categoriesRes, bannersRes, caseRes, settingsRes] = await Promise.all([
          fetch('/api/products', { cache: 'no-store' }).catch(e => { console.error("Product fetch error:", e); return { ok: false, json: () => Promise.resolve({message: "Failed to fetch products"})} as any; }),
          fetch('/api/categories', { cache: 'no-store' }).catch(e => { console.error("Categories fetch error:", e); return { ok: false, json: () => Promise.resolve({message: "Failed to fetch categories"})} as any; }),
          fetch('/api/admin/site-banners', { cache: 'no-store' }).catch(e => { console.error("Banners fetch error:", e); return { ok: false, json: () => Promise.resolve({message: "Failed to fetch banners"})} as any; }),
          FEATURED_CASE_ID ? fetch(`/api/cases/${FEATURED_CASE_ID}`, { cache: 'no-store' }).catch(e => { console.error("Case fetch error:", e); return { ok: false, json: () => Promise.resolve({message: `Failed to fetch case ${FEATURED_CASE_ID}`})} as any; }) : Promise.resolve({ok: false, json: () => Promise.resolve({message: "No featured case ID"})}),
          fetch('/api/site-settings-public', { cache: 'no-store' }).catch(e => { console.error("Site settings fetch error:", e); return { ok: false, json: () => Promise.resolve({message: "Failed to fetch site settings"})} as any; })
        ]);

        if (!productsRes.ok) throw new Error((await productsRes.json()).message || 'Failed to fetch products');
        if (!categoriesRes.ok) throw new Error((await categoriesRes.json()).message || 'Failed to fetch categories');
        if (!settingsRes.ok) throw new Error((await settingsRes.json()).message || 'Failed to fetch site settings');
        
        const fetchedProducts: Product[] = await productsRes.json();
        const fetchedCategories: Category[] = await categoriesRes.json();
        const fetchedSettings: SiteSettings = await settingsRes.json();
        
        setAllProducts(fetchedProducts);
        setAllCategories(fetchedCategories);
        setSiteSettings(fetchedSettings);
        
        if (bannersRes.ok) {
          const fetchedBanners: SiteBanner[] = await bannersRes.json();
          const activeBanners = fetchedBanners.filter(b => b.is_active);
          const populatedBanners = activeBanners.map(banner => {
            const related = [banner.related_product_slug_1, banner.related_product_slug_2, banner.related_product_slug_3]
              .filter(Boolean)
              .map(slug => fetchedProducts.find(p => p.slug === slug))
              .filter((p): p is Product => p !== undefined);
            return { ...banner, related_products_details: related };
          });
          setHeroBannersData(populatedBanners);
          if (populatedBanners.length > 0) setCurrentHeroIndex(0);
        } else {
           console.warn("Failed to fetch banners:", (await bannersRes.json()).message);
           setHeroBannersData([]);
        }
        setIsLoadingBanners(false);


        let fetchedCaseData: CaseItem | null = null;
        if (caseRes && caseRes.ok) {
          const rawCaseData = await caseRes.json();
          if (rawCaseData && rawCaseData.id) {
            fetchedCaseData = {
              ...rawCaseData,
              is_active: Boolean(rawCaseData.is_active),
              is_hot_offer: Boolean(rawCaseData.is_hot_offer),
              timer_enabled: Boolean(rawCaseData.timer_enabled),
              timer_ends_at: rawCaseData.timer_ends_at ? new Date(rawCaseData.timer_ends_at).toISOString() : null,
              imageUrl: (rawCaseData.imageUrl || rawCaseData.image_url || 'https://placehold.co/300x300.png?text=Case').trim(),
              image_url: rawCaseData.image_url ? rawCaseData.image_url.trim() : null,
            };
          }
        } else if (caseRes) {
          console.warn(`Could not fetch featured case ${FEATURED_CASE_ID}: ${caseRes.status} - ${(await caseRes.json().catch(() => ({}))).message || 'Unknown error'}`);
        }
        setMainCaseData(fetchedCaseData);
        setIsCaseLoading(false);

      } catch (err: any) {
        console.error("Error fetching data for HomePage:", err);
        setError(err.message || "An unknown error occurred while fetching data.");
      } finally {
        setIsLoading(false); 
      }
    };
    fetchData();
  }, []);
  
  const activeHeroBanner = heroBannersData.length > 0 && heroBannersData[currentHeroIndex] ? heroBannersData[currentHeroIndex] : null;
  const heroProductsOnBanner = activeHeroBanner?.related_products_details || [];

  const stopAutoScroll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (heroBannersData.length > 1 && !isLoadingBanners) {
      stopAutoScroll(); 
      intervalRef.current = setInterval(() => {
        setCurrentHeroIndex((prevIndex) => (prevIndex + 1) % heroBannersData.length);
      }, 5000); 
    }
    return () => stopAutoScroll(); 
  }, [heroBannersData, isLoadingBanners, stopAutoScroll]);


  const handleNextHero = useCallback(() => {
    stopAutoScroll();
    if (heroBannersData.length > 0) {
      setCurrentHeroIndex((prevIndex) => (prevIndex + 1) % heroBannersData.length);
    }
  }, [stopAutoScroll, heroBannersData.length]);

  const handlePrevHero = useCallback(() => {
    stopAutoScroll();
     if (heroBannersData.length > 0) {
      setCurrentHeroIndex((prevIndex) => (prevIndex - 1 + heroBannersData.length) % heroBannersData.length);
    }
  }, [stopAutoScroll, heroBannersData.length]);
  
  const popularCategorySlugs = ['warface', 'callofdutywarzone', 'rust', 'pubg']; 
  const popularCategories = useMemo(() => {
    return popularCategorySlugs
      .map(slug => allCategories.find(c => c.slug === slug))
      .filter((category): category is Category => category !== undefined);
  }, [allCategories]);

  const advantagesToDisplay = siteSettings?.homepage_advantages && siteSettings.homepage_advantages.length > 0 
    ? siteSettings.homepage_advantages 
    : defaultAdvantages;

  const iconMap: { [key: string]: React.ElementType } = {
    DollarSign, Headphones, Dices, ThumbsUp, Zap, ShieldCheck, ShoppingCart, TrendingUp
  };


  if (isLoading) { 
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height)-var(--footer-height))]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-xl text-primary mt-4">Загрузка данных...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <p className="text-lg text-destructive-foreground">Ошибка загрузки страницы:</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {isLoadingBanners ? (
        <div className="relative min-h-[calc(100vh-var(--header-height))] flex items-center justify-center text-foreground overflow-hidden pb-12 md:pb-16 bg-muted/20">
           <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : activeHeroBanner && activeHeroBanner.image_url ? (
        <section className="relative min-h-[calc(100vh-var(--header-height))] flex items-center justify-center text-foreground overflow-hidden pb-12 md:pb-16 bg-muted/20">
          <Image
            src={activeHeroBanner.image_url}
            alt={activeHeroBanner.image_alt_text || activeHeroBanner.title || "Hero Background"}
            layout="fill"
            objectFit="cover"
            style={{ objectPosition: activeHeroBanner.hero_image_object_position || 'center top' }}
            className="absolute inset-0 z-0 opacity-30 md:opacity-40"
            data-ai-hint={activeHeroBanner.hero_image_hint || `${activeHeroBanner.title} background`}
            priority
            key={`${activeHeroBanner.id}-hero-bg-${currentHeroIndex}`}
          />
          <div className="absolute inset-0 z-10 bg-black/50" />

          <div
            key={`${activeHeroBanner.id}-${currentHeroIndex}-content`}
            className="relative z-20 container mx-auto px-4 animate-in fade-in-0 slide-in-from-bottom-5 duration-1000 ease-out"
          >
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-2/5 text-center md:text-left mb-8 md:mb-0 md:pr-8">
                {activeHeroBanner.subtitle && (
                    <p className="text-icon-color font-semibold uppercase tracking-wider text-xs md:text-sm mb-1 md:mb-2">
                        {activeHeroBanner.subtitle}
                    </p>
                )}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal uppercase tracking-wider mb-3 md:mb-4 text-white [text-shadow:_2px_2px_8px_hsl(var(--background))]">
                  {activeHeroBanner.title}
                </h1>
                {activeHeroBanner.description && (
                    <p className="text-xs md:text-sm text-slate-200 max-w-md mb-6 md:mb-8 [text-shadow:_1px_1px_4px_hsl(var(--background))]">
                    {activeHeroBanner.description}
                    </p>
                )}
                <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-3 md:gap-4">
                  {activeHeroBanner.price_text && (
                    <p className="text-lg md:text-xl font-bold text-icon-color [text-shadow:_0_0_8px_hsl(var(--icon-color-hsl)/0.7)]">
                        {activeHeroBanner.price_text}
                    </p>
                  )}
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="border-icon-color text-icon-color hover:bg-transparent hover:border-icon-color/70 hover:text-icon-color/90 px-6 py-2.5 text-sm md:text-base shadow-lg backdrop-blur-sm bg-transparent"
                  >
                    <Link href={activeHeroBanner.button_link || (activeHeroBanner.game_slug ? `/games/${activeHeroBanner.game_slug}` : '#products')}>
                        {activeHeroBanner.button_text || 'Подробнее'}
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="md:w-3/5 flex flex-col items-center">
                 {heroProductsOnBanner.length > 0 && (
                    <div className="w-full text-center mb-3 md:mb-4 self-center">
                        <Badge variant="outline" className="title-carousel bg-transparent text-icon-color border-icon-color shadow-md py-1 px-3 text-xs md:text-sm animate-pulse">
                            <Zap className="h-4 w-4 mr-1.5 text-icon-color" /> Бестселлеры
                        </Badge>
                    </div>
                 )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3 w-full max-w-lg md:max-w-xl">
                  {heroProductsOnBanner.length > 0 ? heroProductsOnBanner.map((product) => (
                    <HeroProductCard key={product.id} product={product} className="w-full" />
                  )) : (
                    <p className="text-muted-foreground col-span-full text-center md:text-left text-sm">Рекомендуемые товары для этого баннера скоро появятся.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {heroBannersData.length > 1 && (
            <>
            <div className="absolute z-30 right-2 md:right-4 lg:right-6 top-1/2 -translate-y-1/2 flex flex-col space-y-2">
                <Button onClick={handlePrevHero} variant="outline" size="icon" className="rounded-full bg-card/20 hover:bg-card/50 border-icon-color/30 text-icon-color hover:text-icon-color/90 backdrop-blur-sm shadow-lg hover:shadow-primary/30 w-8 h-8 md:w-10 md:h-10">
                <ChevronUp className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
                <Button onClick={handleNextHero} variant="outline" size="icon" className="rounded-full bg-card/20 hover:bg-card/50 border-icon-color/30 text-icon-color hover:text-icon-color/90 backdrop-blur-sm shadow-lg hover:shadow-primary/30 w-8 h-8 md:w-10 md:h-10">
                <ChevronDown className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
            </div>
            <div className="absolute z-30 bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5">
                {heroBannersData.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => { stopAutoScroll(); setCurrentHeroIndex(index);}}
                        className={cn(
                            "h-2 w-2 md:h-2.5 md:w-2.5 rounded-full transition-all duration-300",
                            currentHeroIndex === index ? "bg-primary scale-125" : "bg-muted-foreground/40 hover:bg-primary/60"
                        )}
                        aria-label={`Перейти к слайду ${index + 1}`}
                    />
                ))}
            </div>
            </>
          )}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 md:hidden">
              <Button variant="ghost" size="icon" className="text-primary/70 animate-bounce" onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}>
                  <ChevronsDown className="h-8 w-8 md:h-10 md:w-10" />
              </Button>
          </div>
        </section>
      ) : (
        <div className="relative min-h-[calc(100vh-var(--header-height))] flex items-center justify-center text-foreground overflow-hidden pb-10 md:pb-12 bg-muted/10">
            <p className="text-muted-foreground text-center">Баннеры не настроены или не активны. <br/> Скоро здесь будет что-то интересное!</p>
        </div>
      )}

      <section id="categories" className="py-10 md:py-12 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="popular-categories-title mb-6 md:mb-10">
            {siteSettings?.homepage_popular_categories_title || 'ПОПУЛЯРНЫЕ КАТЕГОРИИ'}
          </h2>
          {popularCategories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {popularCategories.map((category) => (
                <GameCard key={category.id} game={category} />
              ))}
            </div>
          ) : (
             <p className="text-center text-muted-foreground">Популярные категории скоро появятся.</p>
          )}
           <div className="text-center mt-10 md:mt-12">
            <Button size="lg" asChild variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary/90">
              <Link href="/games">Смотреть все игры</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="advantages" className="py-10 md:py-12 bg-card/5">
        <div className="container mx-auto px-4">
          <h2 className="section-title mb-8 md:mb-12 text-center uppercase text-foreground">НАШИ ПРЕИМУЩЕСТВА</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 text-center">
            {advantagesToDisplay.map((advantage, index) => {
               const IconComponent = iconMap[advantage.icon] || DollarSign; // Fallback to DollarSign
               return (
                  <div key={index} className="flex flex-col items-center p-4 md:p-6 bg-card rounded-xl shadow-md hover:shadow-primary/20 transition-shadow border border-transparent hover:border-primary/50">
                    <IconComponent className="h-10 w-10 md:h-12 md:w-12 text-primary mb-3 md:mb-4" />
                    <p className="text-base md:text-lg font-semibold text-foreground">{advantage.text}</p>
                  </div>
                );
            })}
          </div>
        </div>
      </section>

      <Separator className="my-6 md:my-10 bg-border/50" />

      {siteSettings?.homepage_show_case_opening_block && (
        <section id="case-opening" className="py-10 md:py-12 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="section-title mb-2 text-center uppercase text-foreground">
              {siteSettings.homepage_case_opening_title || 'ИСПЫТАЙ УДАЧУ!'}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              {siteSettings.homepage_case_opening_subtitle || 'Откройте кейс и получите шанс выиграть ценный приз'}
            </p>
            <div className="flex justify-center">
              {isCaseLoading ? (
                <div className="flex justify-center items-center w-[200px] h-[200px] sm:w-[250px] sm:h-[250px] bg-muted/30 rounded-lg">
                  <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
                </div>
              ) : mainCaseData && mainCaseData.imageUrl && mainCaseData.is_active ? (
                <div className="relative">
                  <Link href={`/cases/${mainCaseData.id}/open`} className="block relative transform transition-transform duration-300 hover:scale-105 focus-visible:ring-0 focus-visible:outline-none rounded-lg">
                    <Image
                      src={mainCaseData.imageUrl}
                      alt={mainCaseData.name}
                      width={250}
                      height={250}
                      className="rounded-lg shadow-2xl cursor-pointer w-[200px] h-[200px] sm:w-[250px] sm:h-[250px]"
                      data-ai-hint={mainCaseData.data_ai_hint || 'loot box treasure'}
                    />
                    {mainCaseData.is_hot_offer && (
                      <div className="absolute -top-2 -right-2 p-1 bg-destructive rounded-full shadow-lg animate-pulse sm:-top-3 sm:-right-3 sm:p-1.5">
                        <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                    )}
                  </Link>
                  {mainCaseData.timer_enabled && mainCaseData.timer_ends_at && (
                    <CaseTimerDisplay endsAt={mainCaseData.timer_ends_at} />
                  )}
                </div>
              ) : (
                <div className="text-center p-4 md:p-6 border-2 border-dashed border-border rounded-lg w-[200px] h-[200px] sm:w-[250px] sm:h-[250px] flex flex-col justify-center items-center">
                  <Gift className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-2 md:mb-3" />
                  <p className="text-sm text-muted-foreground">Кейс дня временно недоступен.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
    
