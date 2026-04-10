import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import db from '@/lib/db';

const secretKey = process.env.SESSION_SECRET || 'sintaksecretkey_change_in_production';
const key = new TextEncoder().encode(secretKey);

interface SessionPayload {
  userId: number;
  username: string;
  name: string;
  role: string;
  [key: string]: any;
}

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // Set session expiration
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt(payload);

  const cookieStore = await cookies();
  cookieStore.set('sintak_session', session, {
    expires,
    httpOnly: true,
    secure: false, // Set to false to allow local production testing without HTTPS
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('sintak_session')?.value;
  if (!session) return null;
  
  const payload = await decrypt(session);
  if (!payload) return null;

  // Refresh role from database dynamically to prevent stale tokens 
  // when a Super Admin renames or changes a role's permissions.
  try {
    const { rows } = await db.execute({
      sql: 'SELECT role FROM users WHERE id = ?',
      args: [payload.userId]
    });
    if (rows.length > 0 && rows[0].role) {
      payload.role = rows[0].role as string;
    }
  } catch (err) {}

  return payload;
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.set('sintak_session', '', {
    expires: new Date(0),
    path: '/',
  });
}

