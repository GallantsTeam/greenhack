
import LoginForm from '@/components/auth/LoginForm';
import Link from 'next/link';
import Image from 'next/image'; // Assuming logo is an image

export default function LoginPage() {
  return (
    <div className="w-full p-6 md:p-8 space-y-6 rounded-xl bg-slate-900/50 backdrop-blur-md border border-slate-700/50 shadow-2xl">
      <div className="text-center">
        {/* Placeholder for Logo - Replace with your actual logo component or Image tag */}
        <div className="mb-5 inline-block">
           <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Вход в аккаунт</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Введите свои данные для доступа
        </p>
      </div>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Еще нет аккаунта?{' '}
        <Link href="/auth/register" className="font-medium text-primary hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}

