
// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { AdminStats } from '@/types';

export async function GET(request: NextRequest) {
  // TODO: Add proper admin authentication and authorization
  console.log("[API /admin/stats] Received GET request");
  try {
    const usersResultPromise = query('SELECT COUNT(*) as totalUsers FROM users');
    const productsResultPromise = query('SELECT COUNT(*) as totalProducts FROM products');
    
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 19).replace('T', ' ');
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString().slice(0, 19).replace('T', ' '); // End of current month

    console.log(`[API /admin/stats] Fetching sales from ${firstDayOfMonth} to ${lastDayOfMonth}`);
    const monthlySalesResultPromise = query(
      `SELECT SUM(amount_paid_gh) as monthlySalesGh 
       FROM purchases 
       WHERE status = 'completed' 
       AND purchase_date >= ? 
       AND purchase_date <= ?`, // Changed to <= for end of month
      [firstDayOfMonth, lastDayOfMonth]
    );

    // For open tickets, we'll return 0 as it's not implemented
    // const openTicketsResultPromise = query('SELECT COUNT(*) as openTickets FROM support_tickets WHERE status = "open"');

    const [usersResult, productsResult, monthlySalesResult] = await Promise.all([
      usersResultPromise,
      productsResultPromise,
      monthlySalesResultPromise,
      // openTicketsResultPromise
    ]);

    const totalUsers = usersResult[0]?.totalUsers || 0;
    const totalProducts = productsResult[0]?.totalProducts || 0;
    const monthlySalesGh = parseFloat(monthlySalesResult[0]?.monthlySalesGh) || 0;
    const openTickets = 0; // Placeholder

    const stats: AdminStats = {
      totalUsers,
      totalProducts,
      monthlySalesGh,
      openTickets,
    };
    console.log("[API /admin/stats] Successfully fetched stats:", stats);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('API Admin Stats GET Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
