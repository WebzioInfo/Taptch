import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ status: 'ready' }, { status: 200 });
  } catch {
    return NextResponse.json({ status: 'not_ready' }, { status: 503 });
  }
}

