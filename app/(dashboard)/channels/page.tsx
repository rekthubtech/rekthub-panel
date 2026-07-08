'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || ''

const MODEL_GROUPS = [
  {
    label: '🎬 Kling (Kwaivgi)',
    models: [
      { id: 'kwaivgi/kling-v3.0-turbo/text-to-video', label: 'Kling V3.0 Turbo' },
      { id: 'kwaivgi/kling-v3.0-4k/text-to-video', label: 'Kling V3.0 4K' },
      { id: 'kwaivgi/kling-v3.0-pro/text-to-video', label: 'Kling V3.0 Pro' },
      { id: 'kwaivgi/kling-v3.0-std/text-to-video', label: 'Kling V3.0 Standard' },
      { id: 'kwaivgi/kling-video-o3-4k/text-to-video', label: 'Kling O3 4K' },
      { id: 'kwaivgi/kling-video-o3-pro/text-to-video', label: 'Kling O3 Pro' },
      { id: 'kwaivgi/kling-video-o3-std/text-to-video', label: 'Kling O3 Standard' },
      { id: 'kwaivgi/kling-video-o1/text-to-video', label: 'Kling O1' },
      { id: 'kwaivgi/kling-v2.6-pro/text-to-video', label: 'Kling V2.6 Pro' },
      { id: 'kwaivgi/kling-v2.5-turbo-pro/text-to-video', label: 'Kling V2.5 Turbo Pro' },
      { id: 'kwaivgi/kling-v2.1-t2v-master', label: 'Kling V2.1 Master' },
      { id: 'kwaivgi/kling-v2.0-t2v-master', label: 'Kling V2.0 Master' },
      { id: 'kwaivgi/kling-v1.6-t2v-standard', label: 'Kling V1.6 Standard' },
    ],
  },
  {
    label: '🎬 Seedance (ByteDance)',
    models: [
      { id: 'bytedance/seedance-2.0/text-to-video', label: 'Seedance 2.0' },
      { id: 'bytedance/seedance-2.0-fast/text-to-video', label: 'Seedance 2.0 Fast' },
      { id: 'bytedance/seedance-2.0-mini/text-to-video', label: 'Seedance 2.0 Mini' },
      { id: 'bytedance/seedance-v1.5-pro/text-to-video', label: 'Seedance V1.5 Pro' },
      { id: 'bytedance/seedance-v1.5-pro/text-to-video-fast', label: 'Seedance V1.5 Pro Fast' },
      { id: 'bytedance/seedance-v1-pro-fast/text-to-video', label: 'Seedance V1 Pro Fast' },
      { id: 'bytedance/seedance-v1-pro-t2v-1080p', label: 'Seedance V1 Pro 1080p' },
      { id: 'bytedance/seedance-v1-pro-t2v-720p', label: 'Seedance V1 Pro 720p' },
      { id: 'bytedance/seedance-v1-pro-t2v-480p', label: 'Seedance V1 Pro 480p' },
    ],
  },
  {
    label: '🎬 Wan / HappyHorse (Alibaba)',
    models: [
      { id: 'alibaba/wan-2.6/text-to-video', label: 'Wan 2.6 (Varsayilan)' },
      { id: 'alibaba/wan-2.7/text-to-video', label: 'Wan 2.7' },
      { id: 'alibaba/wan-2.5/text-to-video', label: 'Wan 2.5' },
      { id: 'alibaba/wan-2.5/text-to-video-fast', label: 'Wan 2.5 Fast' },
      { id: 'alibaba/wan-2.5/video-extend', label: 'Wan 2.5 Video Extend' },
      { id: 'alibaba/happyhorse-1.1/text-to-video', label: 'HappyHorse 1.1' },
      { id: 'alibaba/happyhorse-1.0/text-to-video', label: 'HappyHorse 1.0' },
    ],
  },
  {
    label: '🎬 Veo / Gemini (Google)',
    models: [
      { id: 'google/veo3.1/text-to-video', label: 'Veo 3.1 (Yuksek Kalite)' },
      { id: 'google/veo3.1-fast/text-to-video', label: 'Veo 3.1 Fast' },
      { id: 'google/veo3.1-lite/text-to-video', label: 'Veo 3.1 Lite' },
      { id: 'google/gemini-omni-flash/text-to-video-developer', label: 'Gemini Omni Flash' },
    ],
  },
  {
    label: '🎬 Vidu',
    models: [
      { id: 'vidu/q1/text-to-video', label: 'Vidu Q1' },
      { id: 'vidu/q2/text-to-video', label: 'Vidu Q2' },
      { id: 'vidu/q3-pro/text-to-video', label: 'Vidu Q3 Pro' },
      { id: 'vidu/q3-turbo/text-to-video', label: 'Vidu Q3 Turbo' },
    ],
  },
  {
    label: '🎬 Hailuo (Minimax)',
    models: [
      { id: 'minimax/hailuo-02/t2v-standard', label: 'Hailuo 02 Standard' },
      { id: 'minimax/hailuo-02/t2v-pro', label: 'Hailuo 02 Pro' },
      { id: 'minimax/hailuo-2.3/t2v-standard', label: 'Hailuo 2.3 Standard' },
      { id: 'minimax/hailuo-2.3/t2v-pro', label: 'Hailuo 2.3 Pro' },
    ],
  },
  {
    label: '🎬 Pixverse',
    models: [
      { id: 'pixverse/v6/text-to-video', label: 'Pixverse V6' },
      { id: 'pixverse/c1/text-to-video', label: 'Pixverse C1' },
    ],
  },
  {
    label: '🎬 Van (Atlas Cloud)',
    models: [
      { id: 'atlascloud/van-2.6/text-to-video', label: 'Van 2.6' },
      { id: 'atlascloud/van-2.5/text-to-video', label: 'Van 2.5' },
    ],
  },
  {
    label: '🎬 Diger Video',
    models: [
      { id: 'xai/grok-imagine-video/text-to-video', label: 'Grok Imagine Video' },
    ],
  },
  {
    label: '🤖 LLM Modeller',
    models: [
      { id: 'gemini-2.0-flash', label: 'gemini-2.0-flash' },
      { id: 'gemini-2.5-flash', label: 'gemini-2.5-flash' },
      { id: 'gemini-2.5-pro', label: 'gemini-2.5-pro' },
      { id: 'gpt-4o-mini', label: 'gpt-4o-mini' },
      { id: 'gpt-4o', label: 'gpt-4o' },
      { id: 'gpt-4.1-mini', label: 'gpt-4.1-mini' },
      { id: 'gpt-4.1', label: 'gpt-4.1' },
      { id: 'claude-3-5-haiku-20241022', label: 'claude-3-5-haiku-20241022' },
      { id: 'claude-3-7-sonnet-20250219', label: 'claude-3-7-sonnet-20250219' },
    ],
  },
]

const BYTEPLUS_MODEL_IDS = new Set([
  'bytedance/seedance-2.0/text-to-video',
  'bytedance/seedance-2.0-fast/text-to-video',
  'bytedance/seedance-2.0-mini/text-to-video',
])
function providerLabel(id: string) {
  return BYTEPLUS_MODEL_IDS.has(id) ? 'BytePlus' : 'Atlas Cloud'
}

const FORMAT_OPTIONS = [
  { id: 'shorts', label: 'Shorts' },
  { id: 'long', label: 'Uzun Video' },
]

const ASPECT_RATIO_OPTIONS = [
  { id: '', label: 'Varsayılan' },
  { id: '16:9', label: '16:9 (Yatay)' },
  { id: '9:16', label: '9:16 (Dikey / Shorts)' },
  { id: '1:1', label: '1:1 (Kare)' },
  { id: '4:3', label: '4:3' },
  { id: '3:4', label: '3:4' },
]

const RESOLUTION_OPTIONS = [
  { id: '', label: 'Varsayılan' },
  { id: '720p', label: '720p' },
  { id: '1080p', label: '1080p' },
  { id: '4k', label: '4K' },
]

const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-pink-500 to-rose-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-purple-500 to-fuchsia-600',
  'from-cyan-500 to-sky-600',
]
function avatarGradient(id: number) {
  return AVATAR_GRADIENTS[Math.abs(id) % AVATAR_GRADIENTS.length]
}

const IconFilm = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4"/></svg>
)
const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
)
const IconAspect = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 10v4M16 10v4"/></svg>
)
const IconPlay = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0"><path d="M8 5v14l11-7z"/></svg>
)
const IconPause = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
)
const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6"/></svg>
)
const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0"><path d="M12 5v14M5 12h14"/></svg>
)
const IconTv = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect x="3" y="5" width="18" height="13" rx="2"/><path d="M8 21h8M12 18v3"/></svg>
)

interface ScheduleSlot {
  id: number
  format: string
  publish_time: string
  is_active: boolean
}

interface VideoSettings {
  duration?: number
  aspect_ratio?: string
  resolution?: string
}

interface Branding {
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  font?: string
  video_settings?: VideoSettings
}

interface Channel {
  id: number; name: string; youtube_channel_id: string;
  status: string; default_model: string; schedule_slots?: ScheduleSlot[];
  branding?: Branding | null;
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [editingModel, setEditingModel] = useState<number | null>(null)
  const [showSlots, setShowSlots] = useState<number | null>(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [newSlot, setNewSlot] = useState('')
  const [newFormat, setNewFormat] = useState('shorts')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [showVideoSettings, setShowVideoSettings] = useState<number | null>(null)
  const [vsDuration, setVsDuration] = useState(5)
  const [vsAspectRatio, setVsAspectRatio] = useState('')
  const [vsResolution, setVsResolution] = useState('')
  const [vsSaving, setVsSaving] = useState(false)

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

  async function toggleSlots(ch: Channel) {
    if (showSlots === ch.id) { setShowSlots(null); return }
    setShowSlots(ch.id)
    setNewSlot('')
    setNewFormat('shorts')
    setSlotsLoading(true)
    try {
      const slots = await api.get<ScheduleSlot[]>(`/channels/${ch.id}/schedule-slots`)
      setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, schedule_slots: slots } : c))
    } catch (e) {
      // sessiz geç, boş liste olarak kalsın
    } finally {
      setSlotsLoading(false)
    }
  }

  async function addSlot(ch: Channel) {
    if (!newSlot.match(/^\d{2}:\d{2}$/)) return
    const created = await api.post<ScheduleSlot>(`/channels/${ch.id}/schedule-slots`, {
      format: newFormat,
      publish_time: newSlot,
      is_active: true,
    })
    setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, schedule_slots: [...(c.schedule_slots || []), created] } : c))
    setNewSlot('')
  }

  async function removeSlot(ch: Channel, slot: ScheduleSlot) {
    await api.delete(`/channels/${ch.id}/schedule-slots/${slot.id}`)
    setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, schedule_slots: (c.schedule_slots || []).filter(s => s.id !== slot.id) } : c))
  }

  async function deleteChannel(id: number) {
    await api.delete(`/channels/${id}`)
    setChannels(prev => prev.filter(c => c.id !== id))
    setDeleteConfirm(null)
  }

  function toggleVideoSettings(ch: Channel) {
    if (showVideoSettings === ch.id) { setShowVideoSettings(null); return }
    setShowVideoSettings(ch.id)
    const vs = (ch.branding && ch.branding.video_settings) || {}
    setVsDuration(vs.duration || 5)
    setVsAspectRatio(vs.aspect_ratio || '')
    setVsResolution(vs.resolution || '')
  }

  async function saveVideoSettings(ch: Channel) {
    setVsSaving(true)
    try {
      const video_settings: VideoSettings = { duration: vsDuration }
      if (vsAspectRatio) video_settings.aspect_ratio = vsAspectRatio
      if (vsResolution) video_settings.resolution = vsResolution
      const newBranding: Branding = { ...(ch.branding || {}), video_settings }
      await api.patch(`/channels/${ch.id}`, { branding: newBranding })
      setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, branding: newBranding } : c))
      setShowVideoSettings(null)
    } finally {
      setVsSaving(false)
    }
  }

  function startOAuth() {
    window.location.href = `${NEXT_PUBLIC_API_URL}/auth/youtube`
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Yükleniyor…</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-2xl font-bold text-white">Kanallar</h2>
        <button onClick={startOAuth} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20">
          <IconPlus /> Yeni Kanal Ekle
        </button>
      </div>
      {channels.length > 0 && (
        <p className="text-sm text-gray-500 mb-6">
          {channels.length} kanal · <span className="text-green-400">{channels.filter(c => c.status === 'active').length} aktif</span>
          {channels.some(c => c.status !== 'active') && <> · <span className="text-gray-500">{channels.filter(c => c.status !== 'active').length} durduruldu</span></>}
        </p>
      )}
      {channels.length === 0 && <div className="mb-6" />}

      {channels.length === 0 ? (
        <div className="bg-gray-800/60 rounded-2xl p-12 text-center border border-dashed border-gray-700">
          <div className="w-14 h-14 rounded-2xl bg-gray-700/60 flex items-center justify-center mx-auto mb-4 text-gray-400"><IconTv /></div>
          <p className="text-gray-400 mb-3">Henüz kanal bağlanmamış.</p>
          <button onClick={startOAuth} className="text-blue-400 text-sm font-medium hover:text-blue-300">
            Google hesabı bağlayarak kanal ekle →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {channels.map(ch => {
            const vs = (ch.branding && ch.branding.video_settings) || {}
            const isActive = ch.status === 'active'
            const expanded = showSlots === ch.id || showVideoSettings === ch.id
            return (
            <div key={ch.id} className={`relative bg-gray-800/50 rounded-2xl p-5 pl-6 border transition-all shadow-lg shadow-black/10 ${isActive ? 'border-gray-700 hover:border-gray-600' : 'border-gray-800 opacity-80'} ${expanded ? 'xl:col-span-2' : ''}`}>
              <span className={`absolute left-0 top-5 bottom-5 w-1 rounded-full ${isActive ? 'bg-green-500/70' : 'bg-gray-600'}`} />
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 text-white bg-gradient-to-br shadow-inner ${avatarGradient(ch.id)} ${!isActive ? 'grayscale opacity-60' : ''}`}>
                    {ch.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-white text-[15px] truncate">{ch.name}</h3>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full font-medium ${isActive ? 'bg-green-500/10 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400' : 'bg-gray-500'}`} />
                        {isActive ? 'Aktif' : 'Durduruldu'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-mono truncate bg-black/20 inline-block px-1.5 py-0.5 rounded">{ch.youtube_channel_id}</p>

                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-gray-400">
                        <span className="text-gray-500"><IconFilm /></span>
                        {editingModel === ch.id ? (
                          <select autoFocus defaultValue={ch.default_model}
                            onChange={e => updateModel(ch.id, e.target.value)}
                            onBlur={() => setEditingModel(null)}
                            className="text-xs border border-gray-600 bg-gray-700 text-white rounded px-2 py-1 max-w-xs">
                            {MODEL_GROUPS.map(group => (
                              <optgroup key={group.label} label={group.label}>
                                {group.models.map(m => (
                                  <option key={m.id} value={m.id}>{m.label}{group.label !== '🤖 LLM Modeller' ? ` · ${providerLabel(m.id)}` : ''}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        ) : (
                          <button onClick={() => setEditingModel(ch.id)} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                            {ch.default_model || 'Seç'}
                          </button>
                        )}
                      </div>
                      <button onClick={() => toggleSlots(ch)}
                        className={`flex items-center gap-1.5 text-xs rounded-xl px-3 py-2 border transition-colors ${showSlots === ch.id ? 'bg-blue-600/10 border-blue-500/40 text-blue-400' : 'bg-white/[0.04] border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20'}`}>
                        <IconClock /> Zamanlama <span className="text-gray-600">·</span> {ch.schedule_slots?.length ?? 0} slot
                      </button>
                      <button onClick={() => toggleVideoSettings(ch)}
                        className={`flex items-center gap-1.5 text-xs rounded-xl px-3 py-2 border transition-colors ${showVideoSettings === ch.id ? 'bg-blue-600/10 border-blue-500/40 text-blue-400' : 'bg-white/[0.04] border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20'}`}>
                        <IconAspect /> {vs.duration || 5}sn · {vs.aspect_ratio || 'varsayılan'} · {vs.resolution || 'varsayılan'}
                      </button>
                    </div>

                    {showSlots === ch.id && (
                      <div className="mt-3 p-4 bg-black/20 rounded-xl border border-white/10">
                        {slotsLoading ? (
                          <p className="text-xs text-gray-500 mb-2">Yükleniyor…</p>
                        ) : (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {(ch.schedule_slots || []).length === 0 && (
                              <span className="text-xs text-gray-500">Henüz slot yok.</span>
                            )}
                            {(ch.schedule_slots || []).map(slot => (
                              <span key={slot.id} className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-full pl-3 pr-2 py-1 flex items-center gap-1.5">
                                {slot.publish_time} UTC <span className="text-gray-600">·</span> {FORMAT_OPTIONS.find(f => f.id === slot.format)?.label || slot.format}
                                <button onClick={() => removeSlot(ch, slot)} className="text-red-400 hover:text-red-300 ml-0.5 leading-none">×</button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 items-center flex-wrap">
                          <input type="time" value={newSlot} onChange={e => setNewSlot(e.target.value)}
                            className="text-xs border border-gray-600 bg-gray-800 text-white rounded-lg px-2 py-1.5" />
                          <select value={newFormat} onChange={e => setNewFormat(e.target.value)}
                            className="text-xs border border-gray-600 bg-gray-800 text-white rounded-lg px-2 py-1.5">
                            {FORMAT_OPTIONS.map(f => (
                              <option key={f.id} value={f.id}>{f.label}</option>
                            ))}
                          </select>
                          <button onClick={() => addSlot(ch)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium">Ekle</button>
                        </div>
                        <p className="text-[10px] text-gray-600 mt-2">Saatler UTC olarak kaydedilir.</p>
                      </div>
                    )}
                    {showVideoSettings === ch.id && (
                      <div className="mt-3 p-4 bg-black/20 rounded-xl border border-white/10">
                        <p className="text-xs text-gray-500 mb-3">Bu kanal için otomatik üretilecek videoların varsayılan süre/format/kalite ayarları. Zamanlanmış tüm paylaşımlarda kullanılır.</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-500 block mb-1">Süre (sn)</label>
                            <input type="number" min={1} max={120} value={vsDuration}
                              onChange={e => setVsDuration(Number(e.target.value) || 5)}
                              className="w-full text-xs border border-gray-600 bg-gray-800 text-white rounded-lg px-2 py-1.5" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 block mb-1">Format</label>
                            <select value={vsAspectRatio} onChange={e => setVsAspectRatio(e.target.value)}
                              className="w-full text-xs border border-gray-600 bg-gray-800 text-white rounded-lg px-2 py-1.5">
                              {ASPECT_RATIO_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 block mb-1">Kalite</label>
                            <select value={vsResolution} onChange={e => setVsResolution(e.target.value)}
                              className="w-full text-xs border border-gray-600 bg-gray-800 text-white rounded-lg px-2 py-1.5">
                              {RESOLUTION_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end mt-3">
                          <button onClick={() => saveVideoSettings(ch)} disabled={vsSaving}
                            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium">
                            {vsSaving ? 'Kaydediliyor…' : 'Kaydet'}
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-600 mt-2">Not: Shorts için 9:16 önerilir. Bazı modeller belirli süre/kalite kombinasyonlarını desteklemeyebilir.</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleStatus(ch)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-colors border ${isActive ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20' : 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'}`}>
                    {isActive ? <IconPause /> : <IconPlay />} {isActive ? 'Durdur' : 'Başlat'}
                  </button>
                  <button onClick={() => setDeleteConfirm(ch.id)} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors font-medium">
                    <IconTrash /> Sil
                  </button>
                </div>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full border border-gray-700 shadow-xl">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center mb-3 text-red-400"><IconTrash /></div>
            <h3 className="font-semibold text-white mb-2">Kanalı sil</h3>
            <p className="text-sm text-gray-400 mb-4">Bu kanal kalıcı olarak silinecek. Emin misin?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors">İptal</button>
              <button onClick={() => deleteChannel(deleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
