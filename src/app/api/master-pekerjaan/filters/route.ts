
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category') || '';
    const subCategory = request.nextUrl.searchParams.get('sub_category') || '';

    // Build WHERE for category
    let catWhere = '1=1';
    const catArgs: any[] = [];
    if (category) {
      const prefix = category.trim().split(' ')[0].replace(/\.+$/, '');
      if (prefix.length === 1 && /^[A-Z]$/i.test(prefix)) {
        catWhere = 'code LIKE ?';
        catArgs.push(`${prefix}.%`);
      } else {
        catWhere = 'category LIKE ?';
        catArgs.push(`%${category.trim()}%`);
      }
    }

    // Build WHERE for sub_category (applied when fetching groups)
    let subWhere = catWhere;
    const subArgs = [...catArgs];
    if (subCategory) {
      const subPrefix = subCategory.trim().split(' ')[0];
      if (subPrefix.includes('.') || subPrefix.length <= 2) {
        subWhere += ' AND code LIKE ?';
        subArgs.push(`${subPrefix}%`);
      } else {
        subWhere += ' AND sub_category LIKE ?';
        subArgs.push(`%${subCategory.trim()}%`);
      }
    }

    const [subResult, groupResult] = await Promise.all([
      db.execute({ sql: `SELECT DISTINCT sub_category FROM master_pekerjaan WHERE ${catWhere} AND sub_category IS NOT NULL AND sub_category != '' ORDER BY sub_category ASC`, args: catArgs }),
      db.execute({ sql: `SELECT DISTINCT group_pekerjaan FROM master_pekerjaan WHERE ${subWhere} AND group_pekerjaan IS NOT NULL AND group_pekerjaan != '' ORDER BY group_pekerjaan ASC`, args: subArgs }),
    ]);

    const subCategories = (subResult.rows as any[]).map(r => r.sub_category);
    const groups = (groupResult.rows as any[]).map(r => r.group_pekerjaan);

    return NextResponse.json({ success: true, subCategories, groups });
  } catch (error: any) {
    console.error('[API Filter Master Pekerjaan] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

