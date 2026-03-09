'use server';

import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';

// Helper to check Super Admin authorization
async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new Error('Unauthorized');
  }
  if (session.role !== 'Super Admin') {
    throw new Error('Forbidden: Membutuhkan akses Super Admin');
  }
  return session;
}

export async function getUsers() {
  try {
    await requireSuperAdmin();
    
    const result = await db.execute('SELECT id, username, name, role, created_at FROM users ORDER BY name ASC');
    
    // Libsql rows have a null prototype or other properties that Next.js serialization dislikes.
    // Converting to plain objects via mapping or JSON parse/stringify fixes this.
    const users = result.rows.map(row => ({
      id: Number(row.id),
      username: String(row.username),
      name: String(row.name),
      role: String(row.role),
      created_at: row.created_at ? String(row.created_at) : null
    }));

    return { success: true, users };
  } catch (error: any) {
    return { success: false, message: error.message || 'Terjadi kesalahan sistem' };
  }
}

export async function createUser(data: { name: string, username: string, role: string, password?: string }) {
  try {
    const session = await requireSuperAdmin();

    if (!data.name || !data.username || !data.password || !data.role) {
      return { success: false, message: 'Data tidak lengkap.' };
    }

    // Check duplicate username
    const checkUsr = await db.execute({ sql: 'SELECT id FROM users WHERE username = ?', args: [data.username] });
    if (checkUsr.rows.length > 0) {
      return { success: false, message: 'Username sudah terdaftar.' };
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(data.password, salt);

    const result = await db.execute({
      sql: 'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)',
      args: [data.name, data.username, hash, data.role]
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Terjadi kesalahan sistem' };
  }
}

export async function updateUser(id: number, data: { name: string, username: string, role: string, password?: string }) {
  try {
    const session = await requireSuperAdmin();

    if (!data.name || !data.username || !data.role) {
      return { success: false, message: 'Data tidak lengkap.' };
    }

    // Check duplicate username for other users
    const checkUsr = await db.execute({ sql: 'SELECT id FROM users WHERE username = ? AND id != ?', args: [data.username, id] });
    if (checkUsr.rows.length > 0) {
      return { success: false, message: 'Username sudah dipakai oleh user lain.' };
    }

    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(data.password, salt);
      await db.execute({
        sql: 'UPDATE users SET name = ?, username = ?, role = ?, password = ? WHERE id = ?',
        args: [data.name, data.username, data.role, hash, id]
      });
    } else {
      await db.execute({
        sql: 'UPDATE users SET name = ?, username = ?, role = ? WHERE id = ?',
        args: [data.name, data.username, data.role, id]
      });
    }

    // If changing own role to non-Super Admin, they might lose access on next refresh, but that's expected
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Terjadi kesalahan sistem' };
  }
}

export async function deleteUser(id: number) {
  try {
    const session = await requireSuperAdmin();

    // Prevent deleting oneself
    if (session.userId === id) {
      return { success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri.' };
    }

    await db.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [id]
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Terjadi kesalahan sistem' };
  }
}
