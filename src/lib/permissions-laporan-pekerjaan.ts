import db from '@/lib/db';
import {
  LAPORAN_PEKERJAAN_COLUMNS,
  LAPORAN_PEKERJAAN_BAGIAN_LIST,
  type RoleLaporanPekerjaanConfig,
  type LaporanPekerjaanColumnKey,
} from './permissions-laporan-pekerjaan-constants';

export {
  LAPORAN_PEKERJAAN_COLUMNS,
  LAPORAN_PEKERJAAN_BAGIAN_LIST,
  type RoleLaporanPekerjaanConfig,
  type LaporanPekerjaanColumnKey,
} from './permissions-laporan-pekerjaan-constants';

export { saveRoleLaporanPekerjaanConfig } from './permissions-laporan-pekerjaan-actions';

export function parseJsonArray(val: any): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
  }
  return [];
}

let tableChecked = false;
async function ensureTable() {
  if (tableChecked) return;
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS role_laporan_pekerjaan_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT UNIQUE NOT NULL,
      allowed_bagian TEXT DEFAULT '[]',
      allowed_pic TEXT DEFAULT '[]',
      excluded_pic TEXT DEFAULT '[]',
      visible_columns TEXT DEFAULT '[]',
      can_add INTEGER DEFAULT 1,
      can_edit INTEGER DEFAULT 1,
      can_delete INTEGER DEFAULT 1,
      delete_scope TEXT DEFAULT 'all',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`);
    const check = await db.execute("PRAGMA table_info(role_laporan_pekerjaan_config)");
    const cols = (check.rows as any[]).map((r) => r.name);
    if (!cols.includes('excluded_pic')) {
      await db.execute("ALTER TABLE role_laporan_pekerjaan_config ADD COLUMN excluded_pic TEXT DEFAULT '[]';");
    }
    if (!cols.includes('can_add')) {
      await db.execute("ALTER TABLE role_laporan_pekerjaan_config ADD COLUMN can_add INTEGER DEFAULT 1;");
    }
    if (!cols.includes('can_edit')) {
      await db.execute("ALTER TABLE role_laporan_pekerjaan_config ADD COLUMN can_edit INTEGER DEFAULT 1;");
    }
    if (!cols.includes('can_delete')) {
      await db.execute("ALTER TABLE role_laporan_pekerjaan_config ADD COLUMN can_delete INTEGER DEFAULT 1;");
    }
    if (!cols.includes('delete_scope')) {
      await db.execute("ALTER TABLE role_laporan_pekerjaan_config ADD COLUMN delete_scope TEXT DEFAULT 'all';");
    }
    tableChecked = true;
  } catch {}
}

/**
 * Ambil konfigurasi Laporan Pekerjaan untuk satu role.
 */
export async function getRoleLaporanPekerjaanConfig(role: string): Promise<RoleLaporanPekerjaanConfig> {
  const allColumns = LAPORAN_PEKERJAAN_COLUMNS.map(c => c.key);
  if (role === 'Super Admin') {
    return {
      role: 'Super Admin',
      allowed_bagian: [],
      allowed_pic: [],
      excluded_pic: [],
      visible_columns: allColumns,
      can_add: true,
      can_edit: true,
      can_delete: true,
      delete_scope: 'all',
    };
  }

  await ensureTable();

  try {
    const res = await db.execute({
      sql: 'SELECT role, allowed_bagian, allowed_pic, excluded_pic, visible_columns, can_add, can_edit, can_delete, delete_scope FROM role_laporan_pekerjaan_config WHERE role = ?',
      args: [role],
    });
    if (res.rows.length === 0) {
      return {
        role,
        allowed_bagian: [],
        allowed_pic: [],
        excluded_pic: [],
        visible_columns: allColumns,
        can_add: true,
        can_edit: true,
        can_delete: true,
        delete_scope: 'all',
      };
    }

    const row = res.rows[0];
    const allowed_bagian = parseJsonArray(row.allowed_bagian);
    const allowed_pic = parseJsonArray(row.allowed_pic);
    const excluded_pic = parseJsonArray(row.excluded_pic);
    let visible_columns = parseJsonArray(row.visible_columns);
    if (visible_columns.length === 0) {
      visible_columns = allColumns;
    }
    const can_add = row.can_add !== undefined && row.can_add !== null ? Number(row.can_add) === 1 : true;
    const can_edit = row.can_edit !== undefined && row.can_edit !== null ? Number(row.can_edit) === 1 : true;
    const can_delete = row.can_delete !== undefined && row.can_delete !== null ? Number(row.can_delete) === 1 : true;
    let delete_scope = (row.delete_scope as any) || (can_delete ? 'all' : 'none');
    if (!['none', 'table_only', 'card_only', 'all'].includes(delete_scope)) {
      delete_scope = can_delete ? 'all' : 'none';
    }

    return {
      role,
      allowed_bagian,
      allowed_pic,
      excluded_pic,
      visible_columns,
      can_add,
      can_edit,
      can_delete: delete_scope !== 'none',
      delete_scope,
    };
    console.error(`[PERMISSIONS] Failed to get config for role ${role}:`, error);
    return {
      role,
      allowed_bagian: [],
      allowed_pic: [],
      excluded_pic: [],
      visible_columns: allColumns,
      can_add: true,
      can_edit: true,
      can_delete: true,
      delete_scope: 'all',
    };
  }

/**
 * Ambil konfigurasi Laporan Pekerjaan untuk semua role yang terdaftar.
 */
export async function getAllRoleLaporanPekerjaanConfigs(): Promise<Record<string, RoleLaporanPekerjaanConfig>> {
  const allColumns = LAPORAN_PEKERJAAN_COLUMNS.map(c => c.key);
  const result: Record<string, RoleLaporanPekerjaanConfig> = {
    'Super Admin': {
      role: 'Super Admin',
      allowed_bagian: [],
      allowed_pic: [],
      excluded_pic: [],
      visible_columns: allColumns,
      can_add: true,
      can_edit: true,
      can_delete: true,
      delete_scope: 'all',
    },
  };
  await ensureTable();

  try {
    const { rows } = await db.execute('SELECT role, allowed_bagian, allowed_pic, excluded_pic, visible_columns, can_add, can_edit, can_delete, delete_scope FROM role_laporan_pekerjaan_config');
      const roleName = String(row.role);
      const allowed_bagian = parseJsonArray(row.allowed_bagian);
      const allowed_pic = parseJsonArray(row.allowed_pic);
      const excluded_pic = parseJsonArray(row.excluded_pic);
      let visible_columns = parseJsonArray(row.visible_columns);
      if (visible_columns.length === 0) {
        visible_columns = allColumns;
      }
      const can_add = row.can_add !== undefined && row.can_add !== null ? Number(row.can_add) === 1 : true;
      const can_edit = row.can_edit !== undefined && row.can_edit !== null ? Number(row.can_edit) === 1 : true;
      const can_delete = row.can_delete !== undefined && row.can_delete !== null ? Number(row.can_delete) === 1 : true;
      let delete_scope = (row.delete_scope as any) || (can_delete ? 'all' : 'none');
      if (!['none', 'table_only', 'card_only', 'all'].includes(delete_scope)) {
        delete_scope = can_delete ? 'all' : 'none';
      }

      result[roleName] = {
        role: roleName,
        allowed_bagian,
        allowed_pic,
        excluded_pic,
        visible_columns,
        can_add,
        can_edit,
        can_delete: delete_scope !== 'none',
        delete_scope,
      };
    }
    console.error('[PERMISSIONS] Failed to get all role configs:', error);
  }

  return result;
}

/**
 * Gabungkan (merge) konfigurasi Laporan Pekerjaan dari array roles milik user aktif.
 */
export async function getUserMergedLaporanPekerjaanConfig(
  roles: string[],
  currentUser?: { name?: string; username?: string; employeeName?: string }
): Promise<RoleLaporanPekerjaanConfig> {
  const allColumns = LAPORAN_PEKERJAAN_COLUMNS.map(c => c.key);
  if (!roles || roles.length === 0 || roles.includes('Super Admin')) {
    return {
      role: 'Super Admin',
      allowed_bagian: [],
      allowed_pic: [],
      excluded_pic: [],
      visible_columns: allColumns,
    };
  }

  const allConfigs = await Promise.all(roles.map(r => getRoleLaporanPekerjaanConfig(r)));

  // Jika salah satu role memiliki akses ALL bagian (array kosong), user mendapatkan akses ALL bagian.
  // Selain itu, union dari allowed_bagian masing-masing role.
  let allowed_bagian: string[] = [];
  const hasUnrestrictedBagian = allConfigs.some(c => !c.allowed_bagian || c.allowed_bagian.length === 0);
  if (!hasUnrestrictedBagian) {
    const bagianSet = new Set<string>();
    allConfigs.forEach(c => c.allowed_bagian?.forEach(b => bagianSet.add(b.toUpperCase())));
    allowed_bagian = Array.from(bagianSet);
  }
  // Resolusi allowed_pic dan excluded_pic:
  // Jika role memiliki excluded_pic (misal: @role:NamaRole atau nama PIC spesifik), resolve ke daftar nama karyawan
  const hasUnrestrictedPic = allConfigs.some(c => !c.allowed_pic || c.allowed_pic.length === 0);
  let allowed_pic: string[] = [];

  // Helper untuk me-resolve @role ke nama-nama karyawan dari DB
  const resolveRoleNames = async (roleNames: string[]): Promise<Set<string>> => {
    const resultNames = new Set<string>();
    if (roleNames.length === 0) return resultNames;
    try {
      const placeholders = roleNames.map(() => '?').join(',');
      const { rows } = await db.execute({
        sql: `SELECT DISTINCT COALESCE(e.name, u.name) as name
              FROM users u
              LEFT JOIN employees e ON e.id = u.employee_id
              LEFT JOIN user_roles ur ON ur.user_id = u.id
              WHERE (ur.role_name IN (${placeholders}) OR u.role IN (${placeholders}))
                AND COALESCE(e.name, u.name) IS NOT NULL
                AND COALESCE(e.name, u.name) != ''`,
        args: [...roleNames, ...roleNames],
      });
      rows.forEach((r: any) => {
        if (r.name) resultNames.add(String(r.name).trim());
      });
    } catch (err) {
      console.error('[PERMISSIONS] Gagal resolve role names:', err);
    }
    return resultNames;
  };

  // 1. Kumpulkan excluded_pic dari seluruh role user aktif (intersection / union sesuai semantik role)
  // Untuk multi-role: jika ada role yang memiliki exclusion, kumpulkan excluded names
  const allExcludedItems = new Set<string>();
  const excludedRolePicks = new Set<string>();

  allConfigs.forEach(c => {
    c.excluded_pic?.forEach(p => {
      if (p.startsWith('@role:')) {
        const rName = p.slice(6).trim();
        if (rName) excludedRolePicks.add(rName);
      } else if (p.trim()) {
        allExcludedItems.add(p.trim());
      }
    });
  });

  if (excludedRolePicks.size > 0) {
    const resolvedExcluded = await resolveRoleNames(Array.from(excludedRolePicks));
    resolvedExcluded.forEach(name => allExcludedItems.add(name));
  }

  const excluded_pic = Array.from(allExcludedItems);

  // 2. Kumpulkan allowed_pic jika restricted
  if (!hasUnrestrictedPic) {
    const picSet = new Set<string>();
    const userName = currentUser?.employeeName || currentUser?.name;
    const rolePicks = new Set<string>();

    allConfigs.forEach(c => {
      c.allowed_pic?.forEach(p => {
        if (p === '@me') {
          if (userName) picSet.add(userName);
        } else if (p.startsWith('@role:')) {
          const rName = p.slice(6).trim();
          if (rName) rolePicks.add(rName);
        } else {
          picSet.add(p);
        }
      });
    });

    if (rolePicks.size > 0) {
      const resolvedAllowed = await resolveRoleNames(Array.from(rolePicks));
      resolvedAllowed.forEach(name => picSet.add(name));
    }

    // Hapus nama-nama yang ada di excluded_pic jika allowed_pic spesifik
    const finalAllowed = Array.from(picSet).filter(
      p => !allExcludedItems.has(p) && !allExcludedItems.has(p.toLowerCase())
    );
    allowed_pic = finalAllowed;
  }
  // Column visibility union: jika salah satu role mengizinkan kolom tersebut, kolom ditampilkan.
  const colSet = new Set<string>();
  allConfigs.forEach(c => {
    if (!c.visible_columns || c.visible_columns.length === 0) {
      allColumns.forEach(col => colSet.add(col));
    } else {
      c.visible_columns.forEach(col => colSet.add(col));
    }
  });

  // Action permissions: jika setidaknya satu role mengizinkan create/edit/delete, bernilai true
  const can_add = allConfigs.length > 0 && allConfigs.some(c => c.can_add !== false);
  const can_edit = allConfigs.length > 0 && allConfigs.some(c => c.can_edit !== false);

  // Resolusi delete_scope untuk multi-role
  let canDeleteTable = false;
  let canDeleteCard = false;
  for (const c of allConfigs) {
    const scope = c.delete_scope || (c.can_delete === false ? 'none' : 'all');
    if (scope === 'all') {
      canDeleteTable = true;
      canDeleteCard = true;
    } else if (scope === 'table_only') {
      canDeleteTable = true;
    } else if (scope === 'card_only') {
      canDeleteCard = true;
    }
  }

  let mergedDeleteScope: 'none' | 'table_only' | 'card_only' | 'all' = 'none';
  if (canDeleteTable && canDeleteCard) {
    mergedDeleteScope = 'all';
  } else if (canDeleteTable) {
    mergedDeleteScope = 'table_only';
  } else if (canDeleteCard) {
    mergedDeleteScope = 'card_only';
  }

  const can_delete = mergedDeleteScope !== 'none';

  return {
    role: roles.join(', '),
    allowed_bagian,
    allowed_pic,
    excluded_pic,
    visible_columns: Array.from(colSet),
    can_add,
    can_edit,
    can_delete,
    delete_scope: mergedDeleteScope,
  };
}
