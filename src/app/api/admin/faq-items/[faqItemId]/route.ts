
// src/app/api/admin/faq-items/[faqItemId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { FaqItem } from '@/types';
import type { OkPacket, ResultSetHeader } from 'mysql2';

export async function PUT(
  request: NextRequest,
  { params }: { params: { faqItemId: string } }
) {
  // TODO: Admin auth check
  const id = parseInt(params.faqItemId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid FAQ Item ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { question, answer, item_order, is_active } = body as Partial<Omit<FaqItem, 'id' | 'created_at' | 'updated_at'>>;

    // Check if at least one field is provided for update
    if (question === undefined && answer === undefined && item_order === undefined && is_active === undefined) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    const existingItemQuery = await query('SELECT * FROM faq_items WHERE id = ?', [id]);
    if (!Array.isArray(existingItemQuery) || existingItemQuery.length === 0) {
        return NextResponse.json({ message: 'FAQ Item not found' }, { status: 404 });
    }

    const updateFields: string[] = [];
    const queryParams: any[] = [];

    if (question !== undefined) { updateFields.push('question = ?'); queryParams.push(question); }
    if (answer !== undefined) { updateFields.push('answer = ?'); queryParams.push(answer); }
    if (item_order !== undefined) { updateFields.push('item_order = ?'); queryParams.push(Number(item_order)); }
    if (is_active !== undefined) { updateFields.push('is_active = ?'); queryParams.push(Boolean(is_active)); }

    if (updateFields.length === 0) {
        // This case should be caught by the initial check, but as a safeguard:
        const currentItem = await query('SELECT * FROM faq_items WHERE id = ?', [id]);
        return NextResponse.json({ message: 'No valid fields provided for update.', faqItem: currentItem[0] });
    }
    
    queryParams.push(id);
    const sqlQuery = `UPDATE faq_items SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    
    const result = await query(sqlQuery, queryParams) as OkPacket;

    if (result.affectedRows > 0) {
      const updatedItem = await query('SELECT * FROM faq_items WHERE id = ?', [id]);
      return NextResponse.json({ message: 'FAQ item updated successfully', faqItem: updatedItem[0] });
    } else {
      // This might happen if the provided data is identical to existing data,
      // or if the ID doesn't exist (though checked above).
      const currentItem = await query('SELECT * FROM faq_items WHERE id = ?', [id]);
      if (currentItem.length === 0) {
        return NextResponse.json({ message: 'FAQ item not found' }, { status: 404 });
      }
      return NextResponse.json({ message: 'No changes made to the FAQ item.', faqItem: currentItem[0] });
    }
  } catch (error: any) {
    console.error('API Admin FAQ PUT Error:', error);
    return NextResponse.json({ message: `Failed to update FAQ item: ${error.message}` }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { faqItemId: string } }
) {
  // TODO: Admin auth check
  const id = parseInt(params.faqItemId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid FAQ Item ID' }, { status: 400 });
  }

  try {
    const result = await query('DELETE FROM faq_items WHERE id = ?', [id]) as OkPacket;
    if (result.affectedRows > 0) {
      return NextResponse.json({ message: 'FAQ item deleted successfully' });
    } else {
      return NextResponse.json({ message: 'FAQ item not found' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('API Admin FAQ DELETE Error:', error);
    return NextResponse.json({ message: `Failed to delete FAQ item: ${error.message}` }, { status: 500 });
  }
}

    