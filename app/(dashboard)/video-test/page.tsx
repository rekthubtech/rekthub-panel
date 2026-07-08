'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Channel {
  id: string
  name: string
}

const ATLAS_MODEL_GROUPS = [
  {
    label: 'Kling (Kwaivgi)',
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
    label: 'Seedance (ByteDance)',
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
    label: 'Wan / HappyHorse (Alibaba)',
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
    label: 'Veo / Gemini (Google)',
    models: [
      { id: 'google/veo3.1/text-to-video', label: 'Veo 3.1 (Yuksek Kalite)' },
      { id: 'google/veo3.1-fast/text-to-video', label: 'Veo 3.1 Fast' },
      { id: 'google/veo3.1-lite/text-to-video', label: 'Veo 3.1 Lite' },
      { id: 'google/gemini-omni-flash/text-to-video-developer', label: 'Gemini Omni Flash' },
    ],
  },
  {
    label: 'Vidu',
    models: [
      { id: 'vidu/q1/text-to-video', label: 'Vidu Q1' },
      { id: 'vidu/q2/text-to-video', label: 'Vidu Q2' },
      { id: 'vidu/q3-pro/text-to-video', label: 'Vidu Q3 Pro' },
      { id: 'vidu/q3-turbo/text-to-video', label: 'Vidu Q3 Turbo' },
    ],
  },
  {
    label: 'Hailuo (Minimax)',
    models: [
      { id: 'minimax/hailuo-02/t2v-standard', label: 'Hailuo 02 Standard' },
      { id: 'minimax/hailuo-02/t2v-pro', label: 'Hailuo 02 Pro' },
      { id: 'minimax/hailuo-2.3/t2v-standard', label: 'Hailuo 2.3 Standard' },
      { id: 'minimax/hailuo-2.3/t2v-pro', label: 'Hailuo 2.3 Pro' },
    ],
  },
  {
    label: 'Pixverse',
    models: [
      { id: 'pixverse/v6/text-to-video', label: 'Pixverse V6' },
      { id: 'pixverse/c1/text-to-video', label: 'Pixverse C1' },
    ],
  },
  {
    label: 'Van (Atlas Cloud)',
    models: [
      { id: 'atlascloud/van-2.6/text-to-video', label: 'Van 2.6' },
      { id: 'atlascloud/van-2.5/text-to-video', label: 'Van 2.5' },
    ],
  },
  {
    label: 'Diger',
    models: [
      { id: 'xai/grok-imagine-video/text-to-video', label: 'Grok Imagine Video' },
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

const ASPECT_RATIO_OPTIONS = [
  { id: '', label: 'Model Varsayilani' },
  { id: '16:9', label: '16:9 (Yatay)' },
  { id: '9:16', label: '9:16 (Dikey / Shorts)' },
  { id: '1:1', label: '1:1 (Kare)' },
  { id: '4:3', label: '4:3' },
  { id: '3:4', label: '3:4' },
]

const RESOLUTION_OPTIONS = [
  { id: '', label: 'Model Varsayilani' },
  { id: '720p', label: '720p' },
  { id: '1080p', label: '1080p' },
  { id: '4k', label: '4K' },
]

export default function VideoTestPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [prompt, setPrompt] = useState('')
  const [label, setLabel] = useState('')
  const [channelId, setChannelId] = useState('')
  const [model, setModel] = useState('alibaba/wan-2.6/text-to-video')
  const [duration, setDuration] = useState(5)
  const [aspectRatio, setAspectRatio] = useState('')
  const [resolution, setResolution] = useState('')
  const [testing, setTesting] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; video_url?: string } | null>(null)

  useEffect(() => {
    api.get<Channel[]>('/channels').then(setChannels).catch(() => setChannels([]))
  }, [])

  async function handleGenerate() {
    if (!prompt.trim() || testing) return
    setTesting(true)
    setResult(null)
    try {
      const body: Record<string, unknown> = { prompt, model, duration_seconds: duration }
      if (label) body.label = label
      if (channelId) body.channel_id = channelId
      if (aspectRatio) body.aspect_ratio = aspectRatio
      if (resolution) body.resolution = resolution
      const res = await api.post<{ success: boolean; video_url?: string; telegram_sent?: boolean; error?: string }>(
        '/video-test',
        body
      )
      if (res.success) {
        setResult({
          success: true,
          message: res.telegram_sent ? "Video Telegram'a gönderildi!" : 'Video olusturuldu!',
          video_url: res.video_url,
        })
      } else {
        setResult({ success: false, message: res.error || 'Video olusturulamadi.' })
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Bir hata olustu.'
      setResult({ success: false, message: msg })
    } finally {
      setTesting(false)
    }
  }

  async function handleResend() {
    if (!result?.video_url || resendLoading) return
    setResendLoading(true)
    try {
      const res = await api.post<{ success: boolean; error?: string }>('/video-test/resend', {
        video_url: result.video_url,
        label: label || 'Video Test',
        model,
      })
      if (res.success) {
        alert("Telegram'a gönderildi!")
      } else {
        alert('Hata: ' + (res.error || 'Bilinmeyen hata'))
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Baglanti hatasi'
      alert(msg)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-2xl font-bold text-white mb-1">Video Test</h2>
      <p className="text-sm text-gray-500 mb-6">
        Kaydedilmis bir konsepte bagli olmadan, herhangi bir promptu hizlica video olarak uretip Telegram uzerinden test edin.
      </p>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Prompt *</label>
          <textarea value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Video icin kullanilacak AI prompt..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Etiket / Baslik (opsiyonel)</label>
            <input value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Telegram mesajinda gorunecek isim" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Kanal (opsiyonel)</label>
            <select value={channelId}
              onChange={e => setChannelId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Yok</option>
              {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Model</label>
          <select value={model}
            onChange={e => setModel(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {ATLAS_MODEL_GROUPS.map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.models.map(m => (
                  <option key={m.id} value={m.id}>{m.label} · {providerLabel(m.id)}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Sure (sn)</label>
            <input type="number" min={1} max={120} value={duration}
              onChange={e => setDuration(Number(e.target.value) || 5)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Format (En:Boy)</label>
            <select value={aspectRatio}
              onChange={e => setAspectRatio(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {ASPECT_RATIO_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Kalite</label>
            <select value={resolution}
              onChange={e => setResolution(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {RESOLUTION_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <p className="text-[10px] text-gray-600">Not: Bazi modeller belirli sure/kalite kombinasyonlarini desteklemeyebilir (orn. bazi Veo modelleri 1080p/4K icin sadece 8 sn kabul eder). Boyle durumda hata mesaji gosterilir.</p>

        {testing && (
          <div className="flex items-center gap-3 bg-purple-900/30 border border-purple-700/50 rounded-lg px-4 py-3">
            <svg className="animate-spin h-4 w-4 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <div>
              <p className="text-sm text-purple-300 font-medium">Video olusturuluyor...</p>
              <p className="text-xs text-purple-400/70">Bu islem 2-5 dakika surebilir. Lutfen bekleyin.</p>
            </div>
          </div>
        )}

        {result && (
          <div className={`rounded-lg px-4 py-3 border ${result.success ? 'bg-green-900/30 border-green-700/50' : 'bg-red-900/30 border-red-700/50'}`}>
            <p className={`text-sm font-medium ${result.success ? 'text-green-300' : 'text-red-300'}`}>
              {result.success ? '✓' : '✗'} {result.message}
            </p>
            {result.video_url && (
              <>
                <a href={result.video_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-green-400 hover:underline mt-1 block break-all">
                  {result.video_url}
                </a>
                <button
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg disabled:opacity-50 transition-colors">
                  {resendLoading ? 'Gönderiliyor...' : "📤 Telegram'a Tekrar Gönder"}
                </button>
              </>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={testing || !prompt.trim()}
            className="text-sm bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            {testing ? (
              <>
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Test ediliyor...
              </>
            ) : '▶ Video Olustur ve Test Et'}
          </button>
        </div>
      </div>
    </div>
  )
}
