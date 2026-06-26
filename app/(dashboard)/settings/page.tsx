'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Settings {
  default_model: string; auto_publish: boolean; daily_limit: number;
  notification_email: string; timezone: string;
}

const MODELS = [
  'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro',
  'gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1',
  'claude-3-5-haiku-20241022', 'claude-3-7-sonnet-20250219',
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    default_model: 'gemini-2.0-flash',
    auto_publish: false,
    daily_limit: 5,
    notification_email: '',
    timezone: 'Europe/Istanbul',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    setLoading(true)
    try { setSettings(await api.get<Settings>('/settings')) }
    catch { /* keep defaults */ }
    finally { setLoading(false) }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch('/settings', settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally { setSaving(false) }
  }

  if (loading) return <div className="p-8 text-center">Yükleniyor…</div>

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Ayarlar</h2>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Genel</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Varsayılan Model</label>
            <select value={settings.default_model}
              onChange={e => setSettings(s => ({ ...s, default_model: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {MODELS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Günlük Video Limiti</label>
            <input type="number" min={1} max={50} value={settings.daily_limit}
              onChange={e => setSettings(s => ({ ...s, daily_limit: +e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Otomatik Yayın</p>
              <p className="text-xs text-gray-400">Onaylanan konseptleri otomatik yayınla</p>
            </div>
            <button type="button" onClick={() => setSettings(s => ({ ...s, auto_publish: !s.auto_publish }))}
              className={`w-10 h-6 rounded-full transition-colors ${settings.auto_publish ? 'bg-blue-600' : 'bg-gray-200'}`}>
              <span className={`block w-4 h-4 bg-white rounded-full mx-auto transition-transform ${settings.auto_publish ? 'translate-x-2' : '-translate-x-2'}`} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Bildirimler</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bildirim E-postası</label>
            <input type="email" value={settings.notification_email}
              onChange={e => setSettings(s => ({ ...s, notification_email: e.target.value }))}
              placeholder="ornek@email.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zaman Dilimi</label>
            <input type="text" value={settings.timezone}
              onChange={e => setSettings(s => ({ ...s, timezone: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          {saved && <span className="text-sm text-green-600">Kaydedildi ✓</span>}
        </div>
      </form>
    </div>
  )
}
