
import RegisterForm from '@/components/auth/RegisterForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import React, { Suspense } from 'react'; // Added React and Suspense
import { Loader2 } from 'lucide-react'; // For fallback

// Simple fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-md shadow-xl bg-card/80 backdrop-blur-md border-border/30"> {/* Added semi-transparent background and blur for the card itself */}
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-primary">Регистрация</CardTitle>
        <CardDescription className="text-muted-foreground">
          Создайте новый аккаунт Green Hack
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<LoadingFallback />}>
          <RegisterForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{' '}
          <Link href="/auth/login" className="font-semibold text-primary hover:underline">
            Войти
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
