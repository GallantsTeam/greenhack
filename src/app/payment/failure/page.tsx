
// src/app/payment/failure/page.tsx
'use client';

import React from 'react';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function PaymentFailurePage() {
  // const searchParams = useSearchParams();
  // const orderId = searchParams.get('orderId'); // If you pass it

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height)-var(--footer-height))] p-4 text-center">
       <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-3xl font-bold text-destructive">Ошибка оплаты</CardTitle>
          <CardDescription className="text-muted-foreground text-base pt-2">
            К сожалению, ваш платеж не был успешно обработан.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* {orderId && <p className="text-sm text-muted-foreground">Номер вашей заявки: {orderId}</p>} */}
          <p className="text-sm text-muted-foreground">
            Пожалуйста, проверьте данные вашей карты или попробуйте другой способ оплаты. Если проблема сохранится, свяжитесь с поддержкой.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
             <Button asChild className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/account/balance">
                <RefreshCw className="mr-2 h-4 w-4" />
                Попробовать снова
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 border-primary text-primary hover:bg-primary/10">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                На главную
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
    
    