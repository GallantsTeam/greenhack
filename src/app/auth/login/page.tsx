
import LoginForm from '@/components/auth/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md shadow-xl bg-card/80 backdrop-blur-md border-border/30"> {/* Added semi-transparent background and blur for the card itself */}
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-primary">Вход</CardTitle>
        <CardDescription className="text-muted-foreground">
          Войдите в свой аккаунт Green Hack
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Нет аккаунта?{' '}
          <Link href="/auth/register" className="font-semibold text-primary hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
