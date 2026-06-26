'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const MODELS = [
  'Otomatik seÃ§', 'kling-3.0', 'veo-3.1', 'seedance-2.0-fast',
  'wan-2.6', 'hailuo-2.3', 'vidu-q3', 'sora-2-pro', 'runway-gen-4.5',
]

interface Channel {
  id: string; name: string; category: string; status: string
  default_model: string | null; subscriber_count: number
}
interface ScheduleSlot { id: string; format: string; publish_time: string; is_active: boolean }

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [settingsCh, setSettingsCh] = useState<Channel | null>(null)
  const [slots, setSlots]           = useState<ScheduleSlot[]>([])
  const [newSlot, setNewSlot]       = useState({ format: 'shorts', publish_time: '09:00' })
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [deleteId, setDeleteId]     = useState<string | null>(null)
  const [saving, setSaving]         = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const data = await api.get<Channel[]>('/channels')
      setChannels(Array.isArray(data) ? data : [])
    } catch (e: unknown) { setError((e as Error).message) }
    finally { setLoading(false) }
  }

  async function toggleStatus(ch: Channel) {
    const next = ch.status === 'active' ? 'inactive' : 'active'
    setSaving(ch.id)
    try {
      await api.patch(`/channels/${ch.id}`, { status: next })
      setChannels(cs => cs.map(c => c.id === ch.id ? { ...c, status: next } : c))
    } finally { setSaving(null) }
  }

  async function updateModel(ch: Channel, model: string) {
    const m = model === 'Otomatik seÃ§' ? null : model
    setSaving(ch.id + '-model')
    try {
      await api.patch(`/channels/${ch.id}`, { default_model: m })
      setChannels(cs => cs.map(c => c.id === ch.id ? { ...c, default_model: m } : c))
    } finally { setSaving(null) }
  }

  async function openSettings(ch: Channel) {
    setSettingsCh(ch); setSlotsLoading(true)
    try {
      const data = await api.get<ScheduleSlot[]>(`/channels/${ch.id}/schedule-slots`)
      setSlots(Array.isArray(data) ? data : [])
    } finally { setSlotsLoading(false) }
  }

  async function addSlot() {
    if (!settingsCh) return
    const slot = await api.post<ScheduleSlot>(`/channels/${settingsCh.id}/schedule-slots`, newSlot)
    setSlots(s => [...s, slot])
  }

  async function removeSlot(slotId: string) {
    if (!settingsCh) return
    await api.delete(`/channels/${settingsCh.id}/schedule-slots/${slotId}`)
    setSlots(s => s.filter(sl => sl.id !== slotId))
  }

  async function deleteChannel(id: string) {
    await api.delete(`/channels/${id}`)
    setChannels(cs => cs.filter(c => c.id !== id))
    setDeleteId(null)
  }

  const startOAuth = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google/start`
  }

  if (loading) return <div className="p-8 text-gray-400">YÃ¼kleniyor...</div>

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Kanallar</h1>
        <button onClick={startOAuth}
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-medium transition">
          + Yeni Kanal Ekle
        </button>
      </div>

      {error && <div className="bg-red-900/30 border border-red-800 text-red-400 p-4 rounded-lg mb-4 text-sm">{error}</div>}

      {channels.length === 0 && !error && (
        <div className="text-center py-20 text-gray-500">
          <p className="mb-4 text-lg">HenÃ¼z kanal baÄlanmamÄ±Å.</p>
          <button onClick={startOAuth} className="text-green-400 hover:underline text-sm">
            Google hesabÄ± baÄlayarak kanal ekle â
          </button>
        </div>
      )}

      <div className="space-y-3">
        {channels.map(ch => (
          <div key={ch.id} className="bg-gray-900 rounded-xl p-5 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{ch.name}</div>
              <div className="text-sm text-gray-400 mt-0.5">
                {ch.category} Â· {ch.subscriber_count?.toLocaleString('tr-TR') ?? 'â'} abone
              </div>
            </div>

            <select
              value={ch.default_model ?? 'Otomatik seÃ§'}
              onChange={e => updateModel(ch, e.target.value)}
              disabled={saving === ch.id + '-model'}
              className="bg-gray-800 text-sm text-white rounded-lg px-3 py-1.5 outline-none disabled:opacity-50"
            >
              {MODELS.map(m => <option key={m}>{m}</option>)}
            </select>

            <button onClick={() => openSettings(ch)}
              className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-sm transition">
              ð Takvim
            </button>

            <button
              onClick={() => toggleStatus(ch)}
              disabled={saving === ch.id}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                ch.status === 'active'
                  ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {ch.status === 'active' ? 'Aktif' : 'Pasif'}
            </button>

            <button onClick={() => setDeleteId(ch.id)} className="text-red-400 hover:text-red-300 px-2 text-sm">
              Sil
            </button>
          </div>
        ))}
      </div>

      {/* Schedule Slots Modal */}
      {settingsCh && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="font-semibold">YayÄ±n Takvimi â {settingsCh.name}</h2>
              <button onClick={() => setSettingsCh(null)} className="text-gray-400 hover:text-white text-xl leading-none">Ã</button>
            </div>
            <div className="p-5 space-y-2 max-h-64 overflow-y-auto">
              {slotsLoading && <p className="text-gray-500 text-sm text-center py-4">YÃ¼kleniyor...</p>}
              {!slotsLoading && slots.length === 0 && <p className="text-gray-500 text-sm text-center py-4">HenÃ¼z slot yok.</p>}
              {slots.map(sl => (
                <div key={sl.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2.5">
                  <span className="text-sm">
                    {sl.format === 'shorts' ? 'ð©³ Shorts' : 'ð¬ Uzun Video'} Â· {sl.publish_time}
                  </span>
                  <button onClick={() => removeSlot(sl.id)} className="text-red-400 hover:text-red-300 text-xs">KaldÄ±r</button>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-gray-800 flex gap-2">
              <select
                value={newSlot.format}
                onChange={e => setNewSlot(s => ({ ...s, format: e.target.value }))}
                className="bg-gray-800 text-sm text-white rounded-lg px-3 py-2 outline-none"
              >
                <option value="shorts">Shorts</option>
                <option value="long">Uzun Video</option>
              </select>
              <input
                type="time"
                value={newSlot.publish_time}
                onChange={e => setNewSlot(s => ({ ...s, publish_time: e.target.value }))}
                className="bg-gray-800 text-sm text-white rounded-lg px-3 py-2 outline-none flex-1"
              />
              <button onClick={addSlot}
                className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-medium transition">
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl w-80 p-6 text-center">
            <p className="text-white mb-2 font-medium">KanalÄ± sil?</p>
            <p className="text-gray-400 text-sm mb-5">Bu iÅlem geri alÄ±namaz.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteId(null)}
                className="bg-gray-800 hover:bg-gray-700 px-5 py-2 rounded-lg text-sm transition">Ä°ptal</button>
              <button onClick={() => deleteChannel(deleteId)}
                className="bg-red-600 hover:bg-red-500 px-5 py-2 rounded-lg text-sm transition">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
