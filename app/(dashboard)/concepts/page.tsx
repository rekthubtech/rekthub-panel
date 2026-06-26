'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const AUDIO_SOURCES = ['model_native', 'elevenlabs_sfx', 'hybrid']
const MODELS = ['', 'kling-3.0', 'veo-3.1', 'seedance-2.0-fast', 'wan-2.6', 'hailuo-2.3', 'vidu-q3', 'sora-2-pro', 'runway-gen-4.5']

interface Channel  { id: string; name: string }
interface Concept  { id: string; name: string; prompt_template: string; negative_prompt: string; clip_duration_seconds: number; audio_note: string; audio_source: string; model_override: string | null; status: string; avg_views: number }
interface Suggestion { id: string; suggested_name: string; suggested_prompt: string; rationale: string }

const EMPTY_FORM = { name: '', prompt_template: '', negative_prompt: '', clip_duration_seconds: 6, audio_note: '', audio_source: 'model_native', model_override: '' }

export default function ConceptsPage() {
  const [channels, setChannels]       = useState<Channel[]>([])
  const [channelId, setChannelId]     = useState('')
  const [concepts, setConcepts]       = useState<Concept[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading]         = useState(false)
  const [modal, setModal]             = useState<'add' | 'edit' | null>(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [editId, setEditId]           = useState<string | null>(null)
  const [testing, setTesting]         = useState<string | null>(null)
  const [testMsg, setTestMsg]         = useState('')
  const [deleteId, setDeleteId]       = useState<string | null>(null)

  useEffect(() => {
    api.get<Channel[]>('/channels').then(d => {
      const arr = Array.isArray(d) ? d : []
      setChannels(arr)
      if (arr.length) setChannelId(arr[0].id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!channelId) return
    setLoading(true)
    Promise.all([
      api.get<Concept[]>(`/channels/${channelId}/concepts`),
      api.get<Suggestion[]>('/concepts/suggestions?status=pending'),
    ]).then(([c, s]) => {
      setConcepts(Array.isArray(c) ? c : [])
      setSuggestions(Array.isArray(s) ? s : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [channelId])

  function openAdd() { setForm({ ...EMPTY_FORM }); setEditId(null); setModal('add') }
  function openEdit(c: Concept) {
    setForm({ name: c.name, prompt_template: c.prompt_template, negative_prompt: c.negative_prompt, clip_duration_seconds: c.clip_duration_seconds, audio_note: c.audio_note, audio_source: c.audio_source, model_override: c.model_override || '' })
    setEditId(c.id); setModal('edit')
  }

  async function saveForm() {
    const body = { ...form, channel_id: channelId, model_override: form.model_override || null }
    if (modal === 'add') {
      const c = await api.post<Concept>('/concepts', body)
      setConcepts(cs => [...cs, c])
    } else if (editId) {
      const c = await api.patch<Concept>(`/concepts/${editId}`, body)
      setConcepts(cs => cs.map(x => x.id === editId ? c : x))
    }
    setModal(null)
  }

  async function deleteConcept(id: string) {
    await api.delete(`/concepts/${id}`)
    setConcepts(cs => cs.filter(c => c.id !== id))
    setDeleteId(null)
  }

  async function testConcept(id: string) {
    setTesting(id); setTestMsg('')
    try {
      await api.post(`/concepts/${id}/test`, {})
      setTestMsg('â Test baÅlatÄ±ldÄ±! Telegram\'a mesaj gelecek.')
    } catch (e: unknown) {
      setTestMsg('â ' + (e as Error).message)
    } finally {
      setTesting(null)
      setTimeout(() => setTestMsg(''), 5000)
    }
  }

  async function approveSuggestion(id: string) {
    await api.patch(`/concepts/suggestions/${id}`, { status: 'approved', channel_id: channelId })
    setSuggestions(ss => ss.filter(s => s.id !== id))
    const c = await api.get<Concept[]>(`/channels/${channelId}/concepts`)
    setConcepts(Array.isArray(c) ? c : [])
  }

  async function rejectSuggestion(id: string) {
    await api.patch(`/concepts/suggestions/${id}`, { status: 'rejected' })
    setSuggestions(ss => ss.filter(s => s.id !== id))
  }

  async function toggleStatus(c: Concept) {
    const next = c.status === 'active' ? 'inactive' : 'active'
    await api.patch(`/concepts/${c.id}`, { status: next })
    setConcepts(cs => cs.map(x => x.id === c.id ? { ...x, status: next } : x))
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Konseptler</h1>
        <div className="flex items-center gap-3">
          <select
            value={channelId}
            onChange={e => setChannelId(e.target.value)}
            className="bg-gray-800 text-sm text-white rounded-lg px-3 py-2 outline-none"
          >
            {channels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
          </select>
          <button onClick={openAdd} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-medium transition">
            + Yeni Konsept
          </button>
        </div>
      </div>

      {testMsg && (
        <div className="bg-gray-800 text-sm px-4 py-3 rounded-lg mb-4">{testMsg}</div>
      )}

      {/* Suggestions queue */}
      {suggestions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-yellow-400 mb-3">â³ Onay KuyruÄu ({suggestions.length})</h2>
          <div className="space-y-2">
            {suggestions.map(s => (
              <div key={s.id} className="bg-yellow-900/20 border border-yellow-800/30 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium text-sm">{s.suggested_name}</div>
                    <div className="text-xs text-gray-400 mt-1">{s.rationale}</div>
                    <div className="text-xs text-gray-500 mt-1 font-mono">{s.suggested_prompt?.substring(0, 100)}...</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => approveSuggestion(s.id)} className="bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded-lg text-xs transition">Onayla</button>
                    <button onClick={() => rejectSuggestion(s.id)} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-xs transition">Reddet</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Concepts list */}
      {loading && <div className="text-gray-400 text-sm">YÃ¼kleniyor...</div>}
      {!loading && concepts.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p>Bu kanalda henÃ¼z konsept yok.</p>
          <button onClick={openAdd} className="text-green-400 hover:underline text-sm mt-2">Ä°lk konsepti ekle â</button>
        </div>
      )}
      <div className="space-y-3">
        {concepts.map(c => (
          <div key={c.id} className="bg-gray-900 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  {c.avg_views > 0 && <span className="text-xs text-gray-500">{c.avg_views.toLocaleString('tr-TR')} ort. izlenme</span>}
                </div>
                <div className="text-xs text-gray-500 mt-1 truncate">{c.prompt_template?.substring(0, 80)}...</div>
                <div className="flex gap-2 mt-2 text-xs text-gray-600">
                  <span>{c.clip_duration_seconds}sn</span>
                  <span>Â·</span>
                  <span>{c.audio_source}</span>
                  {c.model_override && <><span>Â·</span><span className="text-blue-400">{c.model_override}</span></>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => testConcept(c.id)}
                  disabled={testing === c.id}
                  className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-3 py-1.5 rounded-lg text-xs transition disabled:opacity-50"
                >
                  {testing === c.id ? 'Test...' : 'Test Et'}
                </button>
                <button
                  onClick={() => toggleStatus(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${c.status === 'active' ? 'bg-green-600/20 text-green-400' : 'bg-gray-800 text-gray-500'}`}
                >
                  {c.status === 'active' ? 'Aktif' : 'Pasif'}
                </button>
                <button onClick={() => openEdit(c)} className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-xs transition">DÃ¼zenle</button>
                <button onClick={() => setDeleteId(c.id)} className="text-red-400 hover:text-red-300 px-2 text-xs">Sil</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="font-semibold">{modal === 'add' ? 'Yeni Konsept' : 'Konsept DÃ¼zenle'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-white text-xl">Ã</button>
            </div>
            <div className="p-5 space-y-4">
              {([
                ['name', 'Konsept AdÄ±', 'text'],
                ['prompt_template', 'Prompt Åablonu', 'textarea'],
                ['negative_prompt', 'Negatif Prompt', 'textarea'],
                ['audio_note', 'Ses Notu', 'text'],
              ] as const).map(([key, label, type]) => (
                <div key={key}>
                  <label className="block text-sm text-gray-400 mb-1">{label}</label>
                  {type === 'textarea' ? (
                    <textarea
                      value={(form as Record<string, unknown>)[key] as string}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      rows={3}
                      className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={(form as Record<string, unknown>)[key] as string}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  )}
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Klip SÃ¼resi (sn)</label>
                  <input type="number" min={1} max={60} value={form.clip_duration_seconds}
                    onChange={e => setForm(f => ({ ...f, clip_duration_seconds: Number(e.target.value) }))}
                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Ses KaynaÄÄ±</label>
                  <select value={form.audio_source} onChange={e => setForm(f => ({ ...f, audio_source: e.target.value }))}
                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none text-sm">
                    {AUDIO_SOURCES.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Model Override</label>
                <select value={form.model_override} onChange={e => setForm(f => ({ ...f, model_override: e.target.value }))}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none text-sm">
                  <option value="">Otomatik seÃ§</option>
                  {MODELS.filter(Boolean).map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-800">
              <button onClick={() => setModal(null)} className="bg-gray-800 hover:bg-gray-700 px-5 py-2 rounded-lg text-sm transition">Ä°ptal</button>
              <button onClick={saveForm} className="bg-green-600 hover:bg-green-500 px-5 py-2 rounded-lg text-sm font-medium transition">Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 w-80 text-center">
            <p className="text-white mb-2 font-medium">Konsepti sil?</p>
            <p className="text-gray-400 text-sm mb-5">Bu iÅlem geri alÄ±namaz.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteId(null)} className="bg-gray-800 hover:bg-gray-700 px-5 py-2 rounded-lg text-sm">Ä°ptal</button>
              <button onClick={() => deleteConcept(deleteId)} className="bg-red-600 hover:bg-red-500 px-5 py-2 rounded-lg text-sm">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
