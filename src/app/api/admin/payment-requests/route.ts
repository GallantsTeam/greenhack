
// src/app/api/admin/payment-requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { PaymentRequest } from '@/types';

export async function GET(request: NextRequest) {
  // TODO: Add admin authentication
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');

  try {
    let sqlQuery = 'SELECT pr.id, pr.user_id, u.username, pr.amount_gh, pr.status, pr.payment_method_details, pr.created_at, pr.updated_at FROM payment_requests pr JOIN users u ON pr.user_id = u.id';
    const queryParams: any[] = [];

    if (statusFilter) {
      sqlQuery += ' WHERE pr.status = ?';
      queryParams.push(statusFilter);
    }
    sqlQuery += ' ORDER BY pr.created_at DESC';

    const results = await query(sqlQuery, queryParams);
    const requests: PaymentRequest[] = results.map((row: any) => ({
        ...row,
        amount_gh: parseFloat(row.amount_gh)
    }));
    return NextResponse.json(requests);
  } catch (error: any) {
    console.error('API Admin Payment Requests GET Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
