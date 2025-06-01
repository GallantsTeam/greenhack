
// src/app/legal-info/page.tsx
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ShieldCheck, ArrowRight } from 'lucide-react';
import Image from 'next/image'; // Import Image

export default function LegalInfoPage() {
  return (
    <div className="flex flex-col">
      <section className="relative py-12 md:py-16 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-primary/15 via-primary/5 to-background border-b border-border/20">
        <div className="container mx-auto px-4 text-center relative z-10">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary mb-3" />
          <h1 className="text-3xl md:text-4xl font-bold text-primary uppercase tracking-wider [text-shadow:_1px_1px_6px_hsl(var(--primary)/0.4)]">
            Правовая информация
          </h1>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <Card className="shadow-lg hover:shadow-primary/20 transition-shadow border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="text-xl text-primary flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Правила сайта
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Ознакомьтесь с основными правилами использования нашего сервиса, чтобы обеспечить комфортное и безопасное взаимодействие для всех пользователей.
              </p>
              <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary/90">
                <Link href="/rules">
                  Читать правила <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-primary/20 transition-shadow border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="text-xl text-primary flex items-center">
                <ShieldCheck className="mr-2 h-5 w-5" />
                Публичная оферта
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Договор публичной оферты на предоставление услуг. Пожалуйста, внимательно прочтите перед использованием сайта и совершением покупок.
              </p>
              <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary/90">
                <Link href="/offer">
                  Читать оферту <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
    