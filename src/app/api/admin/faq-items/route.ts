
// src/app/api/admin/faq-items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { FaqItem } from '@/types';
import type { OkPacket, ResultSetHeader } from 'mysql2';

export async function GET(request: NextRequest) {
  // TODO: Admin auth check
  try {
    const results = await query('SELECT * FROM faq_items ORDER BY item_order ASC, id ASC');
    const faqItems: FaqItem[] = results.map((item: any) => ({
      ...item,
      is_active: Boolean(item.is_active),
    }));
    return NextResponse.json(faqItems);
  } catch (error: any) {
    console.error('API Admin FAQ GET Error:', error);
    return NextResponse.json({ message: `Failed to fetch FAQ items: ${error.message}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // TODO: Admin auth check
  try {
    const body = await request.json();
    const { question, answer, item_order = 0, is_active = true } = body as Omit<FaqItem, 'id' | 'created_at' | 'updated_at'>;

    if (!question || !answer) {
      return NextResponse.json({ message: 'Question and Answer are required' }, { status: 400 });
    }

    const result = await query(
      'INSERT INTO faq_items (question, answer, item_order, is_active) VALUES (?, ?, ?, ?)',
      [question, answer, item_order, is_active]
    ) as OkPacket;

    if (result.insertId) {
      const newFaqItem: FaqItem = {
        id: result.insertId,
        question,
        answer,
        item_order,
        is_active,
        created_at: new Date().toISOString(), // Approximate
      };
      return NextResponse.json({ message: 'FAQ item created successfully', faqItem: newFaqItem }, { status: 201 });
    } else {
      return NextResponse.json({ message: 'Failed to create FAQ item' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('API Admin FAQ POST Error:', error);
    return NextResponse.json({ message: `Failed to create FAQ item: ${error.message}` }, { status: 500 });
  }
}

    