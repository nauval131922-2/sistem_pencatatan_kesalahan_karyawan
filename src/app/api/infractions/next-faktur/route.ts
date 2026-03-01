import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateQuery = searchParams.get('date');

    if (!dateQuery) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const dateObj = new Date(dateQuery);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yy = String(dateObj.getFullYear()).substring(2);
    const datePrefix = `${dd}${mm}${yy}`;

    const countRow = db.prepare(
      `SELECT COUNT(*) as cnt FROM infractions WHERE faktur LIKE ?`
    ).get(`ERR-${datePrefix}-%`) as { cnt: number };

    const seq = String((countRow?.cnt ?? 0) + 1).padStart(3, '0');
    const nextFaktur = `ERR-${datePrefix}-${seq}`;

    return NextResponse.json({ nextFaktur });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
