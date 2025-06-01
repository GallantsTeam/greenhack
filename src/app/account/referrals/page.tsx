
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, Users, Gift, Copy, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import type { Referral } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function ReferralsPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState(currentUser?.referral_code || 'ЗАГРУЗКА...');
  const [referralLink, setReferralLink] = useState('');
  const [referredUsers, setReferredUsers] = useState<Referral[]>([]);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (currentUser?.referral_code) {
      setReferralCode(currentUser.referral_code);
      setReferralLink(typeof window !== 'undefined' ? `${window.location.origin}/auth/register?ref=${currentUser.referral_code}` : '');
    }
  }, [currentUser?.referral_code]);

  useEffect(() => {
    const fetchReferredUsers = async () => {
      if (!currentUser?.id) return;
      setIsLoadingReferrals(true);
      try {
        const response = await fetch(`/api/user/${currentUser.id}/referred-list`);
        if (!response.ok) throw new Error('Failed to fetch referred users');
        const data = await response.json();
        setReferredUsers(data);
      } catch (error) {
        console.error("Error fetching referred users:", error);
        toast({ title: "Ошибка", description: "Не удалось загрузить список рефералов.", variant: "destructive" });
      } finally {
        setIsLoadingReferrals(false);
      }
    };

    fetchReferredUsers();
  }, [currentUser?.id, toast]);

  const handleCopy = async (textToCopy: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      if (type === 'code') setCopiedCode(true);
      if (type === 'link') setCopiedLink(true);
      toast({ title: "Скопировано!", description: type === 'code' ? "Реферальный код скопирован." : "Реферальная ссылка скопирована." });
      setTimeout(() => {
        if (type === 'code') setCopiedCode(false);
        if (type === 'link') setCopiedLink(false);
      }, 2000);
    } catch (err) {
      toast({ title: "Ошибка", description: "Не удалось скопировать.", variant: "destructive" });
    }
  };
  
  // Placeholder for changing referral code (future feature)
  // const [newReferralCode, setNewReferralCode] = useState('');
  // const handleChangeReferralCode = async () => { /* API call to update referral code */ };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary tracking-tight">Реферальная Система</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center">
            <Share2 className="mr-2 h-6 w-6"/>
            Пригласите Друзей
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Поделитесь своим реферальным кодом или ссылкой и получайте GH за каждую покупку ваших друзей!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground">Ваш реферальный код:</p>
            <div className="flex items-center gap-2 mt-1">
              <Input type="text" value={referralCode} readOnly className="font-mono bg-muted text-foreground"/>
              <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10" onClick={() => handleCopy(referralCode, 'code')}>
                {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} 
              </Button>
            </div>
          </div>
           <div>
            <p className="text-sm font-medium text-foreground">Ваша реферальная ссылка:</p>
            <div className="flex items-center gap-2 mt-1">
              <Input type="text" value={referralLink} readOnly className="font-mono text-xs bg-muted text-foreground"/>
              <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10" onClick={() => handleCopy(referralLink, 'link')}>
                 {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {/* Future feature: Change referral code
          <div className="pt-4 border-t border-border">
             <p className="text-sm font-medium text-foreground mb-1">Изменить реферальный код (1 раз):</p>
             <div className="flex items-center gap-2">
              <Input 
                type="text" 
                placeholder="Новый-Код-123" 
                value={newReferralCode} 
                onChange={(e) => setNewReferralCode(e.target.value)}
                className="font-mono"
              />
              <Button variant="default" size="sm" onClick={handleChangeReferralCode} disabled>Сохранить</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Код должен быть уникальным, от 5 до 20 символов, только латиница и цифры.</p>
          </div>
          */}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Приглашено Друзей</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{isLoadingReferrals ? '...' : referredUsers.length}</div>
            <p className="text-xs text-muted-foreground pt-1">Всего приглашенных пользователей</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Заработано GH</CardTitle>
            <Gift className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoadingReferrals ? '...' : referredUsers.reduce((sum, ref) => sum + (ref.status === 'completed' ? ref.reward_amount_gh || 0 : 0) , 0).toFixed(2)} GH
            </div>
            <p className="text-xs text-muted-foreground pt-1">С реферальной программы</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Список ваших рефералов</CardTitle>
           <CardDescription className="text-muted-foreground">
            Пользователи, зарегистрировавшиеся по вашему коду.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingReferrals ? (
            <p className="text-muted-foreground">Загрузка списка рефералов...</p>
          ) : referredUsers.length > 0 ? (
            <ul className="space-y-2">
              {referredUsers.map(ref => (
                <li key={ref.id} className="p-3 bg-muted/50 rounded-md text-sm">
                  <span className="font-semibold text-foreground">{ref.referred_username || `Пользователь #${ref.referred_user_id}`}</span> - Статус: <span className={`font-medium ${ref.status === 'completed' ? 'text-primary' : 'text-muted-foreground'}`}>{ref.status === 'completed' ? 'Завершен' : ref.status === 'pending_purchase' ? 'Ожидает покупки' : 'Истек'}</span>
                  {ref.status === 'completed' && ref.reward_amount_gh && (
                     <span className="text-xs text-primary"> (+{ref.reward_amount_gh} GH)</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="min-h-[100px] flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                <p className="text-muted-foreground">У вас пока нет рефералов.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
