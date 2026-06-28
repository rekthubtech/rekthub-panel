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

  // Password change state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null)

  // New admin user state
  const [userForm, setUserForm] = useState({ email: '', username: '', password: '' })
  const [userSaving, setUserSaving] = useState(false)
  const [userMsg, setUserMsg] = useState<{ text: string; ok: boolean } | null>(null)

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

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ text: 'Yeni sifreler eslесmiyor.', ok: false })
      return
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ text: 'Yeni sifre en az 6 karakter olmali.', ok: false })
      return
    }
    setPwSaving(true)
    setPwMsg(null)
    try {
      await api.patch('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      setPwMsg({ text: 'Sifre basariyla degistirildi.', ok: true })
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bir hata olustu.'
      setPwMsg({ text: msg, ok: false })
    } finally { setPwSaving(false) }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    if (!userForm.email || !userForm.password) {
      setUserMsg({ text: 'E-posta ve sifre zorunludur.', ok: false })
      return
    }
    setUserSaving(true)
    setUserMsg(null)
    try {
      await api.post('/users', {
        email: userForm.email,
        username: userForm.username || undefined,
        password: userForm.password,
      })
      setUserMsg({ text: 'Admin kullanici basariyla eklendi.', ok: true })
      setUserForm({ email: '', username: '', password: '' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bir hata olustu.'
      setUserMsg({ text: msg, ok: false })
    } finally { setUserSaving(false) }
  }

  if (loading) return <div className="p-8 text-center">Yukleniyor...</div>

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Ayarlar</h2>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Genel</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Varsayilan Model</label>
            <select value={settings.default_model}
              onChange={e => setSettings(s => ({ ...s, default_model: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {MODELS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gunluk Video Limiti</label>
            <input type="number" min={1} max={50} value={settings.daily_limit}
              onChange={e => setSettings(s => ({ ...s, daily_limit: +e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Otomatik Yayin</p>
              <p className="text-xs text-gray-400">Onaylanan konseptleri otomatik yayinla</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Bildirim E-postasi</label>
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
          {saved && <span className="text-sm text-green-600">Kaydedildi</span>}
        </div>
      </form>

      <form onSubmit={handlePasswordChange} className="mt-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Sifre Degistir</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mevcut Sifre</label>
            <input type="password" value={pwForm.currentPassword}
              onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Sifre</label>
            <input type="password" value={pwForm.newPassword}
              onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Sifre (Tekrar)</label>
            <input type="password" value={pwForm.confirmPassword}
              onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={pwSaving}
              className="bg-blue-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {pwSaving ? 'Degistiriliyor...' : 'Sifreyi Degistir'}
            </button>
            {pwMsg && (
              <span className={`text-sm ${pwMsg.ok ? 'text-green-600' : 'text-red-600'}`}>
                {pwMsg.text}
              </span>
            )}
          </div>
        </div>
      </form>

      <form onSubmit={handleAddUser} className="mt-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Yeni Admin Kullanici Ekle</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input type="email" value={userForm.email}
              onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}
              placeholder="admin@ornek.com"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kullanici Adi (istege bagli)</label>
            <input type="text" value={userForm.username}
              onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))}
              placeholder="admin"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sifre</label>
            <input type="password" value={userForm.password}
              onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={userSaving}
              className="bg-blue-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {userSaving ? 'Ekleniyor...' : 'Kullanici Ekle'}
            </button>
            {userMsg && (
              <span className={`text-sm ${userMsg.ok ? 'text-green-600' : 'text-red-600'}`}>
                {userMsg.text}
              </span>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
