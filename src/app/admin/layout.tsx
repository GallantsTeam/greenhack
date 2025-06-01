
'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    if (!loading && (!currentUser || currentUser.role !== 'admin')) {
      router.push('/'); // Redirect non-admins or unauthenticated users
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    const storedTheme = localStorage.getItem('adminTheme') as 'light' | 'dark' | null;
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('adminTheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  if (loading || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <p>Загрузка или проверка прав доступа...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader theme={theme} toggleTheme={toggleTheme} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-muted/30"> 
          {children}
        </main>
        <Toaster />
      </div>
    </div>
  );
}
