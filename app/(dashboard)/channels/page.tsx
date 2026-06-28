'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || ''

const MODELS = [
  'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro',
  'gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1',
  'claude-3-5-haiku-20241022', 'claude-3-7-sonnet-20250219',
]

interface Channel {
  id: number; name: string; youtube_channel_id: string;
  status: string; default_model: string; schedule_slots: string[];
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [editingModel, setEditingModel] = useState<number | null>(null)
  const [showSlots, setShowSlots] = useState<number | null>(null)
  const [newSlot, setNewSlot] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  useEffect(() => { fetchChannels() }, [])

  async function fetchChannels() {
    setLoading(true)
    try { setChannels(await api.get<Channel[]>('/channels')) }
    finally { setLoading(false) }
  }

  async function toggleStatus(ch: Channel) {
    const next = ch.status === 'active' ? 'paused' : 'active'
    await api.patch(`/channels/${ch.id}`, { status: next })
    setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, status: next } : c))
  }

  async function updateModel(id: number, model: string) {
    await api.patch(`/channels/${id}`, { default_model: model })
    setChannels(prev => prev.map(c => c.id === id ? { ...c, default_model: model } : c))
    setEditingModel(null)
  }

  async function addSlot(ch: Channel) {
    if (!newSlot.match(/^\d{2}:\d{2}$/)) return
    const slots = [...(ch.schedule_slots || []), newSlot]
    await api.patch(`/channels/${ch.id}`, { schedule_slots: slots })
    setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, schedule_slots: slots } : c))
    setNewSlot('')
  }

  async function removeSlot(ch: Channel, slot: string) {
    const slots = ch.schedule_slots.filter(s => s !== slot)
    await api.patch(`/channels/${ch.id}`, { schedule_slots: slots })
    setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, schedule_slots: slots } : c))
  }

  async function deleteChannel(id: number) {
    await api.delete(`/channels/${id}`)
    setChannels(prev => prev.filter(c => c.id !== id))
    setDeleteConfirm(null)
  }

  function startOAuth() {
    window.location.href = `${NEXT_PUBLIC_API_URL}/auth/youtube`
  }

  if (loading) return <div className="p-8 text-center">Yükleniyor…</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Kanallar</h2>
        <button onClick={startOAuth} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Yeni Kanal Ekle
        </button>
      </div>

      {channels.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <p className="text-gray-500 mb-3">Henüz kanal bağlanmamış.</p>
          <button onClick={startOAuth} className="text-blue-600 text-sm font-medium">
            Google hesabı bağlayarak kanal ekle →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {channels.map(ch => (
            <div key={ch.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{ch.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ch.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {ch.status === 'active' ? 'Aktif' : 'Durduruldu'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{ch.youtube_channel_id}</p>
                  <div className="mt-3 flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Model:</span>
                      {editingModel === ch.id ? (
                        <select autoFocus defaultValue={ch.default_model}
                          onChange={e => updateModel(ch.id, e.target.value)}
                          onBlur={() => setEditingModel(null)}
                          className="text-xs border rounded px-2 py-1">
                          {MODELS.map(m => <option key={m}>{m}</option>)}
                        </select>
                      ) : (
                        <button onClick={() => setEditingModel(ch.id)} className="text-xs text-blue-600 hover:underline">
                          {ch.default_model || 'Seç'}
                        </button>
                      )}
                    </div>
                    <button onClick={() => setShowSlots(showSlots === ch.id ? null : ch.id)} className="text-xs text-gray-500 hover:text-gray-700">
                      Zamanlama ({ch.schedule_slots?.length || 0} slot)
                    </button>
                  </div>
                  {showSlots === ch.id && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(ch.schedule_slots || []).map(slot => (
                          <span key={slot} className="text-xs bg-white border rounded px-2 py-1 flex items-center gap-1">
                            {slot}
                            <button onClick={() => removeSlot(ch, slot)} className="text-red-400 hover:text-red-600 ml-1">×</button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input type="time" value={newSlot} onChange={e => setNewSlot(e.target.value)}
                          className="text-xs border rounded px-2 py-1" />
                        <button onClick={() => addSlot(ch)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded">Ekle</button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => toggleStatus(ch)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium ${ch.status === 'active' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {ch.status === 'active' ? 'Durdur' : 'Başlat'}
                  </button>
                  <button onClick={() => setDeleteConfirm(ch.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600">Sil</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold mb-2">Kanalı sil</h3>
            <p className="text-sm text-gray-600 mb-4">Bu kanal kalıcı olarak silinecek. Emin misin?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border rounded-lg text-sm">İptal</button>
              <button onClick={() => deleteChannel(deleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
