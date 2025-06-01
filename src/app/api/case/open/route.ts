
// src/app/api/case/open/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { CaseItem, Prize, User, BoostOption, CaseBoostOptionConfig } from '@/types';
import { defaultBoostOptions } from '@/lib/case-data'; 
import { OkPacket, ResultSetHeader } from 'mysql2';


async function getCaseWithDetails(caseId: string): Promise<CaseItem | null> {
  const caseResults = await query('SELECT * FROM cases WHERE id = ?', [caseId]);
  if (caseResults.length === 0) return null;
  const caseData = caseResults[0] as CaseItem;

  const prizeResults = await query('SELECT * FROM case_prizes WHERE case_id = ?', [caseId]);
  caseData.prizes = prizeResults.map((p: any) => ({
    ...p,
    chance: parseFloat(p.chance), // Ensure chance is a number
    sell_value_gh: p.sell_value_gh ? parseFloat(p.sell_value_gh) : null,
    balance_gh_amount: p.balance_gh_amount ? parseFloat(p.balance_gh_amount) : null,
    duration_days: p.duration_days ? parseInt(p.duration_days, 10) : null,
    imageUrl: (p.image_url || `https://placehold.co/120x120.png?text=${encodeURIComponent(p.name)}`).trim(),
    dataAiHint: p.data_ai_hint || p.name.toLowerCase(),
  }));

  const boostConfigsResults = await query('SELECT * FROM case_boost_options WHERE case_id = ? AND is_active_for_case = TRUE', [caseId]);
    caseData.boost_options_config = boostConfigsResults.map((bc: any) => ({
        ...bc,
        is_active_for_case: Boolean(bc.is_active_for_case),
        override_cost_gh: bc.override_cost_gh ? parseFloat(bc.override_cost_gh) : null,
        override_chance_multiplier: bc.override_chance_multiplier ? parseFloat(bc.override_chance_multiplier) : null,
    }));

  return caseData;
}


export async function POST(request: NextRequest) {
  try {
    const { userId, caseId, selectedBoostIds } = await request.json();

    if (!userId || !caseId) {
      return NextResponse.json({ message: 'Missing userId or caseId' }, { status: 400 });
    }

    const usersFound = await query('SELECT id, balance FROM users WHERE id = ?', [userId]);
    if (usersFound.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    const user: User = usersFound[0];
    let currentBalance = 0;
    if (typeof user.balance === 'string') {
        currentBalance = parseFloat(user.balance);
    } else if (typeof user.balance === 'number') {
        currentBalance = user.balance;
    }
     if(isNaN(currentBalance)) currentBalance = 0;


    const caseData = await getCaseWithDetails(caseId);
    if (!caseData) {
      return NextResponse.json({ message: 'Case not found' }, { status: 404 });
    }
    if (!caseData.is_active) {
        return NextResponse.json({ message: 'Этот кейс временно неактивен.' }, { status: 403 });
    }
    if (caseData.timer_enabled && caseData.timer_ends_at) {
      if (new Date(caseData.timer_ends_at) <= new Date()) {
        return NextResponse.json({ message: 'Время для открытия этого кейса истекло.' }, { status: 403 });
      }
    }

    if (!caseData.prizes || caseData.prizes.length === 0) {
      return NextResponse.json({ message: 'В этом кейсе нет призов.' }, { status: 500 });
    }

    let totalCost = caseData.base_price_gh;
    let finalChanceMultiplier = 1;

    if (selectedBoostIds && Array.isArray(selectedBoostIds) && selectedBoostIds.length > 0) {
      selectedBoostIds.forEach(boostId => {
        const caseSpecificBoostConfig = caseData.boost_options_config?.find(cfg => cfg.boost_ref_id === boostId && cfg.is_active_for_case);
        const defaultBoost = defaultBoostOptions.find(b => b.id === boostId);

        if (caseSpecificBoostConfig) { // Use case-specific override if available and active
          totalCost += caseSpecificBoostConfig.override_cost_gh ?? defaultBoost?.cost ?? 0;
          finalChanceMultiplier *= caseSpecificBoostConfig.override_chance_multiplier ?? defaultBoost?.chanceMultiplier ?? 1;
        } else if (defaultBoost && defaultBoost.id !== 'no-boost' && (!caseData.boost_options_config || !caseData.boost_options_config.some(cfg => cfg.boost_ref_id === boostId))) {
          // Use default if not configured for this case at all (and not "no-boost")
          totalCost += defaultBoost.cost;
          finalChanceMultiplier *= defaultBoost.chanceMultiplier;
        }
      });
    }
    
    if (currentBalance < totalCost) {
      return NextResponse.json({ message: `Недостаточно средств. Требуется ${totalCost.toFixed(2)} GH.`, currentBalance: currentBalance.toFixed(2) }, { status: 402 });
    }

    const newBalance = currentBalance - totalCost;
    await query('UPDATE users SET balance = ? WHERE id = ?', [newBalance.toFixed(2), userId]);
    
    const balanceTransactionResult = await query(
      'INSERT INTO balance_transactions (user_id, transaction_type, amount_gh, description) VALUES (?, ?, ?, ?)',
      [userId, 'open_case', -totalCost, `Открытие кейса: ${caseData.name}`]
    ) as OkPacket | ResultSetHeader | any[];
    const balanceTransactionId = Array.isArray(balanceTransactionResult) ? balanceTransactionResult[0].insertId : balanceTransactionResult.insertId;


    // Determine winning prize
    let randomNumber = Math.random();
    let winningPrize: Prize | null = null;
    let cumulativeChance = 0;

    // Adjust prizes based on multiplier
    const prizesWithAdjustedChance = caseData.prizes.map(prize => ({
        ...prize,
        // Ensure prize.chance is a number before multiplication, default to 0 if not.
        effectiveChance: Math.min(1, (typeof prize.chance === 'number' ? prize.chance : 0) * finalChanceMultiplier) 
    }));
    
    // Normalize if total chance > 1, or distribute equally if all are 0
    let totalAdjustedChance = prizesWithAdjustedChance.reduce((sum, p) => sum + p.effectiveChance, 0);
    
    if (totalAdjustedChance > 1 && totalAdjustedChance > 0) {
        prizesWithAdjustedChance.forEach(p => p.effectiveChance = p.effectiveChance / totalAdjustedChance);
        totalAdjustedChance = 1; // Recalculate after normalization for safety, should be close to 1
    } else if (totalAdjustedChance === 0 && prizesWithAdjustedChance.length > 0) {
      // If all effective chances are 0 (e.g. base chances were 0 or multiplier was 0), give equal chance to all
      prizesWithAdjustedChance.forEach(p => p.effectiveChance = 1 / prizesWithAdjustedChance.length);
      totalAdjustedChance = 1;
    }

    // Select winning prize based on adjusted and normalized chances
    for (const prize of prizesWithAdjustedChance) {
      cumulativeChance += prize.effectiveChance; // prize.effectiveChance is now normalized (0-1 range)
      if (randomNumber <= cumulativeChance && totalAdjustedChance > 0) { // Also ensure there was some chance to win
        winningPrize = prize;
        break;
      }
    }
    
    if (!winningPrize && prizesWithAdjustedChance.length > 0) { // Fallback if no prize selected (e.g. due to rounding or totalAdjustedChance being 0)
      console.warn(`No prize selected by chance logic for case ${caseId}, totalAdjustedChance: ${totalAdjustedChance}. Picking random prize.`);
      winningPrize = prizesWithAdjustedChance[Math.floor(Math.random() * prizesWithAdjustedChance.length)];
    } else if (!winningPrize) {
        console.error(`Critical: No prizes available or no prize could be determined for case ${caseId}.`);
        return NextResponse.json({ message: 'Ошибка определения приза. Пожалуйста, свяжитесь с поддержкой.' }, { status: 500 });
    }

    const caseOpeningResult = await query(
      'INSERT INTO case_openings_history (user_id, case_id, won_prize_id, action_taken, balance_transaction_id) VALUES (?, ?, ?, ?, ?)',
      [userId, caseId, winningPrize.id, 'pending', balanceTransactionId]
    ) as OkPacket | ResultSetHeader | any[];
    const caseOpeningId = Array.isArray(caseOpeningResult) ? caseOpeningResult[0].insertId : caseOpeningResult.insertId;


    const updatedUserResponse = await query('SELECT id, username, email, role, balance, referral_code, referred_by_user_id FROM users WHERE id = ?', [userId]);
    const updatedUser = updatedUserResponse[0];
    if(updatedUser) {
        updatedUser.balance = parseFloat(updatedUser.balance);
    }

    return NextResponse.json({ 
      message: 'Кейс успешно открыт!', 
      winningPrize, // This is the definitive prize
      caseOpeningId,
      updatedUser 
    }, { status: 200 });

  } catch (error: any) {
    console.error('API Case Open Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
    
