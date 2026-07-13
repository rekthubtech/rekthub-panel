'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Channel {
  id: string
  name: string
}

interface Publication {
  channel_id: string
  channel_name: string | null
  mode: string
  youtube_video_id: string | null
  status: string
  published_at: string
}

interface ArchiveVideo {
  id: string
  source: string
  source_id: string | null
  origin_channel_id: string | null
  origin_channel_name: string | null
  title: string | null
  description: string | null
  model: string | null
  provider: string | null
  duration_seconds: number | null
  aspect_ratio: string | null
  resolution: string | null
  cost_usd: number | string | null
  status: string
  created_at: string
  publications: Publication[]
}

const PAGE_SIZE = 12

function formatDate(iso?: string | null) {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleString('tr-TR')
  } catch {
    return iso
  }
}

function formatCost(v: number | string | null) {
  if (v === null || v === undefined) return '-'
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (Number.isNaN(n)) return '-'
  return '$' + n.toFixed(3)
}

function sourceLabel(s: string) {
  if (s === 'schedule') return 'Zamanlayıcı'
  if (s === 'test') return 'Video Test'
  return s
}

export default function ArchivePage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [videos, setVideos] = useState<ArchiveVideo[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)

  const [filterChannel, setFilterChannel] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterNotSentTo, setFilterNotSentTo] = useState('')
  const [search, setSearch] = useState('')

  const [publishModal, setPublishModal] = useState<{
    video: ArchiveVideo
    mode: 'reuse' | 'new'
    channelId: string
    step: 0 | 1
    loading: boolean
    error: string
    quotaWarning: string | null
  } | null>(null)

  useEffect(() => {
    api.get<Channel[]>('/channels').then(setChannels).catch(() => setChannels([]))
    load(0, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load(newOffset: number, replace: boolean) {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', String(PAGE_SIZE))
      params.set('offset', String(newOffset))
      if (filterChannel) params.set('channel_id', filterChannel)
      if (filterSource) params.set('source', filterSource)
      if (filterNotSentTo) params.set('not_sent_to', filterNotSentTo)
      if (search.trim()) params.set('search', search.trim())
      const res = await api.get<{ success: boolean; videos: ArchiveVideo[]; total: number }>(
        `/archive?${params.toString()}`
      )
      if (res.success) {
        setVideos(prev => (replace ? res.videos : [...prev, ...res.videos]))
        setTotal(res.total)
        setOffset(newOffset)
      }
    } catch {
      // arsiv listesi kritik degil, sessizce yut
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    load(0, true)
  }

  function openPublishModal(video: ArchiveVideo, mode: 'reuse' | 'new') {
    setPublishModal({
      video,
      mode,
      channelId: channels.find(c => c.id !== video.origin_channel_id)?.id || channels[0]?.id || '',
      step: 0,
      loading: false,
      error: '',
      quotaWarning: null,
    })
  }

  function closePublishModal() {
    if (publishModal?.loading) return
    setPublishModal(null)
  }

  function advance() {
    if (!publishModal) return
    if (!publishModal.channelId) {
      setPublishModal({ ...publishModal, error: 'Lütfen bir kanal seçin.' })
      return
    }
    if (publishModal.step === 0) {
      setPublishModal({ ...publishModal, step: 1, error: '' })
    } else {
      doPublish()
    }
  }

  async function doPublish() {
    if (!publishModal) return
    setPublishModal({ ...publishModal, loading: true, error: '' })
    try {
      const res = await api.post<{
        success: boolean
        youtube_video_id?: string
        title?: string
        error?: string
        quota_warning?: string | null
      }>(`/archive/${publishModal.video.id}/publish`, {
        channel_id: publishModal.channelId,
        mode: publishModal.mode,
      })
      if (res.success) {
        if (res.quota_warning) {
          alert(`YouTube'a paylaşıldı! ${res.title ? '(' + res.title + ')' : ''}\n\n⚠️ ${res.quota_warning}`)
        } else {
          alert(`YouTube'a paylaşıldı! ${res.title ? '(' + res.title + ')' : ''}`)
        }
        setPublishModal(null)
        load(0, true)
      } else {
        setPublishModal(prev => (prev ? { ...prev, loading: false, error: res.error || 'Paylaşım başarısız.' } : prev))
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Bağlantı hatası'
      setPublishModal(prev => (prev ? { ...prev, loading: false, error: msg } : prev))
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      <h2 className="text-2xl font-bold text-white mb-1">Arşiv</h2>
      <p className="text-sm text-gray-500 mb-6">
        Üretilen tüm videolar burada saklanır. Herhangi bir videoyu tek bir buton ile istediğin kanala tekrar
        yükleyebilirsin — &quot;Yükle&quot; mevcut başlık/açıklamayı kullanır, &quot;Yeni video gibi yükle&quot; her kanal
        için yeni ve farklı başlık/açıklama/SEO üretir.
      </p>

      {/* Filtreler */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-5 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Üretildiği Kanal</label>
          <select
            value={filterChannel}
            onChange={e => setFilterChannel(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tümü</option>
            {channels.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Kaynak</label>
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tümü</option>
            <option value="schedule">Zamanlayıcı</option>
            <option value="test">Video Test</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Henüz Gitmedi</label>
          <select
            value={filterNotSentTo}
            onChange={e => setFilterNotSentTo(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Fark etmez</option>
            {channels.map(c => (
              <option key={c.id} value={c.id}>{c.name}&apos;a gitmedi</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Ara</label>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyFilters() }}
            placeholder="Başlık veya açıklamada ara..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="sm:col-span-4 flex justify-end">
          <button
            onClick={applyFilters}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            Filtrele
          </button>
        </div>
      </div>

      {videos.length === 0 && !loading && (
        <p className="text-sm text-gray-600">Arşivde henüz video yok.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {videos.map(v => (
          <div key={v.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex flex-col">
            <p className="text-sm text-white font-medium truncate">{v.title || 'Adsız Video'}</p>
            {v.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{v.description}</p>
            )}
            <p className="text-[11px] text-gray-500 mt-2">
              {sourceLabel(v.source)}
              {v.origin_channel_name ? ` · ${v.origin_channel_name}` : ''}
              {v.model ? ` · ${v.model}` : ''}
              {v.provider ? ` · ${v.provider}` : ''}
            </p>
            <p className="text-[11px] text-gray-600 mt-0.5">
              {v.duration_seconds ? `${v.duration_seconds}sn` : ''}
              {v.aspect_ratio ? ` · ${v.aspect_ratio}` : ''}
              {v.resolution ? ` · ${v.resolution}` : ''}
              {' · '}{formatCost(v.cost_usd)}
              {' · '}{formatDate(v.created_at)}
            </p>

            {v.publications.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {v.publications.map((p, i) => (
                  <span
                    key={i}
                    title={formatDate(p.published_at)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap ${
                      p.status === 'completed'
                        ? 'bg-green-900/30 border-green-700/50 text-green-300'
                        : 'bg-red-900/30 border-red-700/50 text-red-300'
                    }`}>
                    {p.status === 'completed' ? '✓' : '✗'} {p.channel_name || p.channel_id}
                    {p.mode === 'new' ? ' (yeni)' : ''}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => openPublishModal(v, 'reuse')}
                className="flex-1 bg-blue-600/80 hover:bg-blue-600 text-white text-xs py-2 rounded-lg transition-colors">
                ▶ Yükle
              </button>
              <button
                onClick={() => openPublishModal(v, 'new')}
                className="flex-1 bg-purple-600/80 hover:bg-purple-600 text-white text-xs py-2 rounded-lg transition-colors">
                ✨ Yeni Video Gibi Yükle
              </button>
            </div>
          </div>
        ))}
      </div>

      {videos.length < total && (
        <button
          onClick={() => load(offset + PAGE_SIZE, false)}
          disabled={loading}
          className="w-full mt-4 text-xs text-gray-400 hover:text-white border border-gray-800 rounded-lg py-2 disabled:opacity-50 transition-colors">
          {loading ? 'Yükleniyor...' : `Daha Fazla Yükle (${videos.length}/${total})`}
        </button>
      )}

      {/* Yukle / Yeni video gibi yukle modali */}
      {publishModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 max-w-md w-full">
            {publishModal.step === 0 && (
              <>
                <h4 className="text-white font-semibold mb-3">
                  {publishModal.mode === 'new' ? '✨ Yeni Video Gibi Yükle' : '▶ Yükle'}
                </h4>
                <p className="text-xs text-gray-500 mb-3 break-all">
                  {publishModal.video.title || 'Adsız Video'}
                </p>
                <p className="text-[11px] text-gray-600 mb-3">
                  {publishModal.mode === 'new'
                    ? 'Bu kanal için yeni ve farklı başlık/açıklama/SEO üretilecek.'
                    : 'Mevcut başlık/açıklama aynen kullanılacak.'}
                </p>
                <label className="text-xs text-gray-400 block mb-1">Kanal Seç *</label>
                <select
                  value={publishModal.channelId}
                  onChange={e => setPublishModal({ ...publishModal, channelId: e.target.value, error: '' })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3">
                  <option value="">Kanal seçin...</option>
                  {channels.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {publishModal.error && <p className="text-xs text-red-400 mb-3">{publishModal.error}</p>}
                <div className="flex gap-2">
                  <button onClick={closePublishModal}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 rounded-lg transition-colors">
                    Vazgeç
                  </button>
                  <button onClick={advance}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 rounded-lg transition-colors">
                    Devam Et
                  </button>
                </div>
              </>
            )}

            {publishModal.step === 1 && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">⚠️</span>
                  <h4 className="text-white font-semibold">Emin misin?</h4>
                </div>
                <p className="text-sm text-gray-300 mb-1">
                  Video YouTube&apos;a yayınlanacak. Devam edersen hemen yüklenir.
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Kanal: <span className="text-gray-300">{channels.find(c => c.id === publishModal.channelId)?.name || '-'}</span>
                  {' · '}Mod: <span className="text-gray-300">{publishModal.mode === 'new' ? 'Yeni video gibi' : 'Mevcut içerikle'}</span>
                </p>
                {publishModal.error && <p className="text-xs text-red-400 mb-3">{publishModal.error}</p>}
                <div className="flex gap-2">
                  <button onClick={closePublishModal} disabled={publishModal.loading}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 rounded-lg disabled:opacity-50 transition-colors">
                    Vazgeç
                  </button>
                  <button onClick={advance} disabled={publishModal.loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-lg disabled:opacity-50 transition-colors">
                    {publishModal.loading ? 'Paylaşılıyor...' : 'Evet, Paylaş'}
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
