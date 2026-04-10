'use server';

import db from '@/lib/db';
import { getSession } from '@/lib/session';
import type { PermissionMap } from './permissions-constants';

// ─── Save permissions for a specific role (Super Admin only) ─────────────────
// This is a Client-callable Server Action (must be in a 'use server' file)
export async function saveRolePermissions(
  role: string,
  permissions: PermissionMap
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'Super Admin') {
      return { success: false, message: 'Forbidden: Hanya Super Admin yang dapat mengubah hak akses.' };
    }

    // Super Admin permissions cannot be modified
    if (role === 'Super Admin') {
      return { success: false, message: 'Hak akses Super Admin tidak dapat diubah.' };
    }

    // Build batch upsert queries
    const queries: string[] = [];
    for (const [moduleKey, canAccess] of Object.entries(permissions)) {
      queries.push(
        `INSERT INTO role_permissions (role, module_key, can_access) 
         VALUES ('${role}', '${moduleKey}', ${canAccess ? 1 : 0})
         ON CONFLICT(role, module_key) DO UPDATE SET can_access = ${canAccess ? 1 : 0};`
      );
    }

    if (queries.length > 0) {
      await db.batch(queries, 'write');
    }

    return { success: true };
  } catch (error: any) {
    console.error('[PERMISSIONS] Failed to save permissions:', error);
    return { success: false, message: error.message || 'Terjadi kesalahan sistem.' };
  }
}

// ─── Add a new role (Super Admin only) ─────────────────
export async function addRole(
  roleName: string,
  description: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'Super Admin') return { success: false, message: 'Forbidden' };
    
    if (roleName.trim() === '' || roleName.toLowerCase() === 'super admin') {
      return { success: false, message: 'Nama role tidak valid.' };
    }

    const { rows } = await db.execute({
      sql: 'SELECT 1 FROM app_roles WHERE role_name = ?',
      args: [roleName.trim()]
    });

    if (rows.length > 0) {
      return { success: false, message: 'Role dengan nama tersebut sudah ada.' };
    }

    await db.execute({
      sql: "INSERT INTO app_roles (role_name, description, color, bg, border) VALUES (?, ?, 'text-indigo-600', 'bg-indigo-50', 'border-indigo-200')",
      args: [roleName.trim(), description.trim()]
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// ─── Edit an existing role (Super Admin only) ─────────────────
export async function updateRole(
  oldRoleName: string,
  newRoleName: string,
  description: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'Super Admin') return { success: false, message: 'Forbidden' };

    if (oldRoleName === 'Super Admin') {
      return { success: false, message: 'Role Super Admin tidak dapat diubah namanya.' };
    }

    if (newRoleName.trim() === '' || newRoleName.toLowerCase() === 'super admin') {
      return { success: false, message: 'Nama role baru tidak valid.' };
    }

    if (oldRoleName !== newRoleName) {
      const { rows } = await db.execute({
        sql: 'SELECT 1 FROM app_roles WHERE role_name = ?',
        args: [newRoleName.trim()]
      });

      if (rows.length > 0) {
        return { success: false, message: 'Role target sudah ada.' };
      }
    }

    await db.batch([
      {
        sql: 'UPDATE app_roles SET role_name = ?, description = ? WHERE role_name = ?',
        args: [newRoleName.trim(), description.trim(), oldRoleName]
      },
      {
        sql: 'UPDATE role_permissions SET role = ? WHERE role = ?',
        args: [newRoleName.trim(), oldRoleName]
      },
      {
        sql: 'UPDATE users SET role = ? WHERE role = ?',
        args: [newRoleName.trim(), oldRoleName]
      }
    ], 'write');

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// ─── Delete an existing role (Super Admin only) ─────────────────
export async function deleteRole(
  roleName: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'Super Admin') return { success: false, message: 'Forbidden' };

    if (roleName === 'Super Admin' || roleName === 'Admin') {
      return { success: false, message: 'Role bawaan sistem tidak dapat dihapus.' };
    }

    const { rows } = await db.execute({
      sql: 'SELECT 1 FROM app_roles WHERE role_name = ?',
      args: [roleName.trim()]
    });

    if (rows.length === 0) {
      return { success: false, message: 'Role tidak ditemukan.' };
    }

    // 1. Delete from app_roles
    // 2. Delete permissions
    // 3. Flag users so they cannot login until reassigned
    await db.batch([
      {
        sql: 'DELETE FROM app_roles WHERE role_name = ?',
        args: [roleName.trim()]
      },
      {
        sql: 'DELETE FROM role_permissions WHERE role = ?',
        args: [roleName.trim()]
      },
      {
        sql: 'UPDATE users SET role = ? WHERE role = ?',
        args: ['Role Dihapus', roleName.trim()]
      }
    ], 'write');

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
