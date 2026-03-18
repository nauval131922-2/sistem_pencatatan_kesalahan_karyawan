import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import db from '@/lib/db';
import { apiError } from '@/lib/api-utils';

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await db.execute({
      sql: 'SELECT id, name, username, photo, role FROM users WHERE id = ?',
      args: [session.userId],
    });

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Failed to fetch user data:', error);
    return apiError('Failed to fetch user data', 500, { stack: error.stack });
  }
}
