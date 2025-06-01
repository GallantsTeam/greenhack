
import RegisterForm from '@/components/auth/RegisterForm';
import Link from 'next/link';
import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image'; // Assuming logo is an image

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="w-full p-6 md:p-8 space-y-6 rounded-xl bg-slate-900/50 backdrop-blur-md border border-slate-700/50 shadow-2xl">
      <div className="text-center">
        {/* Placeholder for Logo */}
        <div className="mb-5 inline-block">
           <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Создание аккаунта</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Присоединяйтесь к Green Hack
        </p>
      </div>
      <Suspense fallback={<LoadingFallback />}>
        <RegisterForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{' '}
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          Войти
        </Link>
      </p>
    </div>
  );
}

