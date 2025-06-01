
// src/app/cases/[caseId]/open/page.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle as CardTitleOriginal } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertCircle, Loader2, ArrowLeft, Gift, Zap, ShoppingCart, DollarSign, CheckCircle, RotateCw, ListChecks, Timer, X, Palette, Info, Settings } from 'lucide-react';
import type { CaseItem, Prize, BoostOption, User } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { defaultBoostOptions } from '@/lib/case-data'; 
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const ROULETTE_ITEM_WIDTH = 100; // Adjusted for slightly smaller items initially
const ROULETTE_ITEM_HEIGHT = 120; // Adjusted
const ROULETTE_ITEM_GAP = 8;
const ROULETTE_CONTAINER_HEIGHT = 160; // Adjusted for new item height
const MIN_ROULETTE_ITEMS_MULTIPLIER = 35; // Increased for smoother visual
const MIN_TOTAL_ROULETTE_ITEMS = 180; // Increased for smoother visual
const ROULETTE_VISIBLE_ITEMS_APPROX = 5; // How many items are roughly visible

interface CaseTimerDisplayProps {
  endsAt: string | null | undefined;
  onTimerEnd?: () => void;
}

const CaseTimerDisplay: React.FC<CaseTimerDisplayProps> = ({ endsAt, onTimerEnd }) => {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!endsAt) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = +new Date(endsAt) - +new Date();
      let newTimeLeft = null;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        newTimeLeft = `${days > 0 ? days + "д " : ""}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        newTimeLeft = "Время истекло!";
        if (onTimerEnd) onTimerEnd();
      }
      setTimeLeft(newTimeLeft);
    };

    calculateTimeLeft();
    const timerInterval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timerInterval);
  }, [endsAt, onTimerEnd]);

  if (!timeLeft) {
    return null;
  }
   if (timeLeft === "Время истекло!") {
    return <p className="text-sm font-semibold text-destructive text-center mt-2">{timeLeft}</p>;
  }

  return (
    <div className="text-center mt-2">
      <p className="text-xs text-muted-foreground">До конца:</p>
      <p className="text-lg font-bold text-primary">{timeLeft}</p>
    </div>
  );
};


export default function OpenCasePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;
  const { toast } = useToast();
  const { currentUser, fetchUserDetails } = useAuth();

  const [caseData, setCaseData] = useState<CaseItem | null>(null);
  const [isLoadingCase, setIsLoadingCase] = useState(true);
  const [errorLoadingCase, setErrorLoadingCase] = useState<string | null>(null);
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [finalPrize, setFinalPrize] = useState<Prize | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [selectedBoosts, setSelectedBoosts] = useState<BoostOption[]>([]);
  const [rouletteItems, setRouletteItems] = useState<Prize[]>([]);
  const rouletteRef = useRef<HTMLDivElement>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [currentCaseOpeningId, setCurrentCaseOpeningId] = useState<number | null>(null);
  const [isProcessingPrizeAction, setIsProcessingPrizeAction] = useState(false); 
  const [isTimerExpired, setIsTimerExpired] = useState(false);
  const [activeBoostOptions, setActiveBoostOptions] = useState<BoostOption[]>([]);


  useEffect(() => {
    const fetchCaseData = async () => {
      if (!caseId) return;
      setIsLoadingCase(true);
      setErrorLoadingCase(null);
      try {
        const response = await fetch(`/api/cases/${caseId}`);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({message: "Кейс не найден или произошла ошибка."}));
          throw new Error(errData.message);
        }
        const data: CaseItem = await response.json();
        setCaseData(data);
        setTotalCost(data.base_price_gh); 

        if (data.timer_enabled && data.timer_ends_at) {
          if (new Date(data.timer_ends_at) <= new Date()) {
            setIsTimerExpired(true);
          }
        }
        
        const caseSpecificBoostConfigs = data.boost_options_config || [];
        const appliedBoostOptions = defaultBoostOptions
            .filter(dbo => dbo.id !== 'no-boost') 
            .map(defaultBoost => {
                const savedConfig = caseSpecificBoostConfigs.find(cfg => cfg.boost_ref_id === defaultBoost.id);
                
                if (savedConfig && savedConfig.is_active_for_case) { 
                    return {
                        ...defaultBoost,
                        label: savedConfig.label || defaultBoost.label, 
                        cost: savedConfig.override_cost_gh ?? defaultBoost.cost,
                        chanceMultiplier: savedConfig.override_chance_multiplier ?? defaultBoost.chanceMultiplier,
                        description: savedConfig.override_description || defaultBoost.description,
                    };
                } else if (!savedConfig && defaultBoost.isActiveByDefault) { // Assume defaultBoosts have an 'isActiveByDefault' flag
                     return defaultBoost;
                }
                return null;
            })
            .filter(Boolean) as BoostOption[];
        setActiveBoostOptions(appliedBoostOptions);


        if (data.prizes && data.prizes.length > 0) {
          const items: Prize[] = [];
          // Ensure a good number of items for a smooth visual spin
          const minRouletteLength = Math.max(data.prizes.length * MIN_ROULETTE_ITEMS_MULTIPLIER, MIN_TOTAL_ROULETTE_ITEMS); 
          
          let currentLength = 0;
          while(currentLength < minRouletteLength) {
            // Create a shuffled copy of prizes for each "lap" to increase visual randomness
            const randomizedPrizes = [...data.prizes].sort(() => 0.5 - Math.random());
            for (const prize of randomizedPrizes) {
              items.push({...prize, uniqueKey: `${prize.id}-${currentLength}`}); // Ensure uniqueKey for React list rendering
              currentLength++;
              if (currentLength >= minRouletteLength) break;
            }
          }
          setRouletteItems(items);
        } else {
          setErrorLoadingCase("В этом кейсе нет призов.");
        }

      } catch (err: any) {
        setErrorLoadingCase(err.message || "Не удалось загрузить данные кейса.");
      } finally {
        setIsLoadingCase(false);
      }
    };
    fetchCaseData();
  }, [caseId]);
  
 useEffect(() => {
    if (rouletteRef.current && rouletteItems.length > 0 && !isSpinning && !showResultDialog) {
      const itemFullWidth = ROULETTE_ITEM_WIDTH + ROULETTE_ITEM_GAP;
      const startRange = Math.floor(rouletteItems.length / 3);
      const randomStartOffset = Math.floor(Math.random() * startRange);
      const initialMiddleIndex = startRange + randomStartOffset;
      
      const initialScroll = Math.max(0, (initialMiddleIndex * itemFullWidth) - (rouletteRef.current.offsetWidth / 2) + (itemFullWidth /2) );
      rouletteRef.current.scrollTo({ left: initialScroll, behavior: 'auto' });
    }
  }, [rouletteItems, isLoadingCase, isSpinning, showResultDialog]);


  useEffect(() => {
    if(caseData) {
        const boostCost = selectedBoosts.reduce((sum, boost) => sum + boost.cost, 0);
        setTotalCost(caseData.base_price_gh + boostCost);
    }
  }, [selectedBoosts, caseData]);

  const handleBoostChange = (boost: BoostOption, checked: boolean) => {
    setSelectedBoosts(prevSelected => {
      if (checked) {
        return [...prevSelected, boost];
      } else {
        return prevSelected.filter(b => b.id !== boost.id);
      }
    });
  };

 const handleSpin = async () => {
    if (isSpinning || !rouletteItems.length || !rouletteRef.current || !currentUser || !caseData) return;
    if (isTimerExpired) {
      toast({ title: "Время вышло", description: "К сожалению, время для открытия этого кейса истекло.", variant: "destructive" });
      return;
    }
    if (currentUser.balance < totalCost) {
       toast({ title: "Недостаточно средств", description: `Требуется ${totalCost.toFixed(2)} GH. Ваш баланс: ${currentUser.balance.toFixed(2)} GH`, variant: "destructive" });
      return;
    }

    setIsSpinning(true);
    setFinalPrize(null);
    setShowResultDialog(false);
    setCurrentCaseOpeningId(null);

    try {
      const response = await fetch('/api/case/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUser.id, 
          caseId: caseData.id,
          selectedBoostIds: selectedBoosts.map(b => b.id) 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({ title: "Ошибка открытия", description: data.message || "Не удалось открыть кейс.", variant: "destructive" });
        if (data.updatedUser && currentUser && fetchUserDetails) {
           fetchUserDetails(currentUser.id); 
        }
        setIsSpinning(false);
        return;
      }
      
      const serverWinningPrize: Prize = data.winningPrize;
      setFinalPrize(serverWinningPrize); 
      setCurrentCaseOpeningId(data.caseOpeningId);
      if (data.updatedUser && currentUser && fetchUserDetails) {
        fetchUserDetails(currentUser.id);
      }

      const rouletteElement = rouletteRef.current!;
      const itemFullWidth = ROULETTE_ITEM_WIDTH + ROULETTE_ITEM_GAP;
      
      const matchingIndices = rouletteItems.reduce((acc, item, index) => {
        if (item.id === serverWinningPrize.id) {
          acc.push(index);
        }
        return acc;
      }, [] as number[]);

      let winningPrizeIndex = -1;
      if (matchingIndices.length > 0) {
          const preferredStopAreaStart = Math.floor(rouletteItems.length * 0.6); // Start checking from 60% of the reel
          const preferredIndices = matchingIndices.filter(idx => idx >= preferredStopAreaStart);
          if (preferredIndices.length > 0) {
              winningPrizeIndex = preferredIndices[Math.floor(Math.random() * preferredIndices.length)];
          } else {
              winningPrizeIndex = matchingIndices[Math.floor(Math.random() * matchingIndices.length)];
          }
      } else {
        console.error(`CRITICAL: Server winning prize ID ${serverWinningPrize.id} (${serverWinningPrize.name}) not found in client-side rouletteItems. This indicates a data mismatch. Stopping at a random item.`);
        winningPrizeIndex = Math.floor(rouletteItems.length / 2) + Math.floor(Math.random() * 10 - 5); // Fallback to a somewhat central random item
        winningPrizeIndex = Math.max(0, Math.min(winningPrizeIndex, rouletteItems.length - 1));
      }
      
      // Ensure the selected index is not too close to the edges for a good spin visual if possible
      if(rouletteItems.length > ROULETTE_VISIBLE_ITEMS_APPROX * 2) {
        winningPrizeIndex = Math.max(ROULETTE_VISIBLE_ITEMS_APPROX, Math.min(winningPrizeIndex, rouletteItems.length - ROULETTE_VISIBLE_ITEMS_APPROX - 1));
      } else if (rouletteItems.length > 0) {
        winningPrizeIndex = Math.max(0, Math.min(winningPrizeIndex, rouletteItems.length - 1));
      } else {
        winningPrizeIndex = 0; // Should not happen
      }

      const targetCenterOffset = (rouletteElement.offsetWidth / 2) - (itemFullWidth / 2);
      let finalScrollTo = (winningPrizeIndex * itemFullWidth) - targetCenterOffset;
      
      const spinDuration = 7000 + Math.random() * 2000; 
      const currentScroll = rouletteElement.scrollLeft;
      
      const minSpins = 5 + Math.floor(Math.random() * 3); 
      const oneFullSpinDistance = (rouletteItems.length / (MIN_ROULETTE_ITEMS_MULTIPLIER / 2.5)) * itemFullWidth; 
      
      let totalDistanceToSpin = (oneFullSpinDistance * minSpins) + (finalScrollTo - currentScroll);
      if (finalScrollTo < currentScroll && Math.abs(finalScrollTo - currentScroll) < oneFullSpinDistance) {
           totalDistanceToSpin += oneFullSpinDistance; // Ensure it spins forward if target is just behind
      }


      const startTime = performance.now();
      const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

      const animateTheScroll = (timestamp: number) => {
        const elapsedTime = timestamp - startTime;
        let progress = elapsedTime / spinDuration;
        progress = Math.min(progress, 1); 

        const easedProgress = easeOutQuart(progress); 
        const newScrollLeft = currentScroll + totalDistanceToSpin * easedProgress;
        
        rouletteElement.scrollLeft = newScrollLeft;

        if (progress < 1) {
          requestAnimationFrame(animateTheScroll);
        } else {
          // Precise stop
          rouletteElement.scrollTo({ left: finalScrollTo, behavior: 'smooth' }); 
          setTimeout(() => {
            setShowResultDialog(true);
            setIsSpinning(false);
          }, 400); 
        }
      };
      requestAnimationFrame(animateTheScroll);

    } catch (error: any) {
      console.error("Spin error:", error);
      toast({ title: "Ошибка", description: "Произошла ошибка при открытии кейса.", variant: "destructive" });
      setIsSpinning(false);
    }
  };
  
  const resetForNewSpin = () => {
    setFinalPrize(null);
    setShowResultDialog(false);
    setCurrentCaseOpeningId(null);
    // setSelectedBoosts([]); // Uncomment to reset boosts
    if (rouletteRef.current && rouletteItems.length > 0) {
        const itemFullWidth = ROULETTE_ITEM_WIDTH + ROULETTE_ITEM_GAP;
        const startRange = Math.floor(rouletteItems.length / 3);
        const randomStartOffset = Math.floor(Math.random() * startRange);
        const initialMiddleIndex = startRange + randomStartOffset;
        const initialScroll = Math.max(0, (initialMiddleIndex * itemFullWidth) - (rouletteRef.current.offsetWidth / 2) + (itemFullWidth /2) );
        rouletteRef.current.scrollTo({ left: initialScroll, behavior: 'auto' });
    }
  };

  const handleClaimPrize = async () => {
    if (!currentUser || !currentCaseOpeningId || !finalPrize) return;
    
    setIsProcessingPrizeAction(true);
    try {
      const response = await fetch('/api/prize/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, caseOpeningId: currentCaseOpeningId, prize: finalPrize }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to claim prize');
      }
      if (currentUser?.id) await fetchUserDetails(currentUser.id);
      toast({
        title: finalPrize.prize_type === 'balance_gh' ? "Баланс пополнен!" : "Приз добавлен в инвентарь!",
        description: data.message,
        variant: "default",
        action: finalPrize.prize_type !== 'balance_gh' ? (
            <Button variant="link" size="sm" asChild className="text-primary">
                 <Link href="/account/inventory">В инвентарь</Link> 
            </Button>
        ) : <CheckCircle className="text-primary" />,
      });
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessingPrizeAction(false);
      resetForNewSpin(); 
    }
  };

  const handleSellPrize = async () => {
    if (!currentUser || !currentCaseOpeningId || !finalPrize || typeof finalPrize.sell_value_gh !== 'number') return;
    setIsProcessingPrizeAction(true);
     try {
      const response = await fetch('/api/prize/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, caseOpeningId: currentCaseOpeningId, prize: finalPrize }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to sell prize');
      }
      if (data.updatedUser && currentUser && fetchUserDetails) {
        fetchUserDetails(currentUser.id); 
      }
      toast({
        title: "Приз продан!",
        description: data.message,
        variant: "default",
        action: <DollarSign className="text-primary" />,
      });
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
        setIsProcessingPrizeAction(false);
        resetForNewSpin();
    }
  };

  if (isLoadingCase) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height)-var(--footer-height))]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Загрузка кейса...</p>
      </div>
    );
  }

  if (errorLoadingCase || !caseData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <p className="text-lg text-destructive-foreground">{errorLoadingCase || "Кейс не найден."}</p>
        <Button asChild variant="outline" className="mt-6 border-primary text-primary hover:bg-primary/10">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />На главную</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-2 md:p-4 overflow-hidden">
      <Card className="w-full max-w-4xl bg-card border-border shadow-2xl rounded-xl overflow-hidden my-4">
         <CardHeader className="p-4 border-b border-border/50 flex flex-row items-center justify-between bg-card/80 backdrop-blur-sm">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Назад</span>
            </Button>
            <CardTitleOriginal className="text-xl md:text-2xl font-semibold text-primary text-center uppercase tracking-wider">
                {caseData.name}
            </CardTitleOriginal>
            <div className="w-9 h-9"> </div>
        </CardHeader>


        <CardContent className="p-3 md:p-6 space-y-3 md:space-y-4 flex flex-col items-center">
          <div className="relative w-40 h-40 md:w-48 md:h-48 mb-2">
            <Image 
              src={caseData.imageUrl || 'https://placehold.co/300x300.png?text=Case'}
              alt={caseData.name}
              layout="fill"
              objectFit="contain"
              className="rounded-md"
              data-ai-hint={caseData.data_ai_hint || "case image"}
              priority
            />
          </div>
          
          {caseData.timer_enabled && caseData.timer_ends_at && (
            <CaseTimerDisplay endsAt={caseData.timer_ends_at} onTimerEnd={() => setIsTimerExpired(true)} />
          )}

          {rouletteItems.length > 0 && (
             <div className="relative w-full max-w-full roulette-container p-2 rounded-lg overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-[calc(100%-1rem)] bg-primary rounded-full pointer-events-none z-10 roulette-marker shadow-[0_0_8px_2px_hsl(var(--primary)/0.7)]" />
                <div 
                    ref={rouletteRef} 
                    className="flex h-full overflow-x-auto no-scrollbar items-center"
                >
                    {rouletteItems.map((prize) => (
                    <div 
                        key={prize.uniqueKey}
                        className="roulette-item flex-shrink-0 flex flex-col items-center justify-between p-1.5 mx-1.5 transition-all duration-300 transform-gpu rounded-lg bg-card/70 backdrop-blur-sm"
                        style={{ width: `${ROULETTE_ITEM_WIDTH}px`, height: `${ROULETTE_ITEM_HEIGHT}px`}}
                    >
                        <div className="relative overflow-hidden prize-image-container rounded-full w-20 h-20 md:w-24 md:h-24 border-none"> 
                          <Image 
                              src={prize.imageUrl || 'https://placehold.co/120x120.png'} 
                              alt={prize.name} 
                              layout="fill"
                              objectFit="cover"
                              className="rounded-full border-none" 
                              data-ai-hint={prize.data_ai_hint || 'prize item icon'} 
                          />
                        </div>
                        <div className='text-center w-full mt-auto'>
                          <p className="text-[10px] md:text-xs text-center font-medium text-foreground truncate w-full px-1" title={prize.name}>{prize.name}</p>
                          <p className="text-[9px] md:text-[10px] text-center text-primary/80 font-semibold">
                            {prize.prize_type === 'product_duration' && prize.duration_days ? `${prize.duration_days} дн.` : prize.prize_type === 'balance_gh' && prize.balance_gh_amount ? `${prize.balance_gh_amount} GH` : ''}
                          </p>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
          )}

          <Dialog open={showResultDialog} onOpenChange={(open) => { if (!open) resetForNewSpin(); }}>
            <DialogContent className="sm:max-w-md bg-card border-border/30 shadow-xl">
              <DialogHeader className="text-center">
                <DialogTitle className="text-2xl font-bold text-primary mb-2">Поздравляем!</DialogTitle>
                <DialogDescription className="text-muted-foreground">Вы выиграли:</DialogDescription>
              </DialogHeader>
              {finalPrize && (
                <div className="flex flex-col items-center py-4 space-y-3">
                  <div className="relative overflow-hidden dialog-prize-image-container rounded-full w-32 h-32 md:w-40 md:h-40 border-none">
                    <Image 
                      src={finalPrize.imageUrl || 'https://placehold.co/150x150.png'} 
                      alt={finalPrize.name} 
                      layout="fill"
                      objectFit="cover"
                      className="rounded-full shadow-md border-none" 
                      data-ai-hint={finalPrize.data_ai_hint || 'prize item large image'} 
                    />
                  </div>
                  <p className="text-xl font-bold text-foreground bg-primary/10 px-4 py-1 rounded-md shadow-inner">{finalPrize.name}</p>
                  <p className="text-sm text-primary/90 font-semibold">
                    {finalPrize.prize_type === 'product_duration' && finalPrize.duration_days ? `${finalPrize.duration_days} дн.` : finalPrize.prize_type === 'balance_gh' && finalPrize.balance_gh_amount ? `${finalPrize.balance_gh_amount} GH` : ''}
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                 <Button onClick={handleClaimPrize} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 shadow-md" disabled={isProcessingPrizeAction}>
                   {isProcessingPrizeAction && finalPrize?.prize_type !== 'balance_gh' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShoppingCart className="mr-2 h-4 w-4"/>}
                   {finalPrize?.prize_type === 'balance_gh' ? 'ОК (Баланс зачислен)' : 'Забрать'}
                 </Button>
                {finalPrize?.prize_type !== 'balance_gh' && finalPrize?.sell_value_gh && finalPrize.sell_value_gh > 0 && (
                  <Button onClick={handleSellPrize} variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10 hover:text-primary/90 flex-1 shadow-sm" disabled={isProcessingPrizeAction}>
                    {isProcessingPrizeAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <DollarSign className="mr-2 h-4 w-4"/>}
                    Продать за {finalPrize.sell_value_gh} GH
                  </Button>
                )}
              </div>
               <Button onClick={resetForNewSpin} variant="ghost" size="sm" className="mt-3 text-primary hover:bg-primary/10 w-full" disabled={isProcessingPrizeAction}>
                  <RotateCw className="mr-2 h-4 w-4"/> Открыть еще
              </Button>
            </DialogContent>
          </Dialog>
          
           {!showResultDialog && (
            <div className="w-full max-w-md mx-auto space-y-3 md:space-y-4 px-2 mt-3 md:mt-4"> 
              {activeBoostOptions.length > 0 && (
                <>
                <h4 className="text-xs md:text-sm font-medium text-foreground/70 text-center uppercase tracking-wider mb-1">Улучшить Шанс:</h4>
                <div className="flex flex-row flex-wrap justify-center items-center gap-x-3 gap-y-1.5"> 
                    {activeBoostOptions.map((option) => (
                    <div key={option.id} className="flex items-center">
                        <Checkbox
                        id={`boost-${option.id}`} 
                        checked={selectedBoosts.some(b => b.id === option.id)}
                        onCheckedChange={(checked) => handleBoostChange(option, !!checked)}
                        className="mr-1.5 h-4 w-4 border-primary/70 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" 
                        disabled={isSpinning || isTimerExpired || isLoadingCase}
                        />
                        <Label htmlFor={`boost-${option.id}`} className="text-xs md:text-sm cursor-pointer flex items-baseline gap-1 text-foreground/80">
                        <span>{option.label}</span> 
                        <span className='text-icon-color/80 text-[10px] md:text-xs'>({option.cost > 0 ? `+${option.cost}GH` : 'Беспл.'})</span>
                        </Label>
                    </div>
                    ))}
                </div>
                </>
              )}
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2 md:pt-3">
                 <Button 
                    onClick={handleSpin} 
                    disabled={isSpinning || !rouletteItems.length || !currentUser || isTimerExpired || isLoadingCase || (currentUser && currentUser.balance < totalCost)}
                    size="lg" 
                    className="w-full sm:w-auto sm:flex-1 max-w-[250px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-md text-base h-11 md:h-12 py-2" 
                 >
                    {isSpinning ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Gift className="mr-2 h-5 w-5" />}
                    {isSpinning ? 'Открывается...' : `Открыть за ${totalCost.toFixed(0)} GH`}
                 </Button>
              </div>
            </div>
          )}

          {caseData.prizes && caseData.prizes.length > 0 && (
            <div className="w-full mt-4 md:mt-6 pt-3 md:pt-4 border-t border-border/30">
                <h4 className="text-base font-semibold text-muted-foreground text-center mb-2 md:mb-3">Возможные призы в этом кейсе:</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3 max-h-56 overflow-y-auto p-1.5 rounded-md bg-muted/30 shadow-inner">
                    {caseData.prizes.map((prize) => (
                        <div key={prize.id} className="flex flex-col items-center p-1.5 bg-card rounded-lg shadow-sm">
                             <div className="relative overflow-hidden prize-image-container rounded-full w-16 h-16 md:w-20 md:h-20 border-none">
                                <Image 
                                    src={prize.imageUrl || 'https://placehold.co/100x100.png'} 
                                    alt={prize.name} 
                                    layout="fill" 
                                    objectFit="cover" 
                                    className="rounded-full border-none"
                                    data-ai-hint={prize.data_ai_hint || 'small prize icon'}
                                />
                            </div>
                            <p className="text-xs text-center font-medium text-foreground/90 mt-1.5 truncate w-full" title={prize.name}>{prize.name}</p>
                            <p className="text-[10px] text-center text-primary/80">{prize.duration_days ? `${prize.duration_days} дн.` : prize.balance_gh_amount ? `${prize.balance_gh_amount} GH` : ''}</p>
                        </div>
                    ))}
                </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
