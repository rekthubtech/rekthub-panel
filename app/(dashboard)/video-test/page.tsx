'use client'
import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'

interface Channel {
  id: string
  name: string
}

interface HistoryItem {
  id: string
  mode?: string | null
  provider?: string | null
  model_id?: string | null
  prompt?: string | null
  label?: string | null
  image_url?: string | null
  video_url: string
  duration_seconds?: number | null
  aspect_ratio?: string | null
  resolution?: string | null
  cost_estimate?: number | string | null
  channel_id?: string | null
  channel_name?: string | null
  telegram_sent_at?: string | null
  publish_status?: string | null
  published_at?: string | null
  youtube_video_id?: string | null
  ai_title?: string | null
  ai_description?: string | null
  publish_error?: string | null
  created_at: string
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

// Confirmed real image-to-video model IDs (Atlas Cloud catalog + BytePlus).
// Atlas Cloud follows the convention provider/model/image-to-video (verified from
// atlascloud.ai model library hrefs). BytePlus models reuse the same underlying
// model, capability is switched via the content[] array (see backend seedance.js).
const IMAGE_TO_VIDEO_MODEL_GROUPS = [
  {
    label: 'Kling (Kwaivgi)',
    models: [
      { id: 'kwaivgi/kling-v3.0-turbo/image-to-video', label: 'Kling V3.0 Turbo' },
      { id: 'kwaivgi/kling-v3.0-4k/image-to-video', label: 'Kling V3.0 4K' },
      { id: 'kwaivgi/kling-v3.0-pro/image-to-video', label: 'Kling V3.0 Pro' },
      { id: 'kwaivgi/kling-v3.0-std/image-to-video', label: 'Kling V3.0 Standard' },
      { id: 'kwaivgi/kling-video-o3-4k/image-to-video', label: 'Kling O3 4K' },
    ],
  },
  {
    label: 'Seedance (ByteDance)',
    models: [
      { id: 'bytedance/seedance-2.0/image-to-video', label: 'Seedance 2.0' },
      { id: 'bytedance/seedance-2.0-fast/image-to-video', label: 'Seedance 2.0 Fast' },
      { id: 'bytedance/seedance-2.0-mini/image-to-video', label: 'Seedance 2.0 Mini' },
    ],
  },
  {
    label: 'Wan / HappyHorse (Alibaba)',
    models: [
      { id: 'alibaba/wan-2.7/image-to-video', label: 'Wan 2.7' },
      { id: 'alibaba/happyhorse-1.1/image-to-video', label: 'HappyHorse 1.1' },
      { id: 'alibaba/happyhorse-1.0/image-to-video', label: 'HappyHorse 1.0' },
    ],
  },
  {
    label: 'Veo / Gemini (Google)',
    models: [
      { id: 'google/veo3.1/image-to-video', label: 'Veo 3.1 (Yuksek Kalite)' },
      { id: 'google/veo3.1-fast/image-to-video', label: 'Veo 3.1 Fast' },
      { id: 'google/veo3.1-lite/image-to-video', label: 'Veo 3.1 Lite' },
      { id: 'google/gemini-omni-flash/image-to-video', label: 'Gemini Omni Flash' },
    ],
  },
  {
    label: 'Vidu',
    models: [
      { id: 'vidu/q3-pro/image-to-video', label: 'Vidu Q3 Pro' },
      { id: 'vidu/q3-turbo/image-to-video', label: 'Vidu Q3 Turbo' },
    ],
  },
  {
    label: 'Diger',
    models: [
      { id: 'xai/grok-imagine-video/image-to-video', label: 'Grok Imagine Video' },
      { id: 'xai/grok-imagine-video-v1.5/image-to-video', label: 'Grok Imagine Video 1.5' },
    ],
  },
]

const BYTEPLUS_MODEL_IDS = new Set([
  'bytedance/seedance-2.0/text-to-video',
  'bytedance/seedance-2.0-fast/text-to-video',
  'bytedance/seedance-2.0-mini/text-to-video',
  'bytedance/seedance-2.0/image-to-video',
  'bytedance/seedance-2.0-fast/image-to-video',
  'bytedance/seedance-2.0-mini/image-to-video',
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

const MAX_IMAGE_BYTES = 8 * 1024 * 1024 // 8MB client-side guard
const HISTORY_PAGE_SIZE = 10

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function formatDate(iso?: string | null) {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleString('tr-TR')
  } catch {
    return iso
  }
}

function modelLabelFor(modelId?: string | null) {
  if (!modelId) return null
  for (const group of [...ATLAS_MODEL_GROUPS, ...IMAGE_TO_VIDEO_MODEL_GROUPS]) {
    const found = group.models.find(m => m.id === modelId)
    if (found) return found.label
  }
  return modelId
}

export default function VideoTestPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [mode, setMode] = useState<'text' | 'image'>('text')
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

  const [imageDataUrl, setImageDataUrl] = useState('')
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [imageError, setImageError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const modelGroups = mode === 'image' ? IMAGE_TO_VIDEO_MODEL_GROUPS : ATLAS_MODEL_GROUPS

  // Video test history
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyOffset, setHistoryOffset] = useState(0)
  const [resendingId, setResendingId] = useState<string | null>(null)

  // YouTube publish modal (2-step confirmation)
  const [publishModal, setPublishModal] = useState<{
    item: HistoryItem
    channelId: string
    step: 0 | 1 | 2
    loading: boolean
    error: string
  } | null>(null)

  useEffect(() => {
    api.get<Channel[]>('/channels').then(setChannels).catch(() => setChannels([]))
    loadHistory(0)
  }, [])

  function switchMode(next: 'text' | 'image') {
    if (next === mode) return
    setMode(next)
    setResult(null)
    const firstModel = (next === 'image' ? IMAGE_TO_VIDEO_MODEL_GROUPS : ATLAS_MODEL_GROUPS)[0]?.models[0]?.id
    if (firstModel) setModel(firstModel)
    if (next === 'text') {
      setImageDataUrl('')
      setImageUrlInput('')
      setImageError('')
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageError('')
    if (!file.type.startsWith('image/')) {
      setImageError('Lutfen bir gorsel dosyasi secin.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Gorsel 8MB\'dan kucuk olmali.')
      return
    }
    try {
      const dataUrl = await fileToDataUrl(file)
      setImageDataUrl(dataUrl)
      setImageUrlInput('')
    } catch {
      setImageError('Gorsel okunamadi, tekrar deneyin.')
    }
  }

  function clearImage() {
    setImageDataUrl('')
    setImageUrlInput('')
    setImageError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function loadHistory(offset: number) {
    setHistoryLoading(true)
    try {
      const res = await api.get<{ success: boolean; items: HistoryItem[]; total: number }>(
        `/video-test/history?limit=${HISTORY_PAGE_SIZE}&offset=${offset}`
      )
      if (res.success) {
        if (offset === 0) setHistory(res.items)
        else setHistory(prev => [...prev, ...res.items])
        setHistoryTotal(res.total)
        setHistoryOffset(offset)
      }
    } catch {
      // sessizce yut, gecmis listesi kritik degil
    } finally {
      setHistoryLoading(false)
    }
  }

  async function saveToHistory(videoUrl: string, usedImageUrl: string) {
    try {
      await api.post('/video-test/history', {
        mode: mode === 'image' ? 'image-to-video' : 'text-to-video',
        provider: providerLabel(model),
        model_id: model,
        prompt,
        label: label || null,
        image_url: usedImageUrl || null,
        video_url: videoUrl,
        duration_seconds: duration || null,
        aspect_ratio: aspectRatio || null,
        resolution: resolution || null,
        channel_id: channelId || null,
      })
      loadHistory(0)
    } catch {
      // gecmise kaydedilemese de ana akisi bozma
    }
  }

  async function handleGenerate() {
    if (!prompt.trim() || testing) return
    const finalImageUrl = imageDataUrl || imageUrlInput.trim()
    if (mode === 'image' && !finalImageUrl) {
      setImageError('Bir gorsel yukleyin veya URL girin.')
      return
    }
    setTesting(true)
    setResult(null)
    try {
      const body: Record<string, unknown> = { prompt, model, duration_seconds: duration }
      if (label) body.label = label
      if (channelId) body.channel_id = channelId
      if (aspectRatio) body.aspect_ratio = aspectRatio
      if (resolution) body.resolution = resolution
      if (mode === 'image' && finalImageUrl) body.image_url = finalImageUrl
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
        if (res.video_url) saveToHistory(res.video_url, mode === 'image' ? finalImageUrl : '')
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

  async function handleHistoryResend(item: HistoryItem) {
    if (resendingId) return
    setResendingId(item.id)
    try {
      const res = await api.post<{ success: boolean; error?: string }>(`/video-test/history/${item.id}/resend`, {})
      if (res.success) {
        alert("Telegram'a gönderildi!")
        loadHistory(0)
      } else {
        alert('Hata: ' + (res.error || 'Bilinmeyen hata'))
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Baglanti hatasi'
      alert(msg)
    } finally {
      setResendingId(null)
    }
  }

  function openPublishModal(item: HistoryItem) {
    setPublishModal({
      item,
      channelId: item.channel_id || channels[0]?.id || '',
      step: 0,
      loading: false,
      error: '',
    })
  }

  function closePublishModal() {
    if (publishModal?.loading) return
    setPublishModal(null)
  }

  function advancePublishStep() {
    if (!publishModal) return
    if (!publishModal.channelId) {
      setPublishModal({ ...publishModal, error: 'Lutfen bir kanal secin.' })
      return
    }
    if (publishModal.step === 0) {
      setPublishModal({ ...publishModal, step: 1, error: '' })
    } else if (publishModal.step === 1) {
      setPublishModal({ ...publishModal, step: 2, error: '' })
    } else if (publishModal.step === 2) {
      doPublish()
    }
  }

  async function doPublish() {
    if (!publishModal) return
    setPublishModal({ ...publishModal, loading: true, error: '' })
    try {
      const res = await api.post<{ success: boolean; youtube_video_id?: string; title?: string; error?: string }>(
        `/video-test/history/${publishModal.item.id}/publish`,
        { channel_id: publishModal.channelId }
      )
      if (res.success) {
        alert(`YouTube'a paylasildi! ${res.title ? '(' + res.title + ')' : ''}`)
        setPublishModal(null)
        loadHistory(0)
      } else {
        setPublishModal(prev => prev ? { ...prev, loading: false, error: res.error || 'Paylasim basarisiz.' } : prev)
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Baglanti hatasi'
      setPublishModal(prev => prev ? { ...prev, loading: false, error: msg } : prev)
    }
  }

  const previewSrc = imageDataUrl || (imageUrlInput.trim() ? imageUrlInput.trim() : '')

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-2xl font-bold text-white mb-1">Video Test</h2>
      <p className="text-sm text-gray-500 mb-6">
        Kaydedilmis bir konsepte bagli olmadan, herhangi bir promptu (veya gorseli) hizlica video olarak uretip Telegram uzerinden test edin.
      </p>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        {/* Mode toggle */}
        <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
          <button
            type="button"
            onClick={() => switchMode('text')}
            className={`flex-1 text-sm py-2 rounded-md transition-colors font-medium ${
              mode === 'text' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            📝 Metinden Video
          </button>
          <button
            type="button"
            onClick={() => switchMode('image')}
            className={`flex-1 text-sm py-2 rounded-md transition-colors font-medium ${
              mode === 'image' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            🖼️ Gorselden Video
          </button>
        </div>

        {mode === 'image' && (
          <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4 space-y-3">
            <label className="text-xs text-gray-400 block">Baslangic Gorseli *</label>
            <div className="flex gap-3 items-start">
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:text-xs file:cursor-pointer hover:file:bg-purple-700 cursor-pointer"
                />
                <div className="text-[10px] text-gray-500 text-center">veya</div>
                <input
                  value={imageUrlInput}
                  onChange={e => {
                    setImageUrlInput(e.target.value)
                    setImageDataUrl('')
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  placeholder="https://... (herkese acik gorsel URL'si)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {imageError && <p className="text-[11px] text-red-400">{imageError}</p>}
              </div>
              {previewSrc && (
                <div className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewSrc} alt="onizleme" className="w-20 h-20 object-cover rounded-lg border border-gray-700" />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 text-xs leading-none flex items-center justify-center"
                    title="Kaldir"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-600">Gorsel ilk kare olarak kullanilir; model gorseli promptunuza gore animasyonlu hale getirir. Maks. 8MB.</p>
          </div>
        )}

        <div>
          <label className="text-xs text-gray-400 block mb-1">Prompt *</label>
          <textarea value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={mode === 'image' ? 'Gorseldeki sahnenin nasil hareket edecegini tarif edin...' : 'Video icin kullanilacak AI prompt...'} />
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
          <label className="text-xs text-gray-400 block mb-1">Model {mode === 'image' && <span className="text-purple-400">(sadece gorselden-video destekleyenler)</span>}</label>
          <select value={model}
            onChange={e => setModel(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {modelGroups.map(group => (
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
            disabled={testing || !prompt.trim() || (mode === 'image' && !imageDataUrl && !imageUrlInput.trim())}
            className="text-sm bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            {testing ? (
              <>
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Test ediliyor...
              </>
            ) : mode === 'image' ? '▶ Gorselden Video Olustur' : '▶ Video Olustur ve Test Et'}
          </button>
        </div>
      </div>

      {/* Video Test Gecmisi */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Video Test Gecmisi</h3>
          <button
            onClick={() => loadHistory(0)}
            disabled={historyLoading}
            className="text-xs text-gray-400 hover:text-white disabled:opacity-50 transition-colors">
            {historyLoading ? 'Yenileniyor...' : '↻ Yenile'}
          </button>
        </div>

        {history.length === 0 && !historyLoading && (
          <p className="text-sm text-gray-600">Henuz olusturulmus test videosu yok.</p>
        )}

        <div className="space-y-3">
          {history.map(item => (
            <div key={item.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-medium truncate">
                    {item.label || item.prompt || 'Video Test'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {modelLabelFor(item.model_id) || 'Bilinmeyen model'}
                    {item.provider ? ` · ${item.provider}` : ''}
                    {item.duration_seconds ? ` · ${item.duration_seconds}sn` : ''}
                    {item.aspect_ratio ? ` · ${item.aspect_ratio}` : ''}
                    {item.resolution ? ` · ${item.resolution}` : ''}
                    {item.channel_name ? ` · ${item.channel_name}` : ''}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{formatDate(item.created_at)}</p>
                </div>
                <div className="shrink-0">
                  {item.publish_status === 'published' ? (
                    <span className="text-[10px] bg-green-900/40 border border-green-700/50 text-green-300 px-2 py-1 rounded-full whitespace-nowrap">
                      ✓ YouTube&apos;a Yayinlandi
                    </span>
                  ) : item.publish_status === 'failed' ? (
                    <span className="text-[10px] bg-red-900/40 border border-red-700/50 text-red-300 px-2 py-1 rounded-full whitespace-nowrap">
                      ✗ Paylasim Basarisiz
                    </span>
                  ) : null}
                </div>
              </div>

              <a href={item.video_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline mt-2 block break-all">
                {item.video_url}
              </a>

              {item.publish_status === 'published' && item.youtube_video_id && (
                <a href={`https://youtube.com/watch?v=${item.youtube_video_id}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-green-400 hover:underline mt-1 block">
                  ▶ YouTube&apos;da ac: {item.ai_title || item.youtube_video_id}
                </a>
              )}
              {item.publish_status === 'failed' && item.publish_error && (
                <p className="text-[10px] text-red-400 mt-1 break-all">{item.publish_error}</p>
              )}

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleHistoryResend(item)}
                  disabled={resendingId === item.id}
                  className="flex-1 bg-blue-600/80 hover:bg-blue-600 text-white text-xs py-2 rounded-lg disabled:opacity-50 transition-colors">
                  {resendingId === item.id ? 'Gönderiliyor...' : "📤 Telegram'a Gönder"}
                </button>
                {item.publish_status !== 'published' && (
                  <button
                    onClick={() => openPublishModal(item)}
                    className="flex-1 bg-purple-600/80 hover:bg-purple-600 text-white text-xs py-2 rounded-lg transition-colors">
                    ▶ YouTube&apos;a Paylas
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {history.length < historyTotal && (
          <button
            onClick={() => loadHistory(historyOffset + HISTORY_PAGE_SIZE)}
            disabled={historyLoading}
            className="w-full mt-3 text-xs text-gray-400 hover:text-white border border-gray-800 rounded-lg py-2 disabled:opacity-50 transition-colors">
            {historyLoading ? 'Yükleniyor...' : `Daha Fazla Yükle (${history.length}/${historyTotal})`}
          </button>
        )}
      </div>

      {/* YouTube Paylasim Modali - kanal secimi + cift onay */}
      {publishModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 max-w-md w-full">
            {publishModal.step === 0 && (
              <>
                <h4 className="text-white font-semibold mb-3">YouTube&apos;a Paylas</h4>
                <p className="text-xs text-gray-500 mb-3 break-all">
                  {publishModal.item.label || publishModal.item.prompt || 'Video Test'}
                </p>
                <label className="text-xs text-gray-400 block mb-1">Kanal Sec *</label>
                <select
                  value={publishModal.channelId}
                  onChange={e => setPublishModal({ ...publishModal, channelId: e.target.value, error: '' })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3">
                  <option value="">Kanal secin...</option>
                  {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {publishModal.error && <p className="text-xs text-red-400 mb-3">{publishModal.error}</p>}
                <div className="flex gap-2">
                  <button onClick={closePublishModal}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 rounded-lg transition-colors">
                    Vazgec
                  </button>
                  <button onClick={advancePublishStep}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 rounded-lg transition-colors">
                    Devam Et
                  </button>
                </div>
              </>
            )}

            {(publishModal.step === 1 || publishModal.step === 2) && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">⚠️</span>
                  <h4 className="text-white font-semibold">Emin misin?</h4>
                </div>
                <p className="text-sm text-gray-300 mb-1">
                  Videoyu YouTube&apos;a paylasmak üzeresin. Emin misin?
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Kanal: <span className="text-gray-300">{channels.find(c => c.id === publishModal.channelId)?.name || '-'}</span>
                  {publishModal.step === 2 && <span className="block mt-1 text-yellow-400">Bu son onay — devam edersen video hemen yayinlanir.</span>}
                </p>
                {publishModal.error && <p className="text-xs text-red-400 mb-3">{publishModal.error}</p>}
                <div className="flex gap-2">
                  <button onClick={closePublishModal} disabled={publishModal.loading}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 rounded-lg disabled:opacity-50 transition-colors">
                    Vazgec
                  </button>
                  <button onClick={advancePublishStep} disabled={publishModal.loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-lg disabled:opacity-50 transition-colors">
                    {publishModal.loading ? 'Paylasiliyor...' : publishModal.step === 1 ? 'Evet, Devam Et' : 'Evet, Paylas'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
