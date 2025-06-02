'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserNotification } from '@/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const UserNotificationBell: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/${currentUser.id}/notifications`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Не удалось загрузить уведомления (статус: ' + response.status + ').' }));
        throw new Error(errorData.message || 'Не удалось загрузить уведомления.');
      }
      const data: UserNotification[] = await response.json();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchNotifications();
  }, [currentUser, fetchNotifications]);
  
  useEffect(() => {
    if (isPopoverOpen && unreadCount > 0) {
        // Consider if auto-mark as read on open is desired or manual action only
    }
  }, [isPopoverOpen, unreadCount]);

  const handleMarkAsRead = async (notificationId: number) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/user/notifications/${notificationId}/read`, { method: 'PUT' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Не удалось отметить уведомление как прочитанное.' }));
        throw new Error(errorData.message);
      }
      fetchNotifications(); 
    } catch (error: any) {
      toast({ variant: "destructive", title: "Ошибка", description: error.message });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser || unreadCount === 0) return;
    try {
      const response = await fetch(`/api/user/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }) 
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Не удалось отметить все уведомления как прочитанные.' }));
        throw new Error(errorData.message);
      }
      fetchNotifications(); 
    } catch (error: any) {
      toast({ variant: "destructive", title: "Ошибка", description: error.message });
    }
  };

  const formatNotificationDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-primary hover:text-primary/80 hover:bg-primary/10 rounded-full p-1.5 h-8 w-8 sm:h-9 sm:w-9">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 text-xs rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Открыть уведомления</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0 bg-card border-border shadow-xl" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h4 className="font-medium text-sm text-foreground">Уведомления</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs text-primary hover:text-primary/80 h-auto py-1 px-2">
              <CheckCheck className="mr-1.5 h-3.5 w-3.5"/>
              Прочитать все
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px] sm:h-[350px]">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center h-full py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">Нет новых уведомлений.</p>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 hover:bg-muted/50 transition-colors",
                    !notification.is_read && "bg-primary/5"
                  )}
                >
                  {notification.link_url ? (
                    <Link 
                      href={notification.link_url} 
                      className="block" 
                      onClick={() => {
                        if (!notification.is_read) handleMarkAsRead(notification.id);
                        setIsPopoverOpen(false); // Close popover on link click
                      }}
                    >
                      <p className={cn("text-sm text-foreground", !notification.is_read && "font-semibold")}>{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatNotificationDate(notification.created_at)}</p>
                    </Link>
                  ) : (
                    <div onClick={() => { if (!notification.is_read) handleMarkAsRead(notification.id); }}>
                       <p className={cn("text-sm text-foreground", !notification.is_read && "font-semibold")}>{notification.message}</p>
                       <p className="text-xs text-muted-foreground mt-1">{formatNotificationDate(notification.created_at)}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default UserNotificationBell;