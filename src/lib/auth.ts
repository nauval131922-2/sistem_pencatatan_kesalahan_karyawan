'use server';

import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSession, destroySession, getSession } from '@/lib/session';

export async function login(username: string, password: string):Promise<{success: boolean, message?: string}> {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE username = ?',
      args: [username]
    });

    const user = result.rows[0];

    if (!user) {
      return { success: false, message: 'Username tidak ditemukan.' };
    }

    const isMatch = await bcrypt.compare(password, user.password as string);

    if (!isMatch) {
      return { success: false, message: 'Password salah.' };
    }

    // Create session
    await createSession({
      userId: Number(user.id),
      username: user.username as string,
      name: user.name as string,
      role: user.role as string,
    });

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Terjadi kesalahan saat login.' };
  }
}

export async function logout() {
  await destroySession();
}

export async function updateProfile(data: { name: string, username: string, password?: string, photo?: string | null }) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return { success: false, message: 'Tidak dapat mengotentikasi sesi Anda.' };
    }

    const userId = session.userId;

    // Check if new username is already taken by someone else
    const checkUser = await db.execute({
      sql: 'SELECT id FROM users WHERE username = ? AND id != ?',
      args: [data.username, userId]
    });

    if (checkUser.rows.length > 0) {
      return { success: false, message: 'Username sudah digunakan oleh akun lain.' };
    }

    let queryObj = { sql: '', args: [] as any[] };

    if (data.password) {
      // Update with password
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(data.password, salt);
      queryObj.sql = 'UPDATE users SET name = ?, username = ?, password = ?, photo = ? WHERE id = ?';
      queryObj.args = [data.name, data.username, hash, data.photo || null, userId];
    } else {
      // Update without password
      queryObj.sql = 'UPDATE users SET name = ?, username = ?, photo = ? WHERE id = ?';
      queryObj.args = [data.name, data.username, data.photo || null, userId];
    }

    await db.execute(queryObj);

    // Update the session token with new data so the header updates immediately
    // DO NOT include photo here to prevent HTTP cookie size limit exceeded error (4KB)
    await createSession({
      userId: session.userId,
      username: data.username,
      name: data.name,
      role: session.role,
    });

    return { success: true };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, message: 'Terjadi kesalahan sistem saat memperbarui profil.' };
  }
}
