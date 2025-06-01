
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Added Link import

const loginSchema = z.object({
  emailOrLogin: z.string().min(1, { message: "Email или логин обязательны." }),
  password: z.string().min(6, { message: "Пароль должен быть не менее 6 символов." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { toast } = useToast();
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrLogin: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(data.emailOrLogin, data.password);
      toast({
        title: "Вход успешен!",
        description: "Вы успешно вошли в систему.",
        variant: "default",
      });
      // router.push('/account'); // AuthContext will handle redirect
    } catch (error: any) {
      console.error("Login error in form:", error);
      toast({
        title: "Ошибка входа",
        description: error.message || "Произошла ошибка при входе.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="emailOrLogin"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-muted-foreground">Email или Логин</FormLabel>
              <FormControl>
                <Input 
                  placeholder="yourname@example.com" 
                  {...field} 
                  disabled={isLoading}
                  className="bg-slate-800/60 border-slate-700 placeholder:text-slate-500 focus:border-primary focus:ring-primary/50"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-muted-foreground">Пароль</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  {...field} 
                  disabled={isLoading} 
                  className="bg-slate-800/60 border-slate-700 placeholder:text-slate-500 focus:border-primary focus:ring-primary/50"
                />
              </FormControl>
              <div className="text-right">
                <Link href="/auth/forgot-password" // TODO: Create this page
                      className="text-xs text-primary hover:underline">
                  Забыли пароль?
                </Link>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 text-base font-semibold" disabled={isLoading}>
          {isLoading ? "Вход..." : "Войти"}
        </Button>
      </form>
    </Form>
  );
}

