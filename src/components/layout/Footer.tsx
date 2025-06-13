
'use client';
import Link from 'next/link';
import { LayoutGrid, Star, HelpCircle, FileText, BarChart3, Copyright, Home, Mail, Users, Phone, MapPin, Bot, MessageCircle, ShoppingBag, ShieldCheck as ShieldCheckIcon } from 'lucide-react'; // Added ShieldCheckIcon
import type { NavItem as CustomNavItemType, SiteSettings } from '@/types';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const iconMap: { [key: string]: React.ElementType } = {
  Home,
  LayoutGrid,
  Star,
  HelpCircle,
  FileText,
  BarChart3,
  Mail,
  Users, 
  Phone,
  MapPin,
  Bot, 
  MessageCircle,
  ShoppingBag,
  ShieldCheck: ShieldCheckIcon, // Added ShieldCheck
};

const staticDefaultNavItems: CustomNavItemType[] = [
    { id: -1, label: 'Главная', href: '/', icon_name: 'Home', item_order: 0, is_visible: true },
    { id: -2, label: 'Каталог игр', href: '/games', icon_name: 'LayoutGrid', item_order: 1, is_visible: true },
    { id: -3, label: 'Отзывы', href: '/reviews', icon_name: 'Star', item_order: 2, is_visible: true },
    { id: -4, label: 'FAQ', href: '/faq', icon_name: 'HelpCircle', item_order: 3, is_visible: true },
    { id: -5, label: 'Правила', href: '/rules', icon_name: 'FileText', item_order: 4, is_visible: true }, // Added Rules
    { id: -7, label: 'Оферта', href: '/offer', icon_name: 'ShieldCheck', item_order: 6, is_visible: true }, // Added Offer
    { id: -6, label: 'Статусы', href: '/statuses', icon_name: 'BarChart3', item_order: 5, is_visible: true },
];


const Footer = ({ simplified = false }: { simplified?: boolean }) => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [navItems, setNavItems] = useState<CustomNavItemType[]>(staticDefaultNavItems.filter(item => item.is_visible).sort((a,b) => (a.item_order || 0) - (b.item_order || 0)));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const settingsRes = await fetch('/api/site-settings-public');

        if (settingsRes.ok) {
          setSiteSettings(await settingsRes.json());
        } else {
          console.warn("Footer: Failed to fetch site settings.");
          setSiteSettings({
            site_name: 'Green Hack',
            site_description: null,
            logo_url: null,
            footer_text: `© ${new Date().getFullYear()} Green Hack. Все права защищены.`,
            contact_vk_label: 'Наша беседа VK',
            contact_vk_url: '#',
            contact_telegram_bot_label: 'Наш Telegram Бот',
            contact_telegram_bot_url: '#',
            contact_email_label: 'Email поддержки',
            contact_email_address: 'support@example.com',
            footer_marketplace_text: 'Мы продаем на:',
            footer_marketplace_logo_url: 'https://yougame.biz/images/rlm/logo/logoconcept4.png',
            footer_marketplace_link_url: 'https://yougame.biz/members/263428/',
            footer_marketplace_is_visible: true,
            rules_page_content: null,
            offer_page_content: null,
          });
        }
        
      } catch (error) {
        console.error("Error fetching footer data:", error);
         setSiteSettings({
            site_name: 'Green Hack',
            site_description: null,
            logo_url: null,
            footer_text: `© ${new Date().getFullYear()} Green Hack. Все права защищены.`,
            contact_vk_label: 'Наша беседа VK',
            contact_vk_url: '#',
            contact_telegram_bot_label: 'Наш Telegram Бот',
            contact_telegram_bot_url: '#',
            contact_email_label: 'Email поддержки',
            contact_email_address: 'support@example.com',
            footer_marketplace_text: 'Мы продаем на:',
            footer_marketplace_logo_url: 'https://yougame.biz/images/rlm/logo/logoconcept4.png',
            footer_marketplace_link_url: 'https://yougame.biz/members/263428/',
            footer_marketplace_is_visible: true,
            rules_page_content: null,
            offer_page_content: null,
          });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (simplified) {
    return (
      <footer className="text-center text-xs text-muted-foreground py-3 border-t border-border bg-card mt-auto md:fixed md:bottom-0 md:left-0 md:right-0 md:ml-64">
        <p className="flex items-center justify-center">
          <Copyright className="h-4 w-4 mr-1.5" /> 
          © {new Date().getFullYear()}&#8209;{new Date().getFullYear() + 1} {siteSettings?.site_name || "GreenHacks"}. Все права защищены.
        </p>
        <p className="mt-1 text-sm">
          <a href="https://gallants.ru/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center">
            Разработано: <span className="text-destructive animate-red-blink font-semibold ml-1">GallantTeam</span>
          </a>
        </p>
      </footer>
    );
  }

  const currentSiteName = siteSettings?.site_name || 'GreenHacks';
  const siteNameParts = currentSiteName.split(' ');
  const siteNameFirstPart = siteNameParts[0];
  const siteNameSecondPart = siteNameParts.length > 1 ? siteNameParts.slice(1).join(' ') : '';

  return (
    <footer className="bg-background border-t border-border py-8 mt-auto">
      <div className="container mx-auto px-4 text-muted-foreground">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Site Info Section (Left Column on MD+) */}
          <div className="md:col-span-1">
              <h3 className="text-lg font-bold text-foreground mb-2">
                {siteSettings?.logo_url ? (
                  <Image src={siteSettings.logo_url} alt={currentSiteName} width={150} height={40} className="max-h-10 w-auto" data-ai-hint="site logo"/>
                ) : (
                  <>
                    <span className="text-primary">{siteNameFirstPart}</span>
                    <span className="text-icon-color">{siteNameSecondPart}</span>
                  </>
                )}
              </h3>
              <p className="text-sm mb-4 max-w-md">
                {siteSettings?.site_description || "Широкий выбор читов для популярных игр. Повысьте свою эффективность и шансы на победу!"}
              </p>
          </div>

          {/* Marketplace Block (Middle Column on MD+) */}
          {siteSettings?.footer_marketplace_is_visible && siteSettings.footer_marketplace_logo_url && (
            <div className="md:col-span-1 text-center">
              <p className="text-sm font-semibold text-foreground mb-2">
                {siteSettings.footer_marketplace_text || "Мы продаем на:"}
              </p>
              <a 
                href={siteSettings.footer_marketplace_link_url || "#"} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block hover:opacity-80 transition-opacity"
              >
                <Image 
                  src={siteSettings.footer_marketplace_logo_url} 
                  alt="Marketplace Logo" 
                  width={180} 
                  height={45} 
                  className="max-h-12 w-auto"
                  data-ai-hint="marketplace logo"
                />
              </a>
              <div className="mt-2">
                <a href="https://yougame.biz" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Мы продаём на YOUGAME
                </a>
              </div>
            </div>
          )}
           {/* Placeholder if marketplace is not visible, to maintain grid structure on MD+ */}
           {(!siteSettings?.footer_marketplace_is_visible || !siteSettings.footer_marketplace_logo_url) && (
            <div className="hidden md:block md:col-span-1"></div>
           )}


          {/* Contact Us Section (Right Column on MD+) */}
          <div className="md:col-span-1 md:text-right">
              <h3 className="text-lg font-bold text-foreground mb-3">Связь с нами</h3>
              <ul className="space-y-2">
                {siteSettings?.contact_vk_url && siteSettings?.contact_vk_label && (
                  <li>
                    <a href={siteSettings.contact_vk_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center md:justify-end text-sm hover:text-primary transition-colors">
                      <Users className="h-4 w-4 mr-2 md:mr-0 md:ml-2 md:order-2 text-primary" /> {siteSettings.contact_vk_label}
                    </a>
                  </li>
                )}
                {siteSettings?.contact_telegram_bot_url && siteSettings?.contact_telegram_bot_label && (
                  <li>
                    <a href={siteSettings.contact_telegram_bot_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center md:justify-end text-sm hover:text-primary transition-colors">
                      <Bot className="h-4 w-4 mr-2 md:mr-0 md:ml-2 md:order-2 text-primary" /> {siteSettings.contact_telegram_bot_label}
                    </a>
                  </li>
                )}
                {siteSettings?.contact_email_address && siteSettings?.contact_email_label && (
                  <li>
                    <a href={`mailto:${siteSettings.contact_email_address}`} className="inline-flex items-center md:justify-end text-sm hover:text-primary transition-colors">
                      <Mail className="h-4 w-4 mr-2 md:mr-0 md:ml-2 md:order-2 text-primary" /> {siteSettings.contact_email_label}
                    </a>
                  </li>
                )}
              </ul>
          </div>
        </div>

        {navItems.length > 0 && (
          <div className="border-t border-border pt-6 mb-6">
            <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 md:gap-x-6">
              {isLoading && !siteSettings ? (
                  Array.from({ length: 6 }).map((_, index) => ( // Increased to 6 for Rules/Offer
                      <div key={index} className="h-5 w-24 bg-muted rounded animate-pulse"></div>
                  ))
              ) : navItems.length > 0 ? (
                  navItems.map((item) => {
                  const IconComponent = item.icon_name ? iconMap[item.icon_name] : null;
                  return (
                      <Link key={item.id || item.label} href={item.href} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                      {IconComponent && <IconComponent className="h-4 w-4 text-primary/80" />}
                      {item.label}
                      </Link>
                  );
                  })
              ) : null}
            </nav>
          </div>
        )}

        <div className="border-t border-border pt-6 text-center">
          <p className="text-sm">
            <Copyright className="inline h-4 w-4 mr-1 align-text-bottom" /> 
            {siteSettings?.footer_text || `2025​-​2026 ${currentSiteName}. Все права защищены.`}
          </p>
          <p className="mt-1 text-sm"> 
            <a href="https://gallants.ru/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center">
              Разработано: <span className="text-destructive animate-red-blink font-semibold ml-1">GallantTeam</span>
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
