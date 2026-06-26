'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Stats {
  total_videos: number; published_today: number; pending_concepts: number;
  active_channels: number; total_channels: number;
}

interface VideoRow {
  id: number; title: string; channel_name: string; status: string; published_at: string;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<VideoRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [s, v] = await Promise.all([
        api.get<Stats>('/analytics/stats'),
        api.get<VideoRow[]>('/analytics/recent-videos'),
      ])
      setStats(s); setRecent(v)
    } finally { setLoading(false) }
  }

  const statusLabel: Record<string, string> = {
    pending: 'Bekliyor', processing: 'İşleniyor',
    done: 'Tamamlandı', failed: 'Başarısız',
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    done: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  }

  if (loading) return <div className="p-8 text-center">Yükleniyor…</div>

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Maliyet & Analitik</h2>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Toplam Video', value: stats.total_videos },
            { label: 'Bugün Yayınlanan', value: stats.published_today },
            { label: 'Bekleyen Konsept', value: stats.pending_concepts },
            { label: 'Aktif Kanal', value: `${stats.active_channels} / ${stats.total_channels}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold">Son Videolar</h3>
        </div>
        {recent.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">Henüz video yok.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map(v => (
              <div key={v.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{v.title}</p>
                  <p className="text-xs text-gray-400">{v.channel_name} · {v.published_at ? new Date(v.published_at).toLocaleDateString('tr-TR') : '—'}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[v.status] || 'bg-gray-100 text-gray-600'}`}>
                  {statusLabel[v.status] || v.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
