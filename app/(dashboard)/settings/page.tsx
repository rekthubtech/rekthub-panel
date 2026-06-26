'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Model { id: number; name: string; provider: string; input_price_per_m: number; output_price_per_m: number; is_enabled: boolean; capabilities: string[] }
interface TelegramSettings { enabled: boolean; chat_id: string; notify_on_publish: boolean; notify_on_error: boolean; notify_on_daily_summary: boolean }
interface TrendSettings { enabled: boolean; languages: string[]; niches: string[]; daily_limit: number; model_id: number; prompt_template: string }
interface User { id: number; email: string; role: string; created_at: string }
interface AuditLog { id: number; user_email: string; action: string; details: string; ip: string; created_at: string }

function ModelsTab() {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get<Model[]>('/models').then(d => { setModels(d); setLoading(false) })
  }, [])
  async function toggle(id: number, enabled: boolean) {
    await api.patch(`/models/${id}`, { is_enabled: enabled })
    setModels(prev => prev.map(m => m.id === id ? { ...m, is_enabled: enabled } : m))
  }
  if (loading) return <div className="p-4">YÃ¼kleniyor...</div>
  return (
    <div className="space-y-3">
      {models.map(m => (
        <div key={m.id} className="flex justify-between items-center p-4 border rounded-xl">
          <div>
            <p className="font-medium">{m.name}</p>
            <p className="text-xs text-gray-500">{m.provider} - in: ${m.input_price_per_m}/M | out: ${m.output_price_per_m}/M</p>
          </div>
          <button onClick={() => toggle(m.id, !m.is_enabled)} className={`px-3 py-1 rounded-full text-sm ${m.is_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {m.is_enabled ? 'Aktif' : 'Pasif'}
          </button>
        </div>
      ))}
    </div>
  )
}

function TelegramTab() {
  const [settings, setSettings] = useState<TelegramSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    api.get<TelegramSettings>('/settings/telegram').then(setSettings)
  }, [])
  async function save() {
    setSaving(true)
    await api.patch('/settings/telegram', settings)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }
  if (!settings) return <div className="p-4">YÃ¼kleniyor...</div>
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input type="checkbox" id="tg-enabled" checked={settings.enabled} onChange={e => setSettings(p => ({...p!, enabled: e.target.checked}))} className="w-4 h-4" />
        <label htmlFor="tg-enabled" className="font-medium">Bildirimleri Aktif Et</label>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Chat ID</label>
        <input type="text" value={settings.chat_id} onChange={e => setSettings(p => ({...p!, chat_id: e.target.value}))} className="w-full border rounded-lg p-2" />
      </div>
      {[
        { key: 'notify_on_publish' as keyof TelegramSettings, label: 'YayÄ±n Bildirimleri' },
        { key: 'notify_on_error' as keyof TelegramSettings, label: 'Hata Bildirimleri' },
        { key: 'notify_on_daily_summary' as keyof TelegramSettings, label: 'GÃ¼nlÃ¼k Ãzet Bildirimleri' },
      ].map(opt => (
        <div key={opt.key} className="flex items-center gap-3">
          <input type="checkbox" id={opt.key} checked={!!(settings[opt.key] as boolean)} onChange={e => setSettings(p => ({...p!, [opt.key]: e.target.checked}))} className="w-4 h-4" />
          <label htmlFor={opt.key}>{opt.label}</label>
        </div>
      ))}
      <button onClick={save} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
        {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi!' : 'Kaydet'}
      </button>
    </div>
  )
}

function TrendTab() {
  const [settings, setSettings] = useState<TrendSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    api.get<TrendSettings>('/settings/trend-ideas').then(setSettings)
  }, [])
  async function save() {
    setSaving(true)
    await api.patch('/settings/trend-ideas', settings)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }
  if (!settings) return <div className="p-4">YÃ¼kleniyor...</div>
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input type="checkbox" id="trend-enabled" checked={settings.enabled} onChange={e => setSettings(p => ({...p!, enabled: e.target.checked}))} className="w-4 h-4" />
        <label htmlFor="trend-enabled" className="font-medium">Fikir Ãreticisini Aktif Et</label>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Diller (virgÃ¼l ayrÄ±lÄ±)</label>
          <input type="text" value={settings.languages.join(',')} onChange={e => setSettings(p => ({...p!, languages: e.target.value.split(',').map(s => s.trim())}))} className="w-full border rounded-lg p-2" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">NiÅler (virgÃ¼l ayrÄ±lÄ±)</label>
          <input type="text" value={settings.niches.join(',')} onChange={e => setSettings(p => ({...p!, niches: e.target.value.split(',').map(s => s.trim())}))} className="w-full border rounded-lg p-2" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">GÃ¼nlÃ¼k Limit</label>
        <input type="number" value={settings.daily_limit} onChange={e => setSettings(p => ({...p!, daily_limit: parseInt(e.target.value)}))} className="w-full border rounded-lg p-2" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Prompt Åablonu</label>
        <textarea value={settings.prompt_template} onChange={e => setSettings(p => ({...p!, prompt_template: e.target.value}))} className="w-full border rounded-lg p-2" rows={6} />
      </div>
      <button onClick={save} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
        {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi!' : 'Kaydet'}
      </button>
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [invited, setInvited] = useState(false)
  useEffect(() => {
    api.get<User[]>('/users').then(setUsers)
  }, [])
  async function invite() {
    setInviting(true)
    await api.post('/auth/invite', { email: inviteEmail })
    setInviting(false); setInvited(true); setInviteEmail('')
    setTimeout(() => setInvited(false), 3000)
  }
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input type="email" placeholder="Davet edilecek e-posta" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="flex-1 border rounded-lg p-2" />
        <button onClick={invite} disabled={inviting || !inviteEmail} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
          {inviting ? 'GÃ¶nderiliyor...' : invited ? 'GÃ¶nderildi!' : 'Davet GÃ¶nder'}
        </button>
      </div>
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="flex justify-between items-center p-3 border rounded-xl">
            <div>
              <p className="font-medium">{u.email}</p>
              <p className="text-xs text-gray-500">{u.role} Â· {new Date(u.created_at).toLocaleDateString('tr-TR')}</p>
            </div>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{u.role}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AuditTab() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get<AuditLog[]>('/audit-logs').then(d => { setLogs(d); setLoading(false) })
  }, [])
  if (loading) return <div className="p-4">YÃ¼kleniyor...</div>
  return (
    <div className="space-y-2">
      {logs.map(l => (
        <div key={l.id} className="p-3 border rounded-xl">
          <div className="flex justify-between items-start">
            <span className="font-medium text-sm">{l.action}</span>
            <span className="text-xs text-gray-400">{new Date(l.created_at).toLocaleString('tr-TR')}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{l.user_email} Â· {l.details}</p>
        </div>
      ))}
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('models')
  const tabs = [
    { id: 'models', label: 'Modeller' },
    { id: 'telegram', label: 'Telegram' },
    { id: 'trend', label: 'Trend Fikret' },
    { id: 'users', label: 'KullanÄ±cÄ±lar' },
    { id: 'audit', label: 'Denetim GÃ¼nlÃ¼ÄÃ¼' },
  ]
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Ayarlar</h2>
      <div className="flex gap-1 mb-6 border-b">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        {activeTab === 'models' && <ModelsTab />}
        {activeTab === 'telegram' && <TelegramTab />}
        {activeTab === 'trend' && <TrendTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'audit' && <AuditTab />}
      </div>
    </div>
  )
}
