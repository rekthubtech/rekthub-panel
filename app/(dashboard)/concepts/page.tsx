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
  used?: boolean
  youtube_video_id?: string | null
  content_status?: string | null
}

interface Channel {
  id: string
  name: string
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Bekliyor',
  approved: 'Onaylandi',
  rejected: 'Reddedildi',
  testing: 'Test Ediliyor',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300',
  approved: 'bg-green-500/20 text-green-300',
  rejected: 'bg-red-500/20 text-red-300',
  testing: 'bg-purple-500/20 text-purple-300',
}

const STATUS_BORDER: Record<string, string> = {
  pending: 'border-l-yellow-500',
  approved: 'border-l-green-500',
  rejected: 'border-l-red-500',
  testing: 'border-l-purple-500',
}

export default function ConceptsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedChannel, setSelectedChannel] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selected, setSelected] = useState<Suggestion | null>(null)
  const [editForm, setEditForm] = useState({ suggested_name: '', suggested_prompt: '', rationale: '', channel_id: '', status: 'pending' })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ suggested_name: '', suggested_prompt: '', rationale: '', channel_id: '', status: 'pending' })
  const [reorderingId, setReorderingId] = useState<string | null>(null)

  const [showBulkForm, setShowBulkForm] = useState(false)
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [bulkChannelId, setBulkChannelId] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [bulkResult, setBulkResult] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [selectedChannel])

  useEffect(() => {
    setForm(f => ({ ...f, channel_id: selectedChannel }))
    setBulkChannelId(selectedChannel)
  }, [selectedChannel])

  async function fetchData() {
    setLoading(true)
    try {
      const query = selectedChannel ? `?channelId=${selectedChannel}` : ''
      const [sugg, ch] = await Promise.all([
        api.get<Suggestion[]>(`/concepts/suggestions${query}`),
        api.get<Channel[]>('/channels').catch(() => []),
      ])
      // En eski -> en yeni sirala (siranin kendisi yayinlanma sirasini yansitir)
      const sorted = [...sugg].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      setSuggestions(sorted)
      setChannels(ch || [])
    } finally { setLoading(false) }
  }

  function openDetail(s: Suggestion) {
    setSelected(s)
    setEditForm({
      suggested_name: s.suggested_name,
      suggested_prompt: s.suggested_prompt || '',
      rationale: s.rationale || '',
      channel_id: s.channel_id || '',
      status: s.status,
    })
  }

  function closeDetail() {
    setSelected(null)
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    try {
      await api.patch(`/concepts/suggestions/${selected.id}`, {
        suggested_name: editForm.suggested_name,
        suggested_prompt: editForm.suggested_prompt || null,
        rationale: editForm.rationale || null,
        channel_id: editForm.channel_id || null,
        status: editForm.status,
      })
      setSuggestions(prev => prev.map(s => s.id === selected.id ? {
        ...s,
        suggested_name: editForm.suggested_name,
        suggested_prompt: editForm.suggested_prompt || null,
        rationale: editForm.rationale || null,
        channel_id: editForm.channel_id || null,
        status: editForm.status,
      } : s))
      closeDetail()
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!selected) return
    if (!confirm('Bu konsepti silmek istiyor musunuz?')) return
    await api.delete(`/concepts/suggestions/${selected.id}`)
    setSuggestions(prev => prev.filter(s => s.id !== selected.id))
    closeDetail()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        suggested_name: form.suggested_name,
        suggested_prompt: form.suggested_prompt || null,
        rationale: form.rationale || null,
        status: form.status,
      }
      if (form.channel_id) body.channel_id = form.channel_id
      await api.post('/concepts/suggestions', body)
      setForm({ suggested_name: '', suggested_prompt: '', rationale: '', channel_id: selectedChannel, status: form.status })
      setShowForm(false)
      fetchData()
    } finally { setSubmitting(false) }
  }

  const bulkLines = bulkText.split('\n').map(l => l.trim()).filter(Boolean)

  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!bulkChannelId || bulkLines.length === 0) return
    setBulkSubmitting(true)
    setBulkResult(null)
    try {
      const res = await api.post<{ success: boolean; created: number }>('/concepts/suggestions/bulk', {
        channel_id: bulkChannelId,
        prompts: bulkLines,
      })
      setBulkResult(`${res.created} konsept eklendi ve onaylandi.`)
      setBulkText('')
      fetchData()
    } catch {
      setBulkResult('Hata olustu, tekrar deneyin.')
    } finally { setBulkSubmitting(false) }
  }

  // Ayni kanal + durum + kullanilma durumundaki kardesler.
  // Kullanilmis (yayinlanmis) ve kullanilmamis konseptler ayri kuyruklar olarak sayilir;
  // aksi halde sira numaralari (orn. "20/39") kafa karistirici olur çünkü zaten
  // yayinlanmis videolar henuz yayinlanmamis kuyruga karisiyordu.
  function siblingsOf(s: Suggestion) {
    return suggestions
      .filter(x => x.channel_id === s.channel_id && x.status === s.status && x.used === s.used)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }

  async function handleReorder(s: Suggestion, direction: 'up' | 'down', e: React.MouseEvent) {
    e.stopPropagation()
    if (reorderingId) return
    setReorderingId(s.id)
    try {
      await api.post(`/concepts/suggestions/${s.id}/reorder`, { direction })
      await fetchData()
    } finally {
      setReorderingId(null)
    }
  }

  async function handleMoveToTop(s: Suggestion, e: React.MouseEvent) {
    e.stopPropagation()
    if (reorderingId) return
    const sibs = siblingsOf(s)
    if (sibs.length < 2 || sibs[0].id === s.id) return
    setReorderingId(s.id)
    try {
      const ids = [s.id, ...sibs.filter(x => x.id !== s.id).map(x => x.id)]
      await api.post('/concepts/suggestions/reorder-batch', { ids })
      await fetchData()
    } finally {
      setReorderingId(null)
    }
  }

  async function handleMoveToBottom(s: Suggestion, e: React.MouseEvent) {
    e.stopPropagation()
    if (reorderingId) return
    const sibs = siblingsOf(s)
    if (sibs.length < 2 || sibs[sibs.length - 1].id === s.id) return
    setReorderingId(s.id)
    try {
      const ids = [...sibs.filter(x => x.id !== s.id).map(x => x.id), s.id]
      await api.post('/concepts/suggestions/reorder-batch', { ids })
      await fetchData()
    } finally {
      setReorderingId(null)
    }
  }

  const channelName = (id: string | null) =>
    id ? (channels.find(c => c.id === id)?.name || id) : 'Genel'

  const statuses = ['all', 'pending', 'approved', 'rejected', 'testing', 'used']
  const filtered = filter === 'all'
    ? suggestions
    : filter === 'used'
      ? suggestions.filter(s => s.used)
      : filter === 'approved'
        ? suggestions.filter(s => s.status === 'approved' && !s.used)
        : suggestions.filter(s => s.status === filter)

  const searched = search.trim()
    ? filtered.filter(s =>
      s.suggested_name.toLowerCase().includes(search.trim().toLowerCase()) ||
      (s.suggested_prompt || '').toLowerCase().includes(search.trim().toLowerCase()))
    : filtered

  const counts: Record<string, number> = {
    all: suggestions.length,
    pending: suggestions.filter(s => s.status === 'pending').length,
    approved: suggestions.filter(s => s.status === 'approved' && !s.used).length,
    rejected: suggestions.filter(s => s.status === 'rejected').length,
    testing: suggestions.filter(s => s.status === 'testing').length,
    used: suggestions.filter(s => s.used).length,
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Yukleniyor...</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-bold text-white">Konseptler</h2>
          <span className="text-sm text-gray-500">Toplam: {counts.all}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowBulkForm(!showBulkForm); setShowForm(false) }}
            className="text-sm bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium">
            + Toplu Ekle
          </button>
          <button onClick={() => { setShowForm(!showForm); setShowBulkForm(false) }}
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            + Yeni Konsept
          </button>
        </div>
      </div>

      <div className="sticky top-0 z-10 bg-[#0a0e17]/95 backdrop-blur-sm pt-1 pb-3 -mx-6 px-6 mb-3 border-b border-gray-800/60">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Kanal:</label>
            <select value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tum Kanallar</option>
              {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2 flex-wrap">
            {statuses.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${filter === s ? (s === 'used' ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white') : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700'}`}>
                {(s === 'all' ? 'Tumu' : s === 'used' ? 'Kullanildi' : STATUS_LABEL[s])} ({counts[s]})
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[180px] flex items-center gap-2 ml-auto">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Konsept ara..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-xs text-gray-500 hover:text-white shrink-0">
                Temizle
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-600">
          {search ? `${searched.length} sonuc bulundu` : `${searched.length} konsept listeleniyor`}
        </p>
      </div>

      {showBulkForm && (
        <form onSubmit={handleBulkSubmit} className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-6">
          <h3 className="font-semibold mb-1 text-white">Toplu Prompt Ekle</h3>
          <p className="text-xs text-gray-500 mb-4">Her satira bir prompt yazin. Hepsi secilen kanala atanir ve dogrudan &quot;Onaylandi&quot; olarak eklenir, tek tek onay gerekmez.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs text-gray-400 block mb-1">Kanal *</label>
              <select required value={bulkChannelId}
                onChange={e => setBulkChannelId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Kanal secin</option>
                {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Promptlar (satir basina bir tane)</label>
              <textarea value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                rows={10}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={'Ilk prompt...\nIkinci prompt...\nUcuncu prompt...'} />
            </div>
            <div className="col-span-2 flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs text-gray-500">
                {bulkLines.length > 0 ? `${bulkLines.length} prompt algilandi` : ''}
                {bulkResult && <span className="ml-2 text-green-400 font-medium">{bulkResult}</span>}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowBulkForm(false); setBulkResult(null) }}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors">
                  Iptal
                </button>
                <button type="submit" disabled={bulkSubmitting || !bulkChannelId || bulkLines.length === 0}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {bulkSubmitting ? 'Ekleniyor...' : `Toplu Ekle (${bulkLines.length})`}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-6">
          <h3 className="font-semibold mb-4 text-white">Yeni Konsept Onerisi</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Baslik *</label>
              <input required value={form.suggested_name}
                onChange={e => setForm(f => ({ ...f, suggested_name: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Video konsept basligi" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Prompt / Aciklama</label>
              <textarea value={form.suggested_prompt}
                onChange={e => setForm(f => ({ ...f, suggested_prompt: e.target.value }))}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Video icin kullanilacak AI prompt..." />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Kanal</label>
              <select value={form.channel_id}
                onChange={e => setForm(f => ({ ...f, channel_id: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Genel</option>
                {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Durum</label>
              <select value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="pending">Bekliyor</option>
                <option value="approved">Onaylandi</option>
                <option value="rejected">Reddedildi</option>
                <option value="testing">Test Ediliyor</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Gerekce</label>
              <input value={form.rationale}
                onChange={e => setForm(f => ({ ...f, rationale: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Neden bu konsept? (opsiyonel)" />
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="text-sm px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors">
                Iptal
              </button>
              <button type="submit" disabled={submitting}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {submitting ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </form>
      )}

      {searched.length === 0 ? (
        <div className="bg-gray-900 rounded-xl p-12 text-center border border-gray-800">
          <p className="text-gray-500 mb-3">{search ? 'Aramanizla eslesen konsept bulunamadi.' : 'Konsept bulunamadi.'}</p>
          {!search && (
            <button onClick={() => setShowForm(true)} className="text-sm text-blue-400 hover:underline">
              Ilk konsepti ekle
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {searched.map((s) => {
            const sibs = siblingsOf(s)
            const sibIdx = sibs.findIndex(x => x.id === s.id)
            const isFirst = sibIdx <= 0
            const isLast = sibIdx === sibs.length - 1
            const isBusy = reorderingId === s.id
            return (
              <div key={s.id}
                onClick={() => openDetail(s)}
                className={`bg-gray-900 rounded-xl p-5 border border-gray-800 border-l-4 ${s.used ? 'border-l-blue-500' : (STATUS_BORDER[s.status] || 'border-l-gray-600')} cursor-pointer hover:border-blue-500/50 hover:bg-gray-800/80 transition-all ${isBusy ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col items-center gap-0.5 mr-4 shrink-0">
                    <button
                      onClick={(e) => handleMoveToTop(s, e)}
                      disabled={isFirst || isBusy}
                      title="En uste tasi"
                      className="w-6 h-6 flex items-center justify-center rounded bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[10px]">
                      &#9195;
                    </button>
                    <button
                      onClick={(e) => handleReorder(s, 'up', e)}
                      disabled={isFirst || isBusy}
                      title="Yukari tasi"
                      className="w-6 h-6 flex items-center justify-center rounded bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs">
                      &#9650;
                    </button>
                    <span className="text-[10px] text-gray-600 tabular-nums leading-tight py-0.5" title="Kanal + durum sirasi">
                      {sibIdx + 1}/{sibs.length}
                    </span>
                    <button
                      onClick={(e) => handleReorder(s, 'down', e)}
                      disabled={isLast || isBusy}
                      title="Asagi tasi"
                      className="w-6 h-6 flex items-center justify-center rounded bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs">
                      &#9660;
                    </button>
                    <button
                      onClick={(e) => handleMoveToBottom(s, e)}
                      disabled={isLast || isBusy}
                      title="En alta tasi"
                      className="w-6 h-6 flex items-center justify-center rounded bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[10px]">
                      &#9196;
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-semibold text-white">{s.suggested_name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] || 'bg-gray-700 text-gray-400'}`}>
                        {STATUS_LABEL[s.status] || s.status}
                      </span>
                      {s.used && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 flex items-center gap-1">
                          Kullanildi
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {channelName(s.channel_id)} - {new Date(s.created_at).toLocaleDateString('tr-TR')}
                    </p>
                    {s.suggested_prompt && (
                      <p className="text-sm text-gray-400 line-clamp-2">{s.suggested_prompt}</p>
                    )}
                    {s.used && s.youtube_video_id && (
                      <a href={`https://www.youtube.com/watch?v=${s.youtube_video_id}`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-xs text-blue-400 hover:underline mt-2 inline-block">
                        YouTube&apos;da goruntule &rarr;
                      </a>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 ml-4 mt-1 shrink-0">Duzenle &rarr;</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-800">
              <h3 className="font-bold text-lg text-white">Konsept Duzenle</h3>
              <button onClick={closeDetail} className="text-gray-500 hover:text-white text-xl leading-none">&#10005;</button>
            </div>
            <div className="p-6 space-y-4">
              {selected.used && (
                <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg px-4 py-3">
                  <p className="text-sm text-blue-300 font-medium">Bu prompt otomatik paylasimda kullanildi.</p>
                  {selected.youtube_video_id && (
                    <a href={`https://www.youtube.com/watch?v=${selected.youtube_video_id}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline mt-1 inline-block break-all">
                      https://www.youtube.com/watch?v={selected.youtube_video_id}
                    </a>
                  )}
                </div>
              )}
              <div>
                <label className="text-xs text-gray-400 block mb-1">Baslik *</label>
                <input value={editForm.suggested_name}
                  onChange={e => setEditForm(f => ({ ...f, suggested_name: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Prompt / Aciklama</label>
                <textarea value={editForm.suggested_prompt}
                  onChange={e => setEditForm(f => ({ ...f, suggested_prompt: e.target.value }))}
                  rows={5}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Kanal</label>
                  <select value={editForm.channel_id}
                    onChange={e => setEditForm(f => ({ ...f, channel_id: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Genel</option>
                    {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Durum</label>
                  <select value={editForm.status}
                    onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="pending">Bekliyor</option>
                    <option value="approved">Onaylandi</option>
                    <option value="rejected">Reddedildi</option>
                    <option value="testing">Test Ediliyor</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Gerekce</label>
                <input value={editForm.rationale}
                  onChange={e => setEditForm(f => ({ ...f, rationale: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <p className="text-[10px] text-gray-600">Video test etmek icin sol menudeki &quot;Video Test&quot; sekmesini kullanabilirsiniz.</p>
            </div>
            <div className="flex justify-between items-center p-6 border-t border-gray-800">
              <button onClick={handleDelete} className="text-sm text-red-400 hover:text-red-300 transition-colors">
                Sil
              </button>
              <div className="flex gap-2">
                <button onClick={closeDetail}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors">
                  Iptal
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
