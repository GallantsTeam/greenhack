
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext'; 
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader2, BadgeHelp } from 'lucide-react';
import type { ReferralCodeCheckResponse } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Cookies from 'js-cookie';

const registerSchema = z.object({
  username: z.string().min(3, { message: "Имя пользователя должно быть не менее 3 символов." }),
  email: z.string().email({ message: "Неверный формат email." }),
  password: z.string().min(6, { message: "Пароль должен быть не менее 6 символов." }),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают.",
  path: ["confirmPassword"], 
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const REFERRAL_COOKIE_NAME = 'gh_referral_code';

export default function RegisterForm() {
  const { toast } = useToast();
  const { register: registerUser } = useAuth(); 
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [referralCodeValue, setReferralCodeValue] = useState(''); // Tracks input value for UI feedback
  const [referralStatus, setReferralStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      referralCode: '',
    },
  });

  const checkReferralCode = useCallback(async (code: string): Promise<boolean> => {
    if (!code.trim()) {
      setReferralStatus('idle');
      setReferrerName(null);
      form.clearErrors('referralCode');
      return true; // Empty is not "invalid" for submission purpose
    }
    setReferralStatus('checking');
    try {
      const response = await fetch(`/api/referral/check?code=${encodeURIComponent(code)}`);
      const data: ReferralCodeCheckResponse = await response.json();
      if (response.ok && data.isValid) {
        setReferralStatus('valid');
        setReferrerName(data.referrerName || 'Неизвестный пригласитель');
        form.clearErrors('referralCode');
        return true;
      } else {
        setReferralStatus('invalid');
        setReferrerName(null);
        form.setError('referralCode', { type: 'manual', message: data.message || 'Реферальный код недействителен.' });
        return false;
      }
    } catch (error) {
      console.error('Error checking referral code:', error);
      setReferralStatus('invalid');
      setReferrerName(null);
      form.setError('referralCode', { type: 'manual', message: 'Ошибка проверки кода.' });
      return false;
    }
  }, [form]);

  // Effect to handle initial loading of referral code from URL or cookie
  useEffect(() => {
    const refCodeFromUrl = searchParams.get('ref');
    
    if (refCodeFromUrl) {
      form.setValue('referralCode', refCodeFromUrl, { shouldValidate: false }); // Validate via checkReferralCode
      setReferralCodeValue(refCodeFromUrl);
      Cookies.set(REFERRAL_COOKIE_NAME, refCodeFromUrl, { expires: 7, path: '/' });
      checkReferralCode(refCodeFromUrl);
    } else {
      const refCodeFromCookie = Cookies.get(REFERRAL_COOKIE_NAME);
      if (refCodeFromCookie) {
        form.setValue('referralCode', refCodeFromCookie, { shouldValidate: false });
        setReferralCodeValue(refCodeFromCookie);
        checkReferralCode(refCodeFromCookie);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, form.setValue]); // checkReferralCode removed from deps to avoid loop, it's stable due to useCallback

  // Effect to handle manual input changes and cookie updates
  useEffect(() => {
    const subscription = form.watch(async (value, { name, type }) => {
      if (name === 'referralCode') {
        const code = value.referralCode || '';
        setReferralCodeValue(code); // Update local state for immediate input feedback
        
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }

        if (code.trim() === '') {
          setReferralStatus('idle');
          setReferrerName(null);
          form.clearErrors('referralCode');
          Cookies.remove(REFERRAL_COOKIE_NAME, { path: '/' });
          return;
        }
        
        debounceTimeoutRef.current = setTimeout(async () => {
          if (code.length > 2) { // Only check if code length is somewhat substantial
            const isValid = await checkReferralCode(code);
            if (isValid) {
              Cookies.set(REFERRAL_COOKIE_NAME, code, { expires: 7, path: '/' });
            } else {
              // If explicitly invalid, remove cookie. If 'checking' or 'idle', it might be valid later.
              if(referralStatus === 'invalid') {
                 Cookies.remove(REFERRAL_COOKIE_NAME, { path: '/' });
              }
            }
          }
        }, 500);
      }
    });
    return () => {
      subscription.unsubscribe();
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [form, checkReferralCode, referralStatus]); // Added referralStatus to dependencies to react to its changes

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    
    const finalReferralCode = data.referralCode?.trim();

    if (finalReferralCode && referralStatus === 'invalid') {
      toast({
        title: "Ошибка регистрации",
        description: "Пожалуйста, исправьте или удалите недействительный реферальный код.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    try {
      const submissionData = {
        ...data,
        referralCode: referralStatus === 'valid' && finalReferralCode ? finalReferralCode : undefined,
      };

      await registerUser(submissionData.username, submissionData.email, submissionData.password, submissionData.referralCode);
      
      // Clear cookie on successful registration if a referral code was used.
      if (submissionData.referralCode) {
        Cookies.remove(REFERRAL_COOKIE_NAME, { path: '/' });
      }

      toast({
        title: "Регистрация успешна!",
        description: "Вы успешно зарегистрированы. Теперь можете войти.",
        variant: "default",
      });
      // Router push is handled by AuthContext after successful registration (if needed)
    } catch (error: any) {
      console.error("Registration error in form:", error);
      toast({
        title: "Ошибка регистрации",
        description: error.message || "Произошла ошибка при регистрации.",
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
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Имя пользователя (Логин)</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} disabled={isLoading} />
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
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Подтвердите пароль</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="referralCode"
          render={({ field }) => ( // field now correctly manages the value from react-hook-form
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="text-foreground">Реферальный код (необязательно)</FormLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <BadgeHelp className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Если вас пригласил друг, введите его код.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder="ABC-1234" 
                    {...field} // Use field from render prop
                    disabled={isLoading || referralStatus === 'valid'}
                    className={referralStatus === 'valid' ? 'border-green-500 focus-visible:ring-green-500' : referralStatus === 'invalid' && field.value.length > 0 ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                  {referralStatus === 'checking' && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                  {referralStatus === 'valid' && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />}
                  {referralStatus === 'invalid' && field.value.length > 0 && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />}
                </div>
              </FormControl>
              {referralStatus === 'valid' && referrerName && (
                <p className="text-xs text-green-600">Код действителен. Пригласитель: {referrerName}</p>
              )}
              <FormMessage /> {/* This will display errors from Zod and form.setError */}
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || referralStatus === 'checking'}>
          {isLoading ? "Регистрация..." : "Зарегистрироваться"}
        </Button>
      </form>
    </Form>
  );
}
