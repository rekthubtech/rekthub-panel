'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Settings {
  default_model: string; auto_publish: boolean;
  notification_email: string; timezone: string;
}

const MODELS = [
  'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro',
  'gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1',
  'claude-3-5-haiku-20241022', 'claude-3-7-sonnet-20250219',
]

const IconSettings = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
)
const IconBell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
)
const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
)
const IconUserPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>
)
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M20 6 9 17l-5-5"/></svg>
)
const IconAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
)

function SectionCard({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-5 shadow-lg shadow-black/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">{icon}</div>
        <div className="min-w-0">
          <h3 className="font-semibold text-white text-[15px] leading-tight">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label className="block text-xs text-gray-400 font-medium mb-1.5">
      {children}{hint && <span className="text-gray-600 font-normal"> {hint}</span>}
    </label>
  )
}

const inputClass = "w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"

function InlineMsg({ msg }: { msg: { text: string; ok: boolean } | null }) {
  if (!msg) return null
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>
      {msg.ok ? <IconCheck /> : <IconAlert />} {msg.text}
    </span>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    default_model: 'gemini-2.0-flash',
    auto_publish: false,
    notification_email: '',
    timezone: 'Europe/Istanbul',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null)

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
      setPwMsg({ text: 'Yeni şifreler eşleşmiyor.', ok: false })
      return
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ text: 'Yeni şifre en az 6 karakter olmalı.', ok: false })
      return
    }
    setPwSaving(true)
    setPwMsg(null)
    try {
      await api.patch('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      setPwMsg({ text: 'Şifre başarıyla değiştirildi.', ok: true })
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bir hata oluştu.'
      setPwMsg({ text: msg, ok: false })
    } finally { setPwSaving(false) }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    if (!userForm.email || !userForm.password) {
      setUserMsg({ text: 'E-posta ve şifre zorunludur.', ok: false })
      return
    }
    setUserSaving(true)
    setUserMsg(null)
    try {
      await api.post('/users', {
        email: userForm.email,
        username: userForm.username || userForm.email.split('@')[0],
        password: userForm.password,
      })
      setUserMsg({ text: 'Admin kullanıcı başarıyla eklendi.', ok: true })
      setUserForm({ email: '', username: '', password: '' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bir hata oluştu.'
      setUserMsg({ text: msg, ok: false })
    } finally { setUserSaving(false) }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Yükleniyor…</div>

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-2xl font-bold text-white mb-1">Ayarlar</h2>
      <p className="text-sm text-gray-500 mb-6">Genel tercihler, bildirimler, güvenlik ve kullanıcı yönetimi</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <form onSubmit={handleSave}>
          <SectionCard icon={<IconSettings />} title="Genel" subtitle="Varsayılan model ve yayın davranışı">
            <div>
              <FieldLabel>Varsayılan Model</FieldLabel>
              <select value={settings.default_model}
                onChange={e => setSettings(s => ({ ...s, default_model: e.target.value }))}
                className={inputClass}>
                {MODELS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between bg-black/20 border border-white/10 rounded-xl px-4 py-3">
              <div className="min-w-0 pr-3">
                <p className="text-sm font-medium text-gray-200">Otomatik Yayın</p>
                <p className="text-xs text-gray-500 mt-0.5">Onaylanan konseptleri otomatik yayınla</p>
              </div>
              <button type="button" onClick={() => setSettings(s => ({ ...s, auto_publish: !s.auto_publish }))}
                className={`w-10 h-6 rounded-full transition-colors shrink-0 ${settings.auto_publish ? 'bg-blue-600' : 'bg-gray-700'}`}>
                <span className={`block w-4 h-4 bg-white rounded-full transition-transform ${settings.auto_publish ? 'translate-x-[18px]' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="pt-1 border-t border-white/5" />

            <div>
              <FieldLabel>Bildirim E-postası</FieldLabel>
              <input type="email" value={settings.notification_email}
                onChange={e => setSettings(s => ({ ...s, notification_email: e.target.value }))}
                placeholder="ornek@email.com"
                className={inputClass} />
            </div>
            <div>
              <FieldLabel>Zaman Dilimi</FieldLabel>
              <input type="text" value={settings.timezone}
                onChange={e => setSettings(s => ({ ...s, timezone: e.target.value }))}
                className={inputClass} />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={saving}
                className="bg-blue-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-600/20">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              {saved && <InlineMsg msg={{ text: 'Kaydedildi', ok: true }} />}
            </div>
          </SectionCard>
        </form>

        <div className="space-y-5">
          <form onSubmit={handlePasswordChange}>
            <SectionCard icon={<IconLock />} title="Şifre Değiştir" subtitle="Hesap şifrenizi güncelleyin">
              <div>
                <FieldLabel>Mevcut Şifre</FieldLabel>
                <input type="password" value={pwForm.currentPassword}
                  onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                  required
                  className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Yeni Şifre</FieldLabel>
                  <input type="password" value={pwForm.newPassword}
                    onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                    required
                    className={inputClass} />
                </div>
                <div>
                  <FieldLabel>Tekrar</FieldLabel>
                  <input type="password" value={pwForm.confirmPassword}
                    onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    required
                    className={inputClass} />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1 flex-wrap">
                <button type="submit" disabled={pwSaving}
                  className="bg-blue-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-600/20">
                  {pwSaving ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                </button>
                <InlineMsg msg={pwMsg} />
              </div>
            </SectionCard>
          </form>

          <form onSubmit={handleAddUser}>
            <SectionCard icon={<IconUserPlus />} title="Yeni Admin Kullanıcı Ekle" subtitle="Panele erişimi olan yeni bir hesap oluşturun">
              <div>
                <FieldLabel>E-posta</FieldLabel>
                <input type="email" value={userForm.email}
                  onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="admin@ornek.com"
                  required
                  className={inputClass} />
              </div>
              <div>
                <FieldLabel hint="(isteğe bağlı)">Kullanıcı Adı</FieldLabel>
                <input type="text" value={userForm.username}
                  onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="Boş bırakırsanız e-posta öneki kullanılır"
                  className={inputClass} />
              </div>
              <div>
                <FieldLabel>Şifre</FieldLabel>
                <input type="password" value={userForm.password}
                  onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
                  required
                  className={inputClass} />
              </div>
              <div className="flex items-center gap-3 pt-1 flex-wrap">
                <button type="submit" disabled={userSaving}
                  className="bg-blue-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-600/20">
                  {userSaving ? 'Ekleniyor...' : 'Kullanıcı Ekle'}
                </button>
                <InlineMsg msg={userMsg} />
              </div>
            </SectionCard>
          </form>
        </div>
      </div>
    </div>
  )
}
