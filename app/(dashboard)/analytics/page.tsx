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

interface VideoCostSummary {
  total_usd: number | null; video_count: number; real_count?: number; monthly: VideoCostMonth[];
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

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [atlasBalance, setAtlasBalance] = useState<AtlasBalance | null>(null)
  const [recent, setRecent] = useState<VideoRow[]>([])
  const [videoCosts, setVideoCosts] = useState<VideoCostSummary | null>(null)
  const [channelCosts, setChannelCosts] = useState<ChannelCost[]>([])
  const [manualExpenses, setManualExpenses] = useState<ManualExpense[]>([])
  const [channels, setChannels] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    description: '', amount: '',
    expense_date: new Date().toISOString().slice(0, 10),
    channel_id: '', category: '', currency: 'TRY',
  })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [s, ab, v, vc, summary, manual, ch] = await Promise.all([
        api.get<Stats>('/analytics/summary'),
        api.get<AtlasBalance>('/analytics/atlas-balance').catch(() => null),
        api.get<VideoRow[]>('/analytics/recent-videos'),
        api.get<VideoCostSummary>('/analytics/video-costs').catch(() => null),
        api.get<any>('/costs/summary').catch(() => null),
        api.get<ManualExpense[]>('/costs/manual').catch(() => []),
        api.get<any[]>('/channels').catch(() => []),
      ])
      setStats(s)
      setAtlasBalance(ab)
      setRecent(v)
      setVideoCosts(vc)
      if (summary?.channels) setChannelCosts(summary.channels)
      setManualExpenses(manual || [])
      setChannels((ch || []).map((c: any) => ({ id: c.id, name: c.name || c.channel_name || c.id })))
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

  return (
    <div className="p-6 space-y-8">

      {/* ANALİTİK */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Analitik</h2>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Toplam Video', value: stats.total_videos },
              { label: 'Bugün Yayınlanan', value: stats.published_today },
              { label: 'Bekleyen Konsept', value: stats.pending_concepts },
              { label: 'Aktif Kanal', value: `${stats.active_channels} / ${stats.total_channels}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            ))}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <p className="text-xs text-gray-400 mb-1">Atlas Cloud Bakiyesi</p>
              <p className={`text-2xl font-bold ${atlasBalance?.balance_usd !== null && atlasBalance?.balance_usd !== undefined ? 'text-green-400' : 'text-gray-500'}`}>
                {atlasBalanceLabel}
              </p>
            </div>
          </div>
        )}

        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="p-5 border-b border-gray-800">
            <h3 className="font-semibold text-white">Son Videolar</h3>
          </div>
          {recent.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">Henüz video yok.</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {recent.map(v => (
                <div key={v.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{v.title}</p>
                    <p className="text-xs text-gray-500">
                      {v.channel_name} · {v.published_at ? new Date(v.published_at).toLocaleDateString('tr-TR') : '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">{fmtUsd(v.cost_usd, 3)}</span>
                      {v.cost_usd != null && (
                        v.cost_estimated === false ? (
                          <span title="Atlas Cloud bakiye farkından ölçülen gerçek maliyet" className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-300">gerçek</span>
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
          )}
        </div>

        {/* VİDEO ÜRETİM MALİYETİ */}
        {videoCosts && (
          <div className="bg-gray-900 rounded-xl border border-gray-800">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-semibold text-white">Video Üretim Maliyeti</h3>
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
                        <td className="px-5 py-3 text-right font-semibold text-red-400">{fmtUsd(m.total_usd, 4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MALİYET */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Maliyet</h2>

        {Object.keys(currencyTotals).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(currencyTotals).map(([cur, total]) => (
              <div key={cur} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-xs text-gray-400 mb-1">Toplam Gider ({cur})</p>
                <p className="text-xl font-bold text-red-400">{fmtAmount(total, cur)}</p>
              </div>
            ))}
          </div>
        )}

        {channelCosts.length > 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800">
            <div className="p-5 border-b border-gray-800">
              <h3 className="font-semibold text-white">Kanal Bazlı Maliyet</h3>
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
                    <tr key={c.channel_id || c.channel_name}>
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

        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="p-5 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-semibold text-white">Manuel Giderler</h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
              + Manuel Gider Ekle
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
                <div key={exp.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{exp.description}</p>
                    <p className="text-xs text-gray-500">
                      {exp.channel_name_snapshot || 'Genel Gider'}
                      {exp.category ? ` · ${exp.category}` : ''}
                      {' · '}{new Date(exp.expense_date).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-red-400">{fmtAmount(exp.amount, exp.currency)}</span>
                    <button onClick={() => handleDelete(exp.id)}
                      className="text-xs text-gray-500 hover:text-red-400 transition-colors">Sil</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
