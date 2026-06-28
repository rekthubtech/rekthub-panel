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
interface ChannelCost {
  channel_id: string; channel_name: string;
  estimated_cost: number; manual_total: number; total: number;
}
interface ManualExpense {
  id: string; description: string; amount: number;
  expense_date: string; channel_name_snapshot?: string; category?: string;
}

const cardCls = 'bg-gray-800 rounded-xl border border-gray-700 shadow-sm'
const inputCls = 'w-full border border-gray-600 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<VideoRow[]>([])
  const [channelCosts, setChannelCosts] = useState<ChannelCost[]>([])
  const [manualExpenses, setManualExpenses] = useState<ManualExpense[]>([])
  const [channels, setChannels] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    description: '', amount: '',
    expense_date: new Date().toISOString().slice(0, 10),
    channel_id: '', category: '',
  })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [s, v, summary, manual, ch] = await Promise.all([
        api.get<Stats>('/analytics/summary'),
        api.get<VideoRow[]>('/analytics/recent-videos'),
        api.get<any>('/costs/summary').catch(() => null),
        api.get<ManualExpense[]>('/costs/manual').catch(() => []),
        api.get<any[]>('/channels').catch(() => []),
      ])
      setStats(s)
      setRecent(v)
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
      })
      setForm({ description: '', amount: '', expense_date: new Date().toISOString().slice(0, 10), channel_id: '', category: '' })
      setShowForm(false)
      fetchData()
    } finally { setSubmitting(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu gideri silmek istiyor musunuz?')) return
    await api.delete(`/costs/manual/${id}`)
    fetchData()
  }

  const statusLabel: Record<string, string> = {
    pending: 'Bekliyor', running: 'Calisiyor', completed: 'Tamamlandi',
    processing: 'Isleniyor', done: 'Tamamlandi', failed: 'Basarisiz',
  }
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-900/40 text-yellow-400',
    running: 'bg-blue-900/40 text-blue-400',
    processing: 'bg-blue-900/40 text-blue-400',
    completed: 'bg-green-900/40 text-green-400',
    done: 'bg-green-900/40 text-green-400',
    failed: 'bg-red-900/40 text-red-400',
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Yukleniyor...</div>

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-white">Maliyet & Analitik</h2>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Toplam Video', value: stats.total_videos },
            { label: 'Bugun Yayinlanan', value: stats.published_today },
            { label: 'Bekleyen Konsept', value: stats.pending_concepts },
            { label: 'Aktif Kanal', value: `${stats.active_channels} / ${stats.total_channels}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {channelCosts.length > 0 && (
        <div className={cardCls}>
          <div className="p-5 border-b border-gray-700">
            <h3 className="font-semibold text-white">Kanal Bazli Maliyet</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Kanal</th>
                  <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium">AI Maliyet</th>
                  <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium">Manuel Gider</th>
                  <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium">Toplam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {channelCosts.map((c) => (
                  <tr key={c.channel_id || c.channel_name}>
                    <td className="px-5 py-3 font-medium text-gray-200">{c.channel_name}</td>
                    <td className="px-5 py-3 text-right text-gray-400">${Number(c.estimated_cost || 0).toFixed(4)}</td>
                    <td className="px-5 py-3 text-right text-gray-400">${Number(c.manual_total || 0).toFixed(4)}</td>
                    <td className={`px-5 py-3 text-right font-semibold ${Number(c.total || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      ${Number(c.total || 0).toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className={cardCls}>
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-white">Manuel Giderler</h3>
          <button onClick={() => setShowForm(!showForm)}
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
            + Manuel Gider Ekle
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="p-5 border-b border-gray-700 bg-gray-900 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Aciklama *</label>
              <input required value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className={inputCls} placeholder="Gider aciklamasi" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Tutar ($) *</label>
              <input required type="number" step="0.0001" min="0" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className={inputCls} placeholder="0.0000" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Tarih *</label>
              <input required type="date" value={form.expense_date}
                onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Kanal</label>
              <select value={form.channel_id}
                onChange={e => setForm(f => ({ ...f, channel_id: e.target.value }))}
                className={inputCls}>
                <option value="">Genel Gider</option>
                {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Kategori</label>
              <input value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className={inputCls} placeholder="sunucu, yazilim, reklam..." />
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="text-sm px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors">Iptal</button>
              <button type="submit" disabled={submitting}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {submitting ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        )}

        {manualExpenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">Henuz manuel gider yok.</div>
        ) : (
          <div className="divide-y divide-gray-700">
            {manualExpenses.map(exp => (
              <div key={exp.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-200">{exp.description}</p>
                  <p className="text-xs text-gray-500">
                    {exp.channel_name_snapshot || 'Genel Gider'}
                    {exp.category ? ` · ${exp.category}` : ''}
                    {' · '}{new Date(exp.expense_date).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-red-400">${Number(exp.amount).toFixed(4)}</span>
                  <button onClick={() => handleDelete(exp.id)}
                    className="text-xs text-gray-500 hover:text-red-400 transition-colors">Sil</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={cardCls}>
        <div className="p-5 border-b border-gray-700">
          <h3 className="font-semibold text-white">Son Videolar</h3>
        </div>
        {recent.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">Henuz video yok.</div>
        ) : (
          <div className="divide-y divide-gray-700">
            {recent.map(v => (
              <div key={v.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-200">{v.title}</p>
                  <p className="text-xs text-gray-500">
                    {v.channel_name} · {v.published_at ? new Date(v.published_at).toLocaleDateString('tr-TR') : '-'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[v.status] || 'bg-gray-700 text-gray-400'}`}>
                  {statusLabel[v.status] || v.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
              }'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Stats {
  total_videos: number; published_today: number; pending_concepts: number;
  active_channels: number; total_channels: number;
}

interface VideoRow {
  id: number; title: string; channel_name: string; status: string; published_at: string;
}

interface ChannelCost {
  channel_id: string; channel_name: string;
  estimated_cost: number; manual_total: number; total: number;
}

interface ManualExpense {
  id: string; description: string; amount: number;
  expense_date: string; channel_name_snapshot?: string; category?: string;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<VideoRow[]>([])
  const [channelCosts, setChannelCosts] = useState<ChannelCost[]>([])
  const [manualExpenses, setManualExpenses] = useState<ManualExpense[]>([])
  const [channels, setChannels] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    description: '', amount: '',
    expense_date: new Date().toISOString().slice(0, 10),
    channel_id: '', category: '',
  })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [s, v, summary, manual, ch] = await Promise.all([
        api.get<Stats>('/analytics/summary'),
        api.get<VideoRow[]>('/analytics/recent-videos'),
        api.get<any>('/costs/summary').catch(() => null),
        api.get<ManualExpense[]>('/costs/manual').catch(() => []),
        api.get<any[]>('/channels').catch(() => []),
      ])
      setStats(s)
      setRecent(v)
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
      })
      setForm({ description: '', amount: '', expense_date: new Date().toISOString().slice(0, 10), channel_id: '', category: '' })
      setShowForm(false)
      fetchData()
    } finally { setSubmitting(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu gideri silmek istiyor musunuz?')) return
    await api.delete(`/costs/manual/${id}`)
    fetchData()
  }

  const statusLabel: Record<string, string> = {
    pending: 'Bekliyor', running: 'Çalışıyor', completed: 'Tamamlandı',
    processing: 'İşleniyor', done: 'Tamamlandı', failed: 'Başarısız',
  }
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    running: 'bg-blue-100 text-blue-700',
    processing: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    done: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  }

  if (loading) return <div className="p-8 text-center">Yükleniyor…</div>

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Maliyet & Analitik</h2>

      {/* İstatistik Kartları */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* Kanal Bazlı Maliyet Tablosu */}
      {channelCosts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold">Kanal Bazlı Maliyet</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Kanal</th>
                  <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium">AI Maliyet</th>
                  <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium">Manuel Gider</th>
                  <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium">Toplam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {channelCosts.map((c) => (
                  <tr key={c.channel_id || c.channel_name}>
                    <td className="px-5 py-3 font-medium">{c.channel_name}</td>
                    <td className="px-5 py-3 text-right text-gray-600">${Number(c.estimated_cost || 0).toFixed(4)}</td>
                    <td className="px-5 py-3 text-right text-gray-600">${Number(c.manual_total || 0).toFixed(4)}</td>
                    <td className={`px-5 py-3 text-right font-semibold ${Number(c.total || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${Number(c.total || 0).toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manuel Giderler */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold">Manuel Giderler</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Manuel Gider Ekle
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="p-5 border-b border-gray-100 bg-gray-50 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Açıklama *</label>
              <input required value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Gider açıklaması" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Tutar ($) *</label>
              <input required type="number" step="0.0001" min="0" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="0.0000" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Tarih *</label>
              <input required type="date" value={form.expense_date}
                onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Kanal</label>
              <select value={form.channel_id}
                onChange={e => setForm(f => ({ ...f, channel_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                <option value="">Genel Gider</option>
                {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Kategori</label>
              <input value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="sunucu, yazılım, reklam…" />
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
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
          <div className="divide-y divide-gray-50">
            {manualExpenses.map(exp => (
              <div key={exp.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{exp.description}</p>
                  <p className="text-xs text-gray-400">
                    {exp.channel_name_snapshot || 'Genel Gider'}
                    {exp.category ? ` · ${exp.category}` : ''}
                    {' · '}{new Date(exp.expense_date).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-red-600">${Number(exp.amount).toFixed(4)}</span>
                  <button onClick={() => handleDelete(exp.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors">Sil</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Son Videolar */}
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
                  <p className="text-xs text-gray-400">
                    {v.channel_name} · {v.published_at ? new Date(v.published_at).toLocaleDateString('tr-TR') : '—'}
                  </p>
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
