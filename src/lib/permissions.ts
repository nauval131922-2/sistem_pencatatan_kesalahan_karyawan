// permissions.ts — No top-level 'use server' because this file also exports non-function constants.
// Functions that mutate data use 'use server' inline (in their own invocation scope).

import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { MODULE_REGISTRY } from './permissions-constants';
import type { PermissionMap, ModuleKey } from './permissions-constants';
export { MODULE_REGISTRY } from './permissions-constants';
export type { ModuleKey, PermissionMap } from './permissions-constants';

// ─── Map module key to its primary route ──────────────────────────────────────
// Ordered by sidebar priority — first accessible route wins.
const MODULE_TO_ROUTE: Array<{ key: string; route: string }> = [
  { key: 'dashboard',             route: '/dashboard' },
  { key: 'sync',                  route: '/sync' },
  { key: 'pembelian_pr',          route: '/pr' },
  { key: 'pembelian_spph',        route: '/spph-out' },
  { key: 'pembelian_sph_in',      route: '/sph-in' },
  { key: 'pembelian_po',          route: '/purchase-orders' },
  { key: 'pembelian_penerimaan',  route: '/penerimaan-pembelian' },
  { key: 'pembelian_rekap',       route: '/rekap-pembelian-barang' },
  { key: 'pembelian_hutang',      route: '/pelunasan-hutang' },
  { key: 'produksi_bom',          route: '/bom' },
  { key: 'produksi_orders',       route: '/orders' },
  { key: 'produksi_bahan_baku',   route: '/bahan-baku' },
  { key: 'produksi_barang_jadi',  route: '/barang-jadi' },
  { key: 'penjualan_sph_out',     route: '/sph-out' },
  { key: 'penjualan_so',          route: '/sales-orders' },
  { key: 'penjualan_laporan',     route: '/sales' },
  { key: 'penjualan_piutang',     route: '/pelunasan-piutang' },
  { key: 'penjualan_pengiriman',  route: '/pengiriman' },
  { key: 'kalkulasi_rekap_so',    route: '/rekap-sales-order' },
  { key: 'karyawan',              route: '/employees' },
  { key: 'hpp_kalkulasi',         route: '/hpp-kalkulasi' },
  { key: 'catat_kesalahan',       route: '/records' },
  { key: 'statistik',             route: '/stats' },
  { key: 'tracking_manufaktur',   route: '/tracking-manufaktur' },
];

// ─── Get the first route accessible for a given role ──────────────────────────
// Used after login and on root redirect so users are never sent to a forbidden page.
export async function getFirstAccessibleRoute(role: string): Promise<string> {
  // Super Admin always lands on dashboard
  if (role === 'Super Admin') return '/dashboard';

  const permissions = await getRolePermissions(role);

  for (const { key, route } of MODULE_TO_ROUTE) {
    if (permissions[key] === true) return route;
  }

  // Fallback: no module is accessible — send to profile page
  return '/profile';
}

// ─── Fetch all permissions for a given role ────────────────────────────────
export async function getRolePermissions(role: string): Promise<PermissionMap> {
  // Super Admin always has full access — no DB lookup needed
  if (role === 'Super Admin') {
    return Object.fromEntries(MODULE_REGISTRY.map(m => [m.key, true]));
  }

  try {
    const result = await db.execute({
      sql: 'SELECT module_key, can_access FROM role_permissions WHERE role = ?',
      args: [role],
    });

    // Build map from DB rows
    const dbMap: PermissionMap = {};
    for (const row of result.rows) {
      dbMap[row.module_key as string] = Number(row.can_access) === 1;
    }

    // Fill in any missing module keys with default false (graceful fallback)
    const map: PermissionMap = {};
    for (const m of MODULE_REGISTRY) {
      map[m.key] = dbMap[m.key] !== undefined ? dbMap[m.key] : false;
    }

    return map;
  } catch (error) {
    console.error('[PERMISSIONS] Failed to fetch role permissions:', error);
    // On error, return false access so users are not silently empowered on DB fail
    return Object.fromEntries(MODULE_REGISTRY.map(m => [m.key, false]));
  }
}

// ─── Fetch permissions for all roles (for the matrix UI) ─────────────────────
export async function getAllPermissions(): Promise<Record<string, PermissionMap>> {
  const result: Record<string, PermissionMap> = {};
  
  try {
    const { rows } = await db.execute('SELECT role_name FROM app_roles');
    const roles = ['Super Admin', ...rows.map(r => r.role_name as string)]; // Super Admin is implicit
    
    for (const role of roles) {
      result[role] = await getRolePermissions(role);
    }
  } catch (err) {
    console.error('[PERMISSIONS] Failed to fetch all roles:', err);
    // fallback
    result['Super Admin'] = await getRolePermissions('Super Admin');
    result['Admin'] = await getRolePermissions('Admin');
  }

  return result;
}

// ─── Server-side enforcement: redirect if no access ──────────────────────────
// Call this at the top of any protected page.tsx
export async function requirePermission(moduleKey: ModuleKey): Promise<void> {
  const session = await getSession();

  // Not logged in → redirect to login
  if (!session || !session.userId) {
    redirect('/login');
  }

  // Super Admin always has access
  if (session.role === 'Super Admin') return;

  // Define a variable outside to track if access is denied
  let isDenied = false;

  try {
    const result = await db.execute({
      sql: 'SELECT can_access FROM role_permissions WHERE role = ? AND module_key = ?',
      args: [session.role, moduleKey],
    });

    const canAccess = result.rows[0];

    // If a row exists and can_access is explicitly 0, mark as denied
    if (canAccess && Number(canAccess.can_access) === 0) {
      isDenied = true;
    }
  } catch (error) {
    // Log the error but fail open (allow access) to prevent locking everyone out if DB is down
    console.error(`[PERMISSIONS] Error checking access for ${moduleKey}:`, error);
  }

  // Next.js redirect() throws an error, so it MUST be OUTSIDE the try-catch block
  // Otherwise, the catch block swallows the redirect error, bypassing the security guard!
  if (isDenied) {
    redirect('/unauthorized');
  }
}
