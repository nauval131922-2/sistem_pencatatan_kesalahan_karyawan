import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = request.nextUrl.searchParams.get('jobId');
    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    // Get job info
    const jobResult = await db.execute({
      sql: `SELECT * FROM sync_jobs WHERE job_id = ?`,
      args: [jobId]
    });

    if (jobResult.rows.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = jobResult.rows[0];

    // Get all module statuses for this job
    const modulesResult = await db.execute({
      sql: `SELECT module_id, status, records_count, error_message, updated_at FROM sync_job_modules WHERE job_id = ?`,
      args: [jobId]
    });

    const modules: Record<string, { status: string; count: number; error?: string; updatedAt: string }> = {};
    for (const row of modulesResult.rows) {
      modules[row.module_id as string] = {
        status: row.status as string,
        count: Number(row.records_count || 0),
        error: row.error_message as string | undefined,
        updatedAt: row.updated_at as string,
      };
    }

    return NextResponse.json({
      success: true,
      job: {
        jobId,
        status: job.status,
        currentModule: job.current_module,
        totalModules: Number(job.total_modules),
        startDate: job.start_date,
        endDate: job.end_date,
        createdAt: job.created_at,
        completedAt: job.completed_at,
      },
      modules,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
