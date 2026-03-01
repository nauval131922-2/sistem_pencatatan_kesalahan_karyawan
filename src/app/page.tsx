import { getStats, getInfractions } from '@/lib/actions';
import { Users, AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RecLog | Dashboard',
};

export default async function Home() {
  const [stats, infractions] = await Promise.all([
    getStats(),
    getInfractions()
  ]);

  const recentInfractions = infractions.slice(0, 5);

  const statCards = [
    { title: 'Total Karyawan', value: stats.totalEmployees, icon: Users, classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', href: '/employees' },
    { title: 'Total Kesalahan', value: stats.totalInfractions, icon: AlertTriangle, classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20', href: '/records' },
  ];

  const fmtDateTime = (dt: string | null | undefined) => {
    if (!dt) return null;
    return new Date(dt).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Dashboard</h2>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {statCards.map((card) => (
          <Link key={card.title} href={card.href} className="card relative overflow-hidden cursor-pointer hover:border-emerald-300 transition-colors block">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl border ${card.classes}`}>
                <card.icon size={24} />
              </div>
              <h3 className="text-slate-400 font-medium text-sm">{card.title}</h3>
            </div>
            <p className="text-4xl font-bold">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="card">
        <h3 className="text-base font-semibold mb-4">Aktivitas Terkini</h3>
        <div className="space-y-2">
          {recentInfractions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 italic text-sm">
              Belum ada aktivitas yang dicatat.
            </div>
          ) : (
            (recentInfractions as any[]).map((inf) => (
              <div key={inf.id} className="card hover:border-emerald-200 transition-all">
                <div className="space-y-1 min-w-0">

                  {/* Baris 1: nama karyawan, tanggal pencatatan, faktur */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-emerald-600">{inf.employee_name}</span>
                    <span className="text-[10px] text-slate-400">{inf.date?.slice(0, 10)}</span>
                    {inf.faktur && (
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                        {inf.faktur}
                      </span>
                    )}
                  </div>

                  {/* Baris 2: order produksi */}
                  {inf.order_name && (
                    <span className="inline-block bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                      {inf.order_name}
                    </span>
                  )}

                  {/* Baris 3: deskripsi */}
                  {inf.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{inf.description}</p>
                  )}

                  {/* Baris 4: dicatat oleh */}
                  <p className="text-[10px] text-slate-400">Oleh: {inf.recorded_by}</p>

                  {/* Baris 5: timestamp created_at / updated_at */}
                  <div className="flex items-center gap-1 pt-1 mt-1 border-t border-slate-100">
                    <Clock size={10} className="text-slate-300 shrink-0" />
                    {inf.updated_at && inf.updated_at !== inf.created_at ? (
                      <span className="text-[10px] text-amber-500">
                        Diperbarui: {fmtDateTime(inf.updated_at)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        Dibuat: {fmtDateTime(inf.created_at) ?? inf.date}
                      </span>
                    )}
                  </div>

                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
