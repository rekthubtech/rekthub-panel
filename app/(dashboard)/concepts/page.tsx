'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Suggestion {
  id: string
  channel_id: string | null
  suggested_name: string
  suggested_prompt: string | null
  rationale: string | null
  status: string
  created_at: string
}

interface Channel {
  id: string
  name: string
}

export default function ConceptsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    suggested_name: '',
    suggested_prompt: '',
    rationale: '',
    channel_id: '',
  })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [sugg, ch] = await Promise.all([
        api.get<Suggestion[]>('/concepts/suggestions'),
        api.get<Channel[]>('/channels').catch(() => []),
      ])
      setSuggestions(sugg)
      setChannels(ch || [])
    } finally { setLoading(false) }
  }

  async function updateStatus(id: string, status: string) {
    await api.patch(`/concepts/suggestions/${id}`, { status })
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/concepts/suggestions', {
        suggested_name: form.suggested_name,
        suggested_prompt: form.suggested_prompt || null,
        rationale: form.rationale || null,
        channel_id: form.channel_id || null,
      })
      setForm({ suggested_name: '', suggested_prompt: '', rationale: '', channel_id: '' })
      setShowForm(false)
      fetchData()
    } finally { setSubmitting(false) }
  }

  const channelName = (id: string | null) =>
    id ? (channels.find(c => c.id === id)?.name || id) : 'Genel'

  const statuses = ['all', 'pending', 'approved', 'rejected']
  const filtered = filter === 'all' ? suggestions : suggestions.filter(s => s.status === filter)

  const statusLabel: Record<string, string> = {
    pending: 'Bekliyor',
    approved: 'Onaylandı',
    rejected: 'Reddedildi',
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }

  if (loading) return <div className="p-8 text-center">Yükleniyor…</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Konseptler</h2>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {statuses.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium ${filter === s ? 'bg-gray-800 text-white' : 'bg-white border text-gray-600'}`}>
                {s === 'all' ? 'Tümü' : statusLabel[s]}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            + Yeni Konsept
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <h3 className="font-semibold mb-4">Yeni Konsept Önerisi</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Başlık *</label>
              <input required value={form.suggested_name}
                onChange={e => setForm(f => ({ ...f, suggested_name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Video konsept başlığı" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Prompt / Açıklama</label>
              <textarea value={form.suggested_prompt}
                onChange={e => setForm(f => ({ ...f, suggested_prompt: e.target.value }))}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Video için kullanılacak AI prompt veya içerik açıklaması…" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Kanal</label>
              <select value={form.channel_id}
                onChange={e => setForm(f => ({ ...f, channel_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                <option value="">Genel</option>
                {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Gerekçe</label>
              <input value={form.rationale}
                onChange={e => setForm(f => ({ ...f, rationale: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Neden bu konsept? (opsiyonel)" />
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
          </div>
        </form>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <p className="text-gray-500 mb-3">Konsept bulunamadı.</p>
          <button onClick={() => setShowForm(true)}
            className="text-sm text-blue-600 hover:underline">
            İlk konsepti ekle →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <div key={s.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold">{s.suggested_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[s.status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabel[s.status] || s.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    {channelName(s.channel_id)} · {new Date(s.created_at).toLocaleDateString('tr-TR')}
                  </p>
                  {s.suggested_prompt && (
                    <p className="text-sm text-gray-600 line-clamp-2">{s.suggested_prompt}</p>
                  )}
                  {s.rationale && (
                    <p className="text-xs text-gray-400 mt-1 italic">{s.rationale}</p>
                  )}
                </div>
                <div className="ml-4">
                  <select value={s.status} onChange={e => updateStatus(s.id, e.target.value)}
                    className="text-xs border rounded-lg px-2 py-1.5">
                    {['pending', 'approved', 'rejected'].map(st => (
                      <option key={st} value={st}>{statusLabel[st]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
