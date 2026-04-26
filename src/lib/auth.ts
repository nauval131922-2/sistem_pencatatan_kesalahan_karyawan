'use server';

import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSession, destroySession, getSession } from '@/lib/session';
import { getFirstAccessibleRoute } from '@/lib/permissions';

export async function login(username: string, password: string): Promise<{ success: boolean; message?: string; firstRoute?: string }> {
  console.log(`[AUTH] Login attempt for user: ${username}`);
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE LOWER(username) = LOWER(?)',
      args: [username]
    });

    const user = result.rows[0];

    if (!user) {
      console.log(`[AUTH] User not found: ${username}`);
      return { success: false, message: 'Username tidak ditemukan.' };
    }

    console.log(`[AUTH] User found, comparing password...`);
    const isMatch = await bcrypt.compare(password, user.password as string);

    if (!isMatch) {
      console.log(`[AUTH] Password mismatch for user: ${username}`);
      return { success: false, message: 'Password salah.' };
    }

    // Role existence validation
    if (user.role !== 'Super Admin') {
      const roleCheck = await db.execute({
        sql: 'SELECT 1 FROM app_roles WHERE role_name = ?',
        args: [user.role]
      });
      if (roleCheck.rows.length === 0) {
        console.log(`[AUTH] Orphaned role: ${user.role} for user: ${username}`);
        return { success: false, message: 'Akses masuk ditolak: Role Anda telah dihapus atau tidak dikenali. Hubungi Super Admin untuk penugasan ulang peran.' };
      }
    }

    console.log(`[AUTH] Password match, creating session...`);
    // Create session
    await createSession({
      userId: Number(user.id),
      username: user.username as string,
      name: user.name as string,
      role: user.role as string,
    });

    // Determine the first accessible route so the client redirects to an authorized page
    const firstRoute = await getFirstAccessibleRoute(user.role as string);

    console.log(`[AUTH] Login success for user: ${username}, redirecting to: ${firstRoute}`);
    return { success: true, firstRoute };
  } catch (error) {
    console.error('[AUTH] Login error:', error);
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
      sql: 'SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?',
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

    await db.execute(queryObj, 'Pengaturan Profil');

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
