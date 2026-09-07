import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { cacheGet, cacheSet } from '@/lib/server-cache';
import {
  buildActivityLogWhere,
  buildActivityLogOrderBy,
  getActivityLogTable,
  type ActivityLogQueryParams,
  type ActivityLogSortField,
  type ActivityLogSortDir,
} from '@/lib/activity-log-query';
import type { ActivityLogSource } from '@/lib/activity-log-utils';

import { canViewActivityLog } from '@/lib/activity-log-permissions';

const CACHE_TTL = 30_000; // 30 seconds for stats/count cache

function cacheKey(params: ActivityLogQueryParams): string {
  const p = params;
  const deep = p.opts?.skipRawDataSearch === false ? 'deep' : 'normal';
  return `activity-log:${p.source ?? 'active'}|${p.from ?? ''}|${p.to ?? ''}|${p.tableName ?? ''}|${p.actionType ?? ''}|${p.recordedBy ?? ''}|${p.search ?? ''}|${deep}`;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseQuery(searchParams: URLSearchParams): ActivityLogQueryParams {
  const source = searchParams.get('source');
  const fromRaw = searchParams.get('from');
  const toRaw = searchParams.get('to');
  // ponytail: empty string = undefined, jangan pakai || karena "" adalah falsy tapi .get() bisa return ""
  const from = fromRaw?.trim() || undefined;
  const to = toRaw?.trim() || undefined;
  const deepSearch = searchParams.get('deepSearch') === '1';
  const params: ActivityLogQueryParams = {
    from: from ?? todayStr(),
    to: to ?? todayStr(),
    search: (searchParams.get('search') || '').trim() || undefined,
    tableName: searchParams.get('tableName') || undefined,
    actionType: searchParams.get('actionType') || undefined,
    recordedBy: searchParams.get('recordedBy') || undefined,
    source: (source === 'archive' ? 'archive' : 'active') as ActivityLogSource,
    page: Math.max(1, parseInt(searchParams.get('page') || '1', 10)),
    pageSize: Math.min(200, Math.max(10, parseInt(searchParams.get('pageSize') || '50', 10))),
    sortBy: (() => {
      const s = searchParams.get('sortBy');
      const allowed: ActivityLogSortField[] = ['created_at', 'action_type', 'table_name', 'recorded_by'];
      return s && allowed.includes(s as ActivityLogSortField) ? (s as ActivityLogSortField) : 'created_at';
    })(),
    sortDir: (searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc') as ActivityLogSortDir,
    opts: { skipRawDataSearch: !deepSearch }, // ponytail: raw_data LIKE lambat, skip kecuali user aktifkan deepSearch
  };
  return params;
}

async function queryLogs(params: ActivityLogQueryParams, withStats = false) {
  const table = getActivityLogTable(params.source);
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 50;

  // Build one WHERE — always includes u.name JOIN agar count & data konsisten
  const { whereClause: fullWhere, args: fullArgs } = buildActivityLogWhere(params);
  const JOIN = 'LEFT JOIN users u ON al.recorded_by = u.username';
  const orderBy = buildActivityLogOrderBy(params.sortBy, params.sortDir);

  // 1) COUNT query — cached, dengan JOIN agar u.name search konsisten dengan data query
  const ck = cacheKey(params);
  let total: number;
  const cachedCount = cacheGet<number>(ck + ':count');
  if (cachedCount !== undefined) {
    total = cachedCount;
  } else {
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) AS total FROM ${table} al ${JOIN} ${fullWhere}`,
      args: fullArgs,
    });
    total = Number(countResult.rows[0]?.total ?? 0);
    cacheSet(ck + ':count', total, CACHE_TTL);
  }
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const safeOffset = (safePage - 1) * pageSize;

  // 2) DATA query — with JOIN for recorded_by_name (always fresh)
  // Force index untuk default sort (created_at DESC) biar ga full scan + sort 2.68M rows
  // ponytail: exclude raw_data dari list — fetch via ?logId= on expand
  const archiveCol = params.source === 'archive' ? ', al.archived_at' : '';
  const indexHint = params.sortBy === 'created_at' && params.sortDir === 'desc'
    ? ' INDEXED BY idx_activity_logs_created_at_id_desc' : '';
  const dataResult = await db.execute({
    sql: `
      SELECT al.id, al.created_at, al.action_type, al.table_name, al.record_id,
             al.message, al.recorded_by${archiveCol},
             u.name AS recorded_by_name
      FROM ${table} al${indexHint}
      LEFT JOIN users u ON al.recorded_by = u.username
      ${fullWhere}
      ${orderBy}
      LIMIT ? OFFSET ?
    `,
    args: [...fullArgs, pageSize, safeOffset],
  });

  // 3) STATS queries — cached, dengan JOIN agar konsisten dengan data query
  let actionStats: { value: string; count: number }[] = [];
  let tableStats: { value: string; count: number }[] = [];
  let userStats: { value: string; label: string; count: number }[] = [];
  if (withStats && total > 0) {
    const cachedAction = cacheGet<{ value: string; count: number }[]>(ck + ':stats:action');
    if (cachedAction) {
      actionStats = cachedAction;
    } else {
      const r = await db.execute({
        sql: `SELECT al.action_type AS value, COUNT(*) AS count FROM ${table} al ${JOIN} ${fullWhere} GROUP BY al.action_type ORDER BY count DESC LIMIT 20`,
        args: fullArgs,
      });
      actionStats = r.rows.map((r) => ({ value: String(r.value ?? ''), count: Number(r.count ?? 0) }));
      cacheSet(ck + ':stats:action', actionStats, CACHE_TTL);
    }

    const cachedTable = cacheGet<{ value: string; count: number }[]>(ck + ':stats:table');
    if (cachedTable) {
      tableStats = cachedTable;
    } else {
      const r = await db.execute({
        sql: `SELECT al.table_name AS value, COUNT(*) AS count FROM ${table} al ${JOIN} ${fullWhere} GROUP BY al.table_name ORDER BY count DESC LIMIT 50`,
        args: fullArgs,
      });
      tableStats = r.rows.map((r) => ({ value: String(r.value ?? ''), count: Number(r.count ?? 0) }));
      cacheSet(ck + ':stats:table', tableStats, CACHE_TTL);
    }

    const cachedUser = cacheGet<{ value: string; label: string; count: number }[]>(ck + ':stats:user');
    if (cachedUser) {
      userStats = cachedUser;
    } else {
      const r = await db.execute({
        sql: `SELECT al.recorded_by AS value, COUNT(*) AS count FROM ${table} al ${JOIN} ${fullWhere} GROUP BY al.recorded_by ORDER BY count DESC LIMIT 50`,
        args: fullArgs,
      });
      userStats = r.rows.map((r) => ({ value: String(r.value ?? ''), label: '', count: Number(r.count ?? 0) }));
      // Populate names
      if (userStats.length > 0) {
        const usernames = userStats.map((u) => u.value);
        const placeholders = usernames.map(() => '?').join(',');
        const userRes = await db.execute({
          sql: `SELECT username, name FROM users WHERE username IN (${placeholders})`,
          args: usernames,
        });
        const nameMap = new Map<string, string>();
        for (const row of userRes.rows) {
          nameMap.set(String(row.username ?? ''), String(row.name ?? ''));
        }
        for (const u of userStats) {
          u.label = nameMap.get(u.value) ?? '';
        }
      }
      cacheSet(ck + ':stats:user', userStats, CACHE_TTL);
    }
  }

  return {
    data: dataResult.rows,
    total,
    page: safePage,
    pageSize,
    totalPages,
    actionStats,
    tableStats,
    userStats,
    source: params.source ?? 'active',
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preview = searchParams.get('preview') === '1';

    if (!preview) {
      const allowed = await canViewActivityLog(session.role);
      if (!allowed) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const logId = searchParams.get('logId');
    if (logId) {
      const id = parseInt(logId, 10);
      if (!isNaN(id)) {
        for (const source of ['active', 'archive'] as ActivityLogSource[]) {
          const table = getActivityLogTable(source);
          const row = await db.execute({
            sql: `
              SELECT al.*, u.name AS recorded_by_name
              FROM ${table} al
              LEFT JOIN users u ON al.recorded_by = u.username
              WHERE al.id = ?
              LIMIT 1
            `,
            args: [id],
          });
          if (row.rows[0]) {
            return NextResponse.json({
              success: true,
              data: [row.rows[0]],
              total: 1,
              page: 1,
              pageSize: 1,
              totalPages: 1,
              source,
            });
          }
        }
        return NextResponse.json({ success: true, data: [], total: 0, page: 1, pageSize: 1, totalPages: 1 });
      }
    }

    const params = parseQuery(searchParams);
    const withStats = searchParams.get('stats') === '1';
    const result = await queryLogs(params, withStats);
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action_type, table_name, message, raw_data, recorded_by } = body;
    const session = await getSession();

    if (!action_type || !table_name || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await db.execute({
      sql: `
        INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by)
        VALUES (?, ?, 0, ?, ?, ?)
      `,
      args: [action_type, table_name, message, raw_data || '{}', session?.username || recorded_by || 'System']
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export type { ActivityLogSource };
