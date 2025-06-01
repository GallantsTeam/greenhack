
// src/app/api/cases/[caseId]/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql'; // Using direct query for this specific structure
import type { CaseItem, Prize, CaseBoostOptionConfig } from '@/types';

export const dynamic = 'force-dynamic'; // Ensure fresh data

export async function GET(
  request: Request,
  { params }: { params: { caseId: string } }
) {
  const caseId = params.caseId;

  if (!caseId) {
    return NextResponse.json({ message: 'Case ID is required' }, { status: 400 });
  }

  try {
    const caseResults = await query('SELECT * FROM cases WHERE id = ? AND is_active = TRUE', [caseId]);
    if (!Array.isArray(caseResults) || caseResults.length === 0) {
      return NextResponse.json({ message: 'Case not found or not active' }, { status: 404 });
    }
    const caseRow = caseResults[0];

    const prizeResults = await query(
        `SELECT p.*, prod.name as product_name_for_prize 
         FROM case_prizes p 
         LEFT JOIN products prod ON p.related_product_id = prod.id
         WHERE p.case_id = ?`, 
        [caseId]
    );
    const prizes: Prize[] = prizeResults.map((pRow: any) => ({
      id: pRow.id,
      case_id: pRow.case_id,
      name: pRow.name || pRow.product_name_for_prize || 'Неизвестный приз',
      prize_type: pRow.prize_type,
      related_product_id: pRow.related_product_id,
      duration_days: pRow.duration_days ? parseInt(pRow.duration_days, 10) : null,
      days: pRow.duration_days ? parseInt(pRow.duration_days, 10) : null, // Alias for compatibility if needed
      balance_gh_amount: pRow.balance_gh_amount ? parseFloat(pRow.balance_gh_amount) : null,
      image_url: pRow.image_url ? pRow.image_url.trim() : null,
      imageUrl: (pRow.image_url || `https://placehold.co/120x120.png?text=${encodeURIComponent(pRow.name || 'Prize')}`).trim(),
      chance: parseFloat(pRow.chance), // Stored as 0.0-1.0
      sell_value_gh: pRow.sell_value_gh ? parseFloat(pRow.sell_value_gh) : null,
      data_ai_hint: pRow.data_ai_hint || (pRow.name || 'prize').toLowerCase(),
      product_name: pRow.product_name_for_prize, // Name from joined products table
    }));

    const boostConfigResults = await query('SELECT * FROM case_boost_options WHERE case_id = ?', [caseId]);
    const boost_options_config: CaseBoostOptionConfig[] = boostConfigResults.map((bRow: any) => ({
        id: bRow.id,
        case_id: bRow.case_id,
        boost_ref_id: bRow.boost_ref_id,
        label: bRow.label,
        is_active_for_case: Boolean(bRow.is_active_for_case),
        override_cost_gh: bRow.override_cost_gh ? parseFloat(bRow.override_cost_gh) : null,
        override_chance_multiplier: bRow.override_chance_multiplier ? parseFloat(bRow.override_chance_multiplier) : null,
        override_description: bRow.override_description,
    }));


    const caseItem: CaseItem = {
      id: caseRow.id,
      name: caseRow.name,
      image_url: caseRow.image_url ? caseRow.image_url.trim() : null,
      imageUrl: (caseRow.image_url || `https://placehold.co/300x300.png?text=${encodeURIComponent(caseRow.name)}`).trim(),
      prizes: prizes,
      base_price_gh: parseFloat(caseRow.base_price_gh),
      description: caseRow.description,
      data_ai_hint: caseRow.data_ai_hint || caseRow.name.toLowerCase(),
      is_active: Boolean(caseRow.is_active),
      is_hot_offer: Boolean(caseRow.is_hot_offer),
      timer_enabled: Boolean(caseRow.timer_enabled),
      timer_ends_at: caseRow.timer_ends_at ? new Date(caseRow.timer_ends_at).toISOString() : null,
      boost_options_config: boost_options_config.length > 0 ? boost_options_config : null,
      created_at: caseRow.created_at,
    };

    return NextResponse.json(caseItem);
  } catch (error: any) {
    console.error(`API Error fetching case ${caseId}:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

    
