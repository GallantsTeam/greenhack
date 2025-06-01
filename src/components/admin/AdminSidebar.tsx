
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Package, ShoppingCart, Settings, LayoutDashboard, Layers, Palette, FileText, Ticket, ChevronRight, DollarSign, PercentSquare, HandCoins, CreditCard, Bot as BotIcon, MessageSquare as MessageSquareIcon, BarChart3, PencilRuler, KeyRound } from 'lucide-react'; // Added KeyRound
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import React, { useState, useEffect, useCallback } from 'react';
import type { SitePaymentGatewaySettings } from '@/types';
import { Badge } from '@/components/ui/badge';

const adminNavItemsBase = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard, baseRoute: '/admin', exact: true },
  { href: '/admin/users', label: 'Пользователи', icon: Users, baseRoute: '/admin/users' },
  { href: '/admin/products', label: 'Товары', icon: Package, baseRoute: '/admin/products' },
  { href: '/admin/categories', label: 'Категории', icon: Layers, baseRoute: '/admin/categories' },
  { href: '/admin/cases', label: 'Кейсы', icon: Palette, baseRoute: '/admin/cases' },
  { href: '/admin/promocodes', label: 'Промокоды', icon: PercentSquare, baseRoute: '/admin/promocodes' },
  { href: '/admin/key-activations', label: 'Активация Ключей', icon: KeyRound, baseRoute: '/admin/key-activations' }, // Added Key Activations link
  { href: '/admin/reviews', label: 'Отзывы', icon: MessageSquareIcon, baseRoute: '/admin/reviews', dataTestId: 'admin-reviews-link' },
  { href: '/admin/orders', label: 'Заказы', icon: ShoppingCart, baseRoute: '/admin/orders' },
  { href: '/admin/accounting', label: 'Бухгалтерия', icon: DollarSign, baseRoute: '/admin/accounting' },
  { href: '/statuses', label: 'Статус Читов', icon: BarChart3, baseRoute: '/statuses' },
  { href: '/admin/tickets', label: 'Тикеты', icon: Ticket, baseRoute: '/admin/tickets' },
];

const editorNavItem = {
    href: '/admin/editor', 
    label: 'Редактор',
    icon: PencilRuler,
    baseRoute: '/admin/editor',
};

const siteSettingsNavItem = {
    href: '/admin/site-settings',
    label: 'Настройки Сайта',
    icon: Settings,
    baseRoute: '/admin/site-settings',
};

const testPaymentsNavItem = { href: '/admin/test-payments', label: 'Тестовые Платежи', icon: HandCoins, baseRoute: '/admin/test-payments' };


export default function AdminSidebar() {
  const pathname = usePathname();
  const [showTestPaymentsLink, setShowTestPaymentsLink] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [pendingKeyActivationCount, setPendingKeyActivationCount] = useState(0); // New state for key activations

  const fetchPendingCounts = useCallback(async () => {
    try {
      const [reviewResponse, keyActivationResponse] = await Promise.all([
        fetch('/api/admin/reviews/pending-count'),
        fetch('/api/admin/key-activation-requests?status=pending_admin_approval') // Assuming API supports status filter or returns all and we filter client-side (better to filter API-side if possible)
      ]);

      if (reviewResponse.ok) {
        const reviewData = await reviewResponse.json();
        setPendingReviewCount(reviewData.count);
      } else {
        console.warn("Failed to fetch pending review count.");
      }

      if (keyActivationResponse.ok) {
        const keyActivationData = await keyActivationResponse.json();
        // If the API returns all requests, filter here. If it pre-filters, this is simpler.
        // For now, assuming the API returns only pending or we count all returned as pending if no status filter.
        setPendingKeyActivationCount(Array.isArray(keyActivationData) ? keyActivationData.length : 0);
      } else {
        console.warn("Failed to fetch pending key activation count.");
      }

    } catch (error) {
      console.error("Error fetching pending counts:", error);
    }
  }, []);


  useEffect(() => {
    fetchPendingCounts(); 

    if (pathname.startsWith('/admin/reviews') || pathname.startsWith('/admin/key-activations')) { 
        fetchPendingCounts();
    }

    const fetchPaymentSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const response = await fetch('/api/admin/site-settings/payment');
        if (response.ok) {
          const data: SitePaymentGatewaySettings = await response.json();
          setShowTestPaymentsLink(data.is_test_mode_active || false);
        } else {
          setShowTestPaymentsLink(false);
        }
      } catch (error) {
        setShowTestPaymentsLink(false);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchPaymentSettings();
  }, [fetchPendingCounts, pathname]);


  const isActive = (itemHref: string, itemBaseRoute?: string, exact?: boolean) => {
    const base = itemBaseRoute || itemHref;
    if (exact) {
      return pathname === base;
    }
    return pathname.startsWith(base) && (pathname === base || pathname.charAt(base.length) === '/');
  };

  const allNavItems = [...adminNavItemsBase];
  if (!isLoadingSettings && showTestPaymentsLink) {
    allNavItems.push(testPaymentsNavItem);
  }
  allNavItems.push(editorNavItem); 
  allNavItems.push(siteSettingsNavItem);


  return (
    <aside className="w-64 bg-card text-card-foreground border-r border-border flex-shrink-0 hidden md:flex flex-col">
      <div className="p-4 border-b border-border">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-xl font-semibold text-primary">Admin Panel</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="px-2 py-4 space-y-1">
          {allNavItems.sort((a, b) => (adminNavItemsBase.indexOf(a) !== -1 && adminNavItemsBase.indexOf(b) !== -1) ? 0 : adminNavItemsBase.indexOf(a) === -1 ? 1 : -1) // Keep base items first, then others
          .map((item) => {
            const active = isActive(item.href, item.baseRoute, (item as any).exact);
            const isReviewsLink = item.href === '/admin/reviews';
            const isKeyActivationsLink = item.href === '/admin/key-activations';
            return (
              <Button
                key={item.href}
                asChild
                variant={active ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start relative", 
                  active
                    ? "text-primary bg-primary/10"
                    : "text-foreground/70 hover:text-primary hover:bg-primary/5"
                )}
              >
                <Link href={item.href} className="flex items-center w-full">
                  <item.icon className="mr-3 h-5 w-5" />
                  <span className="flex-grow">{item.label}</span>
                  {isReviewsLink && pendingReviewCount > 0 && (
                    <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-xs rounded-full">
                      {pendingReviewCount}
                    </Badge>
                  )}
                  {isKeyActivationsLink && pendingKeyActivationCount > 0 && (
                    <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-xs rounded-full">
                      {pendingKeyActivationCount}
                    </Badge>
                  )}
                  {active && !((isReviewsLink && pendingReviewCount > 0) || (isKeyActivationsLink && pendingKeyActivationCount > 0)) && <ChevronRight className="ml-auto h-4 w-4" />}
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t border-border mt-auto">
      </div>
    </aside>
  );
}
