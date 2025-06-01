
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  emailOrLogin: z.string().min(1, { message: "Email или логин обязательны." }),
  password: z.string().min(6, { message: "Пароль должен быть не менее 6 символов." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { toast } = useToast();
  const { login } = useAuth(); // Get login function from AuthContext
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
      await login(data.emailOrLogin, data.password); // Call login from AuthContext
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="emailOrLogin"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Email или Логин</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com или username" {...field} disabled={isLoading} />
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
              <FormLabel className="text-foreground">Пароль</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
          {isLoading ? "Вход..." : "Войти"}
        </Button>
      </form>
    </Form>
  );
}
