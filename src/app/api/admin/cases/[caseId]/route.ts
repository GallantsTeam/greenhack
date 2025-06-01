
// src/app/api/admin/cases/[caseId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { CaseItem, Prize, CaseBoostOptionConfig } from '@/types';
import type { OkPacket, ResultSetHeader } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic'; // Ensure fresh data

// GET single case (for edit page and open case page)
export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  const caseId = params.caseId;
  if (!caseId) {
    return NextResponse.json({ message: 'Case ID is required' }, { status: 400 });
  }
  try {
    const caseResults = await query('SELECT * FROM cases WHERE id = ?', [caseId]);
    if (!Array.isArray(caseResults) || caseResults.length === 0) {
      return NextResponse.json({ message: 'Case not found' }, { status: 404 });
    }
    const caseRow = caseResults[0];

    const prizeResults = await query(
        `SELECT p.*, prod.name as product_name_for_prize 
         FROM case_prizes p 
         LEFT JOIN products prod ON p.related_product_id = prod.id
         WHERE p.case_id = ? ORDER BY p.id ASC`,
        [caseId]
    );
    const prizes: Prize[] = prizeResults.map((pRow: any) => ({
      id: pRow.id,
      case_id: pRow.case_id,
      name: pRow.name || pRow.product_name_for_prize || 'Неизвестный приз',
      prize_type: pRow.prize_type,
      related_product_id: pRow.related_product_id,
      duration_days: pRow.duration_days ? parseInt(pRow.duration_days, 10) : null,
      days: pRow.duration_days ? parseInt(pRow.duration_days, 10) : null,
      balance_gh_amount: pRow.balance_gh_amount ? parseFloat(pRow.balance_gh_amount) : null,
      image_url: pRow.image_url ? String(pRow.image_url).trim() : null,
      imageUrl: (pRow.image_url || `https://placehold.co/120x120.png?text=${encodeURIComponent(pRow.name || 'Prize')}`).trim(),
      chance: parseFloat(pRow.chance),
      sell_value_gh: pRow.sell_value_gh ? parseFloat(pRow.sell_value_gh) : null,
      data_ai_hint: pRow.data_ai_hint || (pRow.name || 'prize').toLowerCase(),
      product_name: pRow.product_name_for_prize,
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
      image_url: caseRow.image_url ? String(caseRow.image_url).trim() : null,
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


export async function PUT(
  request: NextRequest,
  { params: routeParams }: { params: { caseId: string } }
) {
  const caseIdFromUrl = routeParams.caseId;

  if (!caseIdFromUrl) {
    return NextResponse.json({ message: 'Case ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const {
      id: newCaseId, // The new ID (slug) for the case, could be the same as caseIdFromUrl
      name,
      image_url,
      base_price_gh,
      description,
      data_ai_hint,
      is_active,
      is_hot_offer,
      timer_enabled,
      timer_ends_at,
      prizes,
      boost_options_config
    } = body;

    if (!newCaseId || !name || typeof base_price_gh !== 'number') {
      return NextResponse.json({ message: 'ID, Название и Базовая цена обязательны.' }, { status: 400 });
    }

    const existingCaseResult = await query('SELECT id FROM cases WHERE id = ?', [caseIdFromUrl]);
    if (!Array.isArray(existingCaseResult) || existingCaseResult.length === 0) {
      return NextResponse.json({ message: `Кейс с ID '${caseIdFromUrl}' не найден.` }, { status: 404 });
    }

    if (newCaseId !== caseIdFromUrl) {
      const conflictingCaseResult = await query('SELECT id FROM cases WHERE id = ? AND id != ?', [newCaseId, caseIdFromUrl]);
      if (Array.isArray(conflictingCaseResult) && conflictingCaseResult.length > 0) {
        return NextResponse.json({ message: `Кейс с новым ID '${newCaseId}' уже существует.` }, { status: 409 });
      }
    }
    
    let dbTimerEndsAt: string | null = null;
    if (timer_enabled && timer_ends_at) {
        try {
            dbTimerEndsAt = new Date(timer_ends_at).toISOString().slice(0, 19).replace('T', ' ');
        } catch (e) {
            console.warn("Invalid date format for timer_ends_at on update:", timer_ends_at);
        }
    } else if (!timer_enabled) {
        dbTimerEndsAt = null; 
    }

    const updateCaseQuery = `
      UPDATE cases SET
        id = ?, name = ?, image_url = ?, base_price_gh = ?, description = ?, data_ai_hint = ?, 
        is_active = ?, is_hot_offer = ?, timer_enabled = ?, timer_ends_at = ?
      WHERE id = ?
    `;
    const caseQueryParams = [
      newCaseId, name, image_url || null, base_price_gh, description || null, data_ai_hint || null,
      is_active === undefined ? true : Boolean(is_active),
      is_hot_offer === undefined ? false : Boolean(is_hot_offer),
      timer_enabled === undefined ? false : Boolean(timer_enabled),
      dbTimerEndsAt,
      caseIdFromUrl,
    ];
    await query(updateCaseQuery, caseQueryParams);
    
    const currentCaseIdForRelations = newCaseId;

    // Prize update logic
    const existingDbPrizeIdsResult = await query('SELECT id FROM case_prizes WHERE case_id = ?', [currentCaseIdForRelations]);
    const existingDbPrizeIds: string[] = Array.isArray(existingDbPrizeIdsResult) ? existingDbPrizeIdsResult.map((p: any) => p.id) : [];
    const formPrizeIds: string[] = prizes ? prizes.map((p: Prize) => p.id).filter((id?: string): id is string => !!id && !id.startsWith('new-')) : [];

    if (prizes && Array.isArray(prizes)) {
      for (const prize of prizes) {
        const prizeData = [
          prize.name || null,
          prize.prize_type,
          prize.prize_type === 'product_duration' ? (prize.related_product_id || null) : null,
          prize.prize_type === 'product_duration' ? (prize.duration_days || null) : null,
          prize.prize_type === 'balance_gh' ? (prize.balance_gh_amount || null) : null,
          prize.image_url || null,
          Number(prize.chance), 
          prize.sell_value_gh || null,
          prize.data_ai_hint || null,
        ];

        if (prize.id && !String(prize.id).startsWith('new-')) {
          await query(
            `UPDATE case_prizes SET name=?, prize_type=?, related_product_id=?, duration_days=?, 
             balance_gh_amount=?, image_url=?, chance=?, sell_value_gh=?, data_ai_hint=?
             WHERE id=? AND case_id=?`,
            [...prizeData, prize.id, currentCaseIdForRelations]
          );
        } else { 
          const newPrizeId = uuidv4();
          await query(
            `INSERT INTO case_prizes (id, case_id, name, prize_type, related_product_id, duration_days, 
             balance_gh_amount, image_url, chance, sell_value_gh, data_ai_hint)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [newPrizeId, currentCaseIdForRelations, ...prizeData]
          );
        }
      }
    }
    
    const prizesInFormWithDbId = prizes.filter(p => p.id && !String(p.id).startsWith('new-')).map(p => p.id);
    const prizesToDelete = existingDbPrizeIds.filter(dbId => !prizesInFormWithDbId.includes(dbId));

    for (const prizeIdToDelete of prizesToDelete) {
      const historyCheckResults = await query('SELECT COUNT(*) as count FROM case_openings_history WHERE won_prize_id = ?', [prizeIdToDelete]);
      const historyCount = (Array.isArray(historyCheckResults) && historyCheckResults.length > 0) ? historyCheckResults[0].count : 0;
      if (historyCount === 0) {
        await query('DELETE FROM case_prizes WHERE id = ? AND case_id = ?', [prizeIdToDelete, currentCaseIdForRelations]);
      } else {
        console.warn(`Prize ID ${prizeIdToDelete} for case ${currentCaseIdForRelations} was not deleted because it's referenced in history.`);
      }
    }
    
    // Boost Options Config update logic
    await query('DELETE FROM case_boost_options WHERE case_id = ?', [caseIdFromUrl]);
     if (newCaseId !== caseIdFromUrl) {
        await query('DELETE FROM case_boost_options WHERE case_id = ?', [newCaseId]);
    }

    if (boost_options_config && Array.isArray(boost_options_config)) {
      for (const config of boost_options_config) {
        await query(
          `INSERT INTO case_boost_options (case_id, boost_ref_id, label, is_active_for_case, override_cost_gh, override_chance_multiplier, override_description)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            currentCaseIdForRelations,
            config.boost_ref_id,
            config.label || null,
            config.is_active_for_case === undefined ? true : Boolean(config.is_active_for_case),
            config.override_cost_gh === undefined || config.override_cost_gh === '' ? null : Number(config.override_cost_gh),
            config.override_chance_multiplier === undefined || config.override_chance_multiplier === '' ? null : Number(config.override_chance_multiplier),
            config.override_description || null
          ]
        );
      }
    }

    const updatedCaseDataResult = await query('SELECT * FROM cases WHERE id = ?', [newCaseId]);
    const updatedPrizesResult = await query('SELECT * FROM case_prizes WHERE case_id = ? ORDER BY id ASC', [newCaseId]);
    const updatedBoostConfigsResult = await query('SELECT * FROM case_boost_options WHERE case_id = ?', [newCaseId]);
    
    const updatedCaseItem: CaseItem = {
      ...updatedCaseDataResult[0],
      is_active: Boolean(updatedCaseDataResult[0].is_active),
      is_hot_offer: Boolean(updatedCaseDataResult[0].is_hot_offer),
      timer_enabled: Boolean(updatedCaseDataResult[0].timer_enabled),
      timer_ends_at: updatedCaseDataResult[0].timer_ends_at ? new Date(updatedCaseDataResult[0].timer_ends_at).toISOString() : null,
      prize_count: Array.isArray(updatedPrizesResult) ? updatedPrizesResult.length : 0,
      prizes: Array.isArray(updatedPrizesResult) ? updatedPrizesResult.map((p: any) => ({
        ...p,
        chance: parseFloat(p.chance),
        sell_value_gh: p.sell_value_gh ? parseFloat(p.sell_value_gh) : null,
        balance_gh_amount: p.balance_gh_amount ? parseFloat(p.balance_gh_amount) : null,
        duration_days: p.duration_days ? parseInt(p.duration_days) : null,
      })) : [],
       boost_options_config: Array.isArray(updatedBoostConfigsResult) ? updatedBoostConfigsResult.map((b: any) => ({
        ...b,
        is_active_for_case: Boolean(b.is_active_for_case),
        override_cost_gh: b.override_cost_gh ? parseFloat(b.override_cost_gh) : null,
        override_chance_multiplier: b.override_chance_multiplier ? parseFloat(b.override_chance_multiplier) : null,
      })) : []
    };

    return NextResponse.json({ message: 'Кейс, его призы и настройки бустов успешно обновлены', caseItem: updatedCaseItem }, { status: 200 });

  } catch (error: any) {
    console.error(`API Admin Case PUT (ID: ${caseIdFromUrl}) Error:`, error);
    return NextResponse.json({ message: `Внутренняя ошибка сервера: ${error.message}` }, { status: 500 });
  }
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  const caseId = params.caseId;
  if (!caseId) {
    return NextResponse.json({ message: 'Case ID is required' }, { status: 400 });
  }

  try {
    const historyCheck = await query(
        `SELECT COUNT(*) as count 
         FROM case_openings_history coh
         JOIN case_prizes cp ON coh.won_prize_id = cp.id
         WHERE cp.case_id = ?`, 
        [caseId]
    );

    if (historyCheck[0].count > 0) {
      return NextResponse.json({ 
        message: `Не удалось удалить кейс '${caseId}': существуют записи в истории открытий, связанные с призами этого кейса. Сначала удалите или отвяжите эти записи.` 
      }, { status: 409 });
    }
    
    await query('DELETE FROM case_prizes WHERE case_id = ?', [caseId]);
    await query('DELETE FROM case_boost_options WHERE case_id = ?', [caseId]);

    const result = await query('DELETE FROM cases WHERE id = ?', [caseId]) as OkPacket | ResultSetHeader | any[];
    
    let affectedRows = 0;
    if (Array.isArray(result) && result.length > 0 && 'affectedRows' in result[0]) {
        affectedRows = result[0].affectedRows;
    } else if (result && 'affectedRows' in result) {
        affectedRows = (result as OkPacket).affectedRows;
    }

    if (affectedRows > 0) {
      return NextResponse.json({ message: `Кейс '${caseId}' и связанные с ним призы/настройки бустов успешно удалены.` }, { status: 200 });
    } else {
      return NextResponse.json({ message: `Кейс '${caseId}' не найден.` }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`API Admin Case DELETE (ID: ${caseId}) Error:`, error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.message.includes('foreign key constraint fails')) {
        return NextResponse.json({ message: `Не удалось удалить кейс: На него ссылаются другие записи. Ошибка: ${error.message}` }, { status: 409 });
    }
    return NextResponse.json({ message: `Внутренняя ошибка сервера: ${error.message}` }, { status: 500 });
  }
}
    
