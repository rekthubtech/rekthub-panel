'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Stats {
  total_videos: number; published_today: number; pending_concepts: number;
  active_channels: number; total_channels: number;
}

interface AtlasBalance {
  balance_usd: number | null; currency: string; error?: string;
}

interface VideoRow {
  id: number; title: string; channel_name: string; status: string; published_at: string;
  cost_usd?: number | null; cost_estimated?: boolean;
}

interface VideoCostMonth {
  month: string; total_usd: number; video_count: number;
}

interface VideoCostProvider {
  provider: string; total_usd: number; video_count: number;
}

interface VideoCostSummary {
  total_usd: number | null; video_count: number; real_count?: number; monthly: VideoCostMonth[]; by_provider?: VideoCostProvider[];
}

interface ChannelCost {
  channel_id: string; channel_name: string;
  estimated_cost: number; manual_total: number; total: number;
}

interface ManualExpense {
  id: string; description: string; amount: number;
  expense_date: string; channel_name_snapshot?: string; category?: string;
  currency?: string;
}

interface VideoRetention {
  content_item_id: number; title: string; channel_name: string;
  youtube_video_id: string; published_at: string;
  views: number; avg_view_duration_sec: number; avg_view_percentage: number;
}

const CURRENCIES = [
  { code: 'TRY', symbol: '₺', label: 'Türk Lirası (₺)' },
  { code: 'USD', symbol: '$', label: 'Dolar ($)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'GBP', symbol: '£', label: 'Pound (£)' },
  { code: 'AED', symbol: 'د.إ', label: 'Dirhem (د.إ)' },
]

const getCurrencySymbol = (code?: string) =>
  CURRENCIES.find(c => c.code === (code || 'TRY'))?.symbol || '₺'

const fmtAmount = (n: number, currency?: string) => {
  const sym = getCurrencySymbol(currency)
  const formatted = Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${sym}${formatted}`
}

const fmt = (n: number) => '₺' + Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtUsd = (n: number | null | undefined, digits = 2) =>
  n != null ? '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '—'

const IconVideo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0"><rect x="2.5" y="6" width="14" height="12" rx="2"/><path d="m16.5 10 5-3v10l-5-3"/></svg>
)
const IconWallet = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0"><path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2"/><path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H7a2 2 0 0 1 0-4h13"/><circle cx="17" cy="14" r="1.5"/></svg>
)
const IconTrendUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>
)
const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
)
const IconEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>
)
const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
)
const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0"><path d="M12 5v14M5 12h14"/></svg>
)
const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6"/></svg>
)
const IconBarChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0"><path d="M4 20V10M12 20V4M20 20v-7"/></svg>
)
const IconLayers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/></svg>
)
const IconSparkle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>
)
const IconChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0"><path d="m6 9 6 6 6-6"/></svg>
)
const IconArrowUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 shrink-0"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
)
const IconArrowDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 shrink-0"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
)
const IconArrowUpDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 shrink-0 opacity-50"><path d="M7 15l5 5 5-5M7 9l5-5 5 5"/></svg>
)

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  return (
    <div className="flex items-center justify-center flex-wrap gap-1 px-5 py-3 border-t border-gray-800">
      <button type="button" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}
        className="px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">‹</button>
      {pages.map(p => (
        <button type="button" key={p} onClick={() => onChange(p)}
          className={`min-w-[28px] px-2 py-1.5 rounded-lg text-xs transition-colors ${p === page ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/[0.05]'}`}>
          {p}
        </button>
      ))}
      <button type="button" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">›</button>
    </div>
  )
}

const PROVIDER_META: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  seedance: { label: 'Seedance (BytePlus)', dot: 'bg-purple-400', text: 'text-purple-300', bg: 'bg-purple-500/10 border-purple-500/20' },
  atlas: { label: 'Atlas Cloud', dot: 'bg-blue-400', text: 'text-blue-300', bg: 'bg-blue-500/10 border-blue-500/20' },
}
function providerMeta(id: string) {
  return PROVIDER_META[id] || { label: id, dot: 'bg-gray-400', text: 'text-gray-300', bg: 'bg-gray-500/10 border-gray-500/20' }
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [atlasBalance, setAtlasBalance] = useState<AtlasBalance | null>(null)
  const [recent, setRecent] = useState<VideoRow[]>([])
  const [videoCosts, setVideoCosts] = useState<VideoCostSummary | null>(null)
  const [channelCosts, setChannelCosts] = useState<ChannelCost[]>([])
  const [manualExpenses, setManualExpenses] = useState<ManualExpense[]>([])
  const [channels, setChannels] = useState<{ id: string; name: string }[]>([])
  const [retention, setRetention] = useState<VideoRetention[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [videosOpen, setVideosOpen] = useState(false)
  const [videosPage, setVideosPage] = useState(1)
  const [retentionPage, setRetentionPage] = useState(1)
  const [retentionSortKey, setRetentionSortKey] = useState<'title' | 'channel_name' | 'views' | 'avg_view_duration_sec' | 'avg_view_percentage' | 'published_at' | null>(null)
  const [retentionSortDir, setRetentionSortDir] = useState<'asc' | 'desc'>('asc')
  const PAGE_SIZE = 10
  const [form, setForm] = useState({
    description: '', amount: '',
    expense_date: new Date().toISOString().slice(0, 10),
    channel_id: '', category: '', currency: 'TRY',
  })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [s, ab, v, vc, summary, manual, ch, ret] = await Promise.all([
        api.get<Stats>('/analytics/summary'),
        api.get<AtlasBalance>('/analytics/atlas-balance').catch(() => null),
        api.get<VideoRow[]>('/analytics/recent-videos?limit=500'),
        api.get<VideoCostSummary>('/analytics/video-costs').catch(() => null),
        api.get<any>('/costs/summary').catch(() => null),
        api.get<ManualExpense[]>('/costs/manual').catch(() => []),
        api.get<any[]>('/channels').catch(() => []),
        api.get<{ videos: VideoRetention[] }>('/analytics/video-retention').catch(() => null),
      ])
      setStats(s)
      setAtlasBalance(ab)
      setRecent(v)
      setVideoCosts(vc)
      if (summary?.channels) setChannelCosts(summary.channels)
      setManualExpenses(manual || [])
      setChannels((ch || []).map((c: any) => ({ id: c.id, name: c.name || c.channel_name || c.id })))
      setRetention(ret?.videos || [])
    } finally { setLoading(false) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/costs/manual', {
        description: form.description,
        amount: parseFloat(form.amount),
        expense_date: form.expense_date,
        channel_id: form.channel_id || null,
        category: form.category || null,
        currency: form.currency,
      })
      setForm({ description: '', amount: '', expense_date: new Date().toISOString().slice(0, 10), channel_id: '', category: '', currency: 'TRY' })
      setShowForm(false)
      fetchData()
    } finally { setSubmitting(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu gideri silmek istiyor musunuz?')) return
    await api.delete(`/costs/manual/${id}`)
    fetchData()
  }

  function toggleRetentionSort(key: 'title' | 'channel_name' | 'views' | 'avg_view_duration_sec' | 'avg_view_percentage' | 'published_at') {
    setRetentionPage(1)
    if (retentionSortKey === key) {
      setRetentionSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setRetentionSortKey(key)
      setRetentionSortDir('asc')
    }
  }

  const currencyTotals = manualExpenses.reduce((acc, exp) => {
    const cur = exp.currency || 'TRY'
    acc[cur] = (acc[cur] || 0) + Number(exp.amount)
    return acc
  }, {} as Record<string, number>)

  const statusLabel: Record<string, string> = {
    pending: 'Bekliyor', running: 'Çalışıyor', completed: 'Tamamlandı',
    processing: 'İşleniyor', done: 'Tamamlandı', failed: 'Başarısız',
  }
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-300',
    running: 'bg-blue-500/20 text-blue-300',
    processing: 'bg-blue-500/20 text-blue-300',
    completed: 'bg-green-500/20 text-green-300',
    done: 'bg-green-500/20 text-green-300',
    failed: 'bg-red-500/20 text-red-300',
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Yükleniyor…</div>

  const atlasBalanceLabel = atlasBalance && atlasBalance.balance_usd !== null && atlasBalance.balance_usd !== undefined
    ? '$' + Number(atlasBalance.balance_usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '—'

  const bytePlusProvider = videoCosts?.by_provider?.find(p => p.provider === 'seedance')
  const bytePlusSpend = bytePlusProvider ? bytePlusProvider.total_usd : null
  const bytePlusVideoCount = bytePlusProvider ? bytePlusProvider.video_count : 0

  const sortedRetention = retentionSortKey
    ? [...retention].sort((a, b) => {
        let av: any = a[retentionSortKey]
        let bv: any = b[retentionSortKey]
        if (retentionSortKey === 'published_at') {
          av = av ? new Date(av).getTime() : 0
          bv = bv ? new Date(bv).getTime() : 0
        } else if (retentionSortKey === 'title' || retentionSortKey === 'channel_name') {
          av = String(av || '').toLowerCase()
          bv = String(bv || '').toLowerCase()
        } else {
          av = Number(av || 0)
          bv = Number(bv || 0)
        }
        if (av < bv) return retentionSortDir === 'asc' ? -1 : 1
        if (av > bv) return retentionSortDir === 'asc' ? 1 : -1
        return 0
      })
    : retention
  const retentionTotalPages = Math.max(1, Math.ceil(sortedRetention.length / PAGE_SIZE))
  const retentionPageItems = sortedRetention.slice((retentionPage - 1) * PAGE_SIZE, retentionPage * PAGE_SIZE)
  const videosTotalPages = Math.max(1, Math.ceil(recent.length / PAGE_SIZE))
  const videosPageItems = recent.slice((videosPage - 1) * PAGE_SIZE, videosPage * PAGE_SIZE)

  return (
    <div className="p-6 space-y-8">

      {/* ANALİTİK */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Analitik</h2>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label: 'Toplam Video', value: stats.total_videos, icon: <IconVideo />, accent: 'text-gray-300' },
              { label: 'Bugün Yayınlanan', value: stats.published_today, icon: <IconCalendar />, accent: 'text-gray-300' },
              { label: 'Bekleyen Konsept', value: stats.pending_concepts, icon: <IconSparkle />, accent: 'text-gray-300' },
              { label: 'Aktif Kanal', value: `${stats.active_channels} / ${stats.total_channels}`, icon: <IconLayers />, accent: 'text-gray-300' },
            ].map(({ label, value, icon, accent }) => (
              <div key={label} className="relative bg-gray-900 rounded-2xl p-5 pl-6 border border-gray-800 overflow-hidden">
                <span className="absolute left-0 top-5 bottom-5 w-1 rounded-full bg-gray-700" />
                <div className="flex items-center gap-1.5 text-gray-500 mb-2">{icon}<p className="text-xs">{label}</p></div>
                <p className={`text-2xl font-bold ${accent}`}>{value}</p>
              </div>
            ))}
            <div className="relative bg-gray-900 rounded-2xl p-5 pl-6 border border-gray-800 overflow-hidden">
              <span className="absolute left-0 top-5 bottom-5 w-1 rounded-full bg-green-500/60" />
              <div className="flex items-center gap-1.5 text-gray-500 mb-2"><IconWallet /><p className="text-xs">Atlas Cloud Bakiyesi</p></div>
              <p className={`text-2xl font-bold ${atlasBalance?.balance_usd !== null && atlasBalance?.balance_usd !== undefined ? 'text-green-400' : 'text-gray-500'}`}>
                {atlasBalanceLabel}
              </p>
            </div>
            <div className="relative bg-gray-900 rounded-2xl p-5 pl-6 border border-gray-800 overflow-hidden">
              <span className="absolute left-0 top-5 bottom-5 w-1 rounded-full bg-purple-500/60" />
              <div className="flex items-center gap-1.5 text-gray-500 mb-2"><IconTrendUp /><p className="text-xs">BytePlus Harcama</p></div>
              <p className={`text-2xl font-bold ${bytePlusSpend != null ? 'text-purple-300' : 'text-gray-500'}`}>
                {bytePlusSpend != null ? fmtUsd(bytePlusSpend, 2) : '—'}
              </p>
              {bytePlusVideoCount > 0 && (
                <p className="text-[11px] text-gray-500 mt-1">{bytePlusVideoCount} video · token bazlı gerçek maliyet</p>
              )}
            </div>
          </div>
        )}

        {/* VİDEO PERFORMANSI (İZLENME) — takip için öncelikli */}
        {retention.length > 0 && (
          <div className="relative bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <span className="absolute inset-x-0 top-0 h-1 bg-blue-500/60" />
            <div className="p-5 border-b border-gray-800 flex items-center gap-2">
              <IconEye />
              <div>
                <h3 className="font-semibold text-white">Video Performansı (İzlenme Süresi)</h3>
                <p className="text-xs text-gray-500 mt-0.5">YouTube Analytics verisi; yeni yayınlanan videolarda 48-72 saat gecikmeli görünebilir. Shorts videolar otomatik döngüye girdiği için ort. izleme süresi ve % video uzunluğunu aşabilir.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">
                      <button type="button" onClick={() => toggleRetentionSort('title')} className="inline-flex items-center gap-1 justify-start hover:text-gray-200 transition-colors select-none">
                        Video
                        {retentionSortKey === 'title' ? (retentionSortDir === 'asc' ? <IconArrowUp /> : <IconArrowDown />) : <IconArrowUpDown />}
                      </button>
                    </th>
                    <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">
                      <button type="button" onClick={() => toggleRetentionSort('channel_name')} className="inline-flex items-center gap-1 justify-start hover:text-gray-200 transition-colors select-none">
                        Kanal
                        {retentionSortKey === 'channel_name' ? (retentionSortDir === 'asc' ? <IconArrowUp /> : <IconArrowDown />) : <IconArrowUpDown />}
                      </button>
                    </th>
                    <th className="text-right px-5 py-3 text-xs text-gray-400 font-medium">
                      <button type="button" onClick={() => toggleRetentionSort('views')} className="inline-flex items-center gap-1 justify-end hover:text-gray-200 transition-colors select-none">
                        İzlenme
                        {retentionSortKey === 'views' ? (retentionSortDir === 'asc' ? <IconArrowUp /> : <IconArrowDown />) : <IconArrowUpDown />}
                      </button>
                    </th>
                    <th className="text-right px-5 py-3 text-xs text-gray-400 font-medium">
                      <button type="button" onClick={() => toggleRetentionSort('avg_view_duration_sec')} className="inline-flex items-center gap-1 justify-end hover:text-gray-200 transition-colors select-none">
                        Ort. İzleme Süresi
                        {retentionSortKey === 'avg_view_duration_sec' ? (retentionSortDir === 'asc' ? <IconArrowUp /> : <IconArrowDown />) : <IconArrowUpDown />}
                      </button>
                    </th>
                    <th className="text-right px-5 py-3 text-xs text-gray-400 font-medium">
                      <button type="button" onClick={() => toggleRetentionSort('avg_view_percentage')} className="inline-flex items-center gap-1 justify-end hover:text-gray-200 transition-colors select-none">
                        Ort. İzleme %
                        {retentionSortKey === 'avg_view_percentage' ? (retentionSortDir === 'asc' ? <IconArrowUp /> : <IconArrowDown />) : <IconArrowUpDown />}
                      </button>
                    </th>
                    <th className="text-right px-5 py-3 text-xs text-gray-400 font-medium">
                      <button type="button" onClick={() => toggleRetentionSort('published_at')} className="inline-flex items-center gap-1 justify-end hover:text-gray-200 transition-colors select-none">
                        Yayın Tarihi
                        {retentionSortKey === 'published_at' ? (retentionSortDir === 'asc' ? <IconArrowUp /> : <IconArrowDown />) : <IconArrowUpDown />}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {retentionPageItems.map(r => (
                    <tr key={r.content_item_id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 font-medium text-white max-w-xs truncate">
                        <a href={`https://youtube.com/watch?v=${r.youtube_video_id}`} target="_blank" rel="noreferrer" className="hover:underline">
                          {r.title}
                        </a>
                      </td>
                      <td className="px-5 py-3 text-gray-400">{r.channel_name}</td>
                      <td className="px-5 py-3 text-right text-gray-300">{Number(r.views || 0).toLocaleString('tr-TR')}</td>
                      <td className="px-5 py-3 text-right text-gray-300">
                        {r.avg_view_duration_sec != null ? `${Math.round(Number(r.avg_view_duration_sec))}sn` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-300">
                        {r.avg_view_percentage != null ? `%${Number(r.avg_view_percentage).toFixed(1)}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-500">
                        {r.published_at ? new Date(r.published_at).toLocaleDateString('tr-TR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={retentionPage} totalPages={retentionTotalPages} onChange={setRetentionPage} />
          </div>
        )}

        {/* SON VİDEOLAR — varsayılan kapalı, tıklayınca açılır */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800">
          <button
            type="button"
            onClick={() => setVideosOpen(o => !o)}
            className="w-full p-5 flex items-center justify-between gap-2 text-left hover:bg-white/[0.02] transition-colors rounded-2xl"
          >
            <div className="flex items-center gap-2">
              <IconVideo /><h3 className="font-semibold text-white">Son Videolar</h3>
              <span className="text-xs text-gray-500">({recent.length})</span>
            </div>
            <span className={`text-gray-500 transition-transform duration-200 ${videosOpen ? 'rotate-180' : ''}`}><IconChevronDown /></span>
          </button>
          {videosOpen && (
            recent.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm border-t border-gray-800">Henüz video yok.</div>
            ) : (
              <>
              <div className="divide-y divide-gray-800 border-t border-gray-800">
                {videosPageItems.map(v => (
                  <div key={v.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{v.title}</p>
                      <p className="text-xs text-gray-500">
                        {v.channel_name} · {v.published_at ? new Date(v.published_at).toLocaleDateString('tr-TR') : '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400">{fmtUsd(v.cost_usd, 3)}</span>
                        {v.cost_usd != null && (
                          v.cost_estimated === false ? (
                            <span title="Gerçek token tüketiminden ölçülen maliyet" className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-300">gerçek</span>
                          ) : (
                            <span title="Model fiyatı × süre üzerinden tahmini maliyet" className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300">tahmini</span>
                          )
                        )}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[v.status] || 'bg-gray-700 text-gray-400'}`}>
                        {statusLabel[v.status] || v.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination page={videosPage} totalPages={videosTotalPages} onChange={setVideosPage} />
              </>
            )
          )}
        </div>
      </div>

      {/* MALİYET */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Maliyet</h2>

        {Object.keys(currencyTotals).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(currencyTotals).map(([cur, total]) => (
              <div key={cur} className="relative bg-gray-900 rounded-2xl p-4 pl-5 border border-gray-800 overflow-hidden">
                <span className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-red-500/50" />
                <p className="text-xs text-gray-400 mb-1">Toplam Gider ({cur})</p>
                <p className="text-xl font-bold text-red-400">{fmtAmount(total, cur)}</p>
              </div>
            ))}
          </div>
        )}

        {channelCosts.length > 0 && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800">
            <div className="p-5 border-b border-gray-800 flex items-center gap-2">
              <IconLayers /><h3 className="font-semibold text-white">Kanal Bazlı Maliyet</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Kanal</th>
                    <th className="text-right px-5 py-3 text-xs text-gray-400 font-medium">AI Maliyet</th>
                    <th className="text-right px-5 py-3 text-xs text-gray-400 font-medium">Manuel Gider</th>
                    <th className="text-right px-5 py-3 text-xs text-gray-400 font-medium">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {channelCosts.map((c) => (
                    <tr key={c.channel_id || c.channel_name} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 font-medium text-white">{c.channel_name}</td>
                      <td className="px-5 py-3 text-right text-gray-400">{fmt(c.estimated_cost)}</td>
                      <td className="px-5 py-3 text-right text-gray-400">{fmt(c.manual_total)}</td>
                      <td className={`px-5 py-3 text-right font-semibold ${Number(c.total || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {fmt(c.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-gray-900 rounded-2xl border border-gray-800">
          <div className="p-5 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2"><IconWallet /><h3 className="font-semibold text-white">Manuel Giderler</h3></div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
              <IconPlus /> Manuel Gider Ekle
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="p-5 border-b border-gray-800 bg-gray-800/50 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-gray-400 block mb-1">Açıklama *</label>
                <input required value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Gider açıklaması" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Tutar *</label>
                <input required type="number" step="0.01" min="0" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Para Birimi *</label>
                <select value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Tarih *</label>
                <input required type="date" value={form.expense_date}
                  onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Kanal</label>
                <select value={form.channel_id}
                  onChange={e => setForm(f => ({ ...f, channel_id: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Genel Gider</option>
                  {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Kategori</label>
                <input value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="sunucu, yazılım, reklam…" />
              </div>
              <div className="col-span-2 flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors">
                  İptal
                </button>
                <button type="submit" disabled={submitting}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {submitting ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
              </div>
            </form>
          )}

          {manualExpenses.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">Henüz manuel gider yok.</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {manualExpenses.map(exp => (
                <div key={exp.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{exp.description}</p>
                    <p className="text-xs text-gray-500">
                      {exp.channel_name_snapshot || 'Genel Gider'}
                      {exp.category ? ` · ${exp.category}` : ''}
                      {' · '}{new Date(exp.expense_date).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-red-400">{fmtAmount(exp.amount, exp.currency)}</span>
                    <button onClick={() => handleDelete(exp.id)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors">
                      <IconTrash /> Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* VİDEO ÜRETİM MALİYETİ — sayfanın en altında */}
        {videoCosts && (
          <div className="relative bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <span className="absolute inset-x-0 top-0 h-1 bg-red-500/50" />
            <div className="p-5 border-b border-gray-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2"><IconBarChart /><h3 className="font-semibold text-white">Video Üretim Maliyeti</h3></div>
              <span className="text-sm text-gray-400 text-right">
                Toplam: <span className="text-white font-semibold">{fmtUsd(videoCosts.total_usd)}</span>
                {' '}<span className="text-gray-500">({videoCosts.video_count} video)</span>
                {typeof videoCosts.real_count === 'number' && (
                  <span className="block text-xs text-gray-500 mt-0.5">
                    <span className="text-green-400">{videoCosts.real_count} gerçek</span>
                    {' · '}
                    <span className="text-yellow-400">{videoCosts.video_count - videoCosts.real_count} tahmini</span>
                  </span>
                )}
              </span>
            </div>
            {videoCosts.by_provider && videoCosts.by_provider.length > 0 && (
              <div className="px-5 py-3 border-b border-gray-800 flex flex-wrap gap-3">
                {videoCosts.by_provider.map(p => {
                  const meta = providerMeta(p.provider)
                  return (
                    <div key={p.provider} className={`rounded-xl px-3 py-2 text-xs flex items-center gap-2 border ${meta.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      <span className="text-gray-400">{meta.label}:</span>
                      <span className={`font-semibold ${meta.text}`}>{fmtUsd(p.total_usd, 2)}</span>
                      <span className="text-gray-500">({p.video_count} video)</span>
                    </div>
                  )
                })}
              </div>
            )}
            {videoCosts.monthly.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">Henüz maliyet verisi yok.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Ay</th>
                      <th className="text-right px-5 py-3 text-xs text-gray-400 font-medium">Video Sayısı</th>
                      <th className="text-right px-5 py-3 text-xs text-gray-400 font-medium">Toplam Maliyet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {videoCosts.monthly.slice().reverse().map(m => (
                      <tr key={m.month}>
                        <td className="px-5 py-3 font-medium text-white">{m.month}</td>
                        <td className="px-5 py-3 text-right text-gray-400">{m.video_count}</td>
                        <td className="px-5 py-3 text-right font-semibold text-red-400">{fmtUsd(m.total_usd, 2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
