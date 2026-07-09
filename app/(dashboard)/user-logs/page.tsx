'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

type Session = { id: string; panel_user: { id: string; email: string; role: string } | null; login_at: string; logout_at: string | null; duration_seconds: number | null; status?: 'active' | 'idle' | 'ended'; last_seen_at?: string | null }
type AuditLog = { id: string; panel_user_id: string; panel_user?: { email: string; role: string } | null; action: string; entity_type: string; entity_id: string; created_at: string }

function formatDuration(seconds: number | null) {
  if (seconds === null) return '-'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return h + 's ' + m + 'dk'
  if (m > 0) return m + 'dk ' + s + 'sn'
  return s + 'sn'
}

function resolveStatus(s: Session): 'active' | 'idle' | 'ended' {
  if (s.status) return s.status
  return s.logout_at ? 'ended' : 'active'
}

function formatDate(d: string | null | undefined) {
  if (!d) return '-'
  return new Date(d).toLocaleString('tr-TR')
}

const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-pink-500 to-rose-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-purple-500 to-fuchsia-600',
  'from-cyan-500 to-sky-600',
]
function avatarGradient(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length]
}

function UserCell({ email, role }: { email: string; role?: string }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white bg-gradient-to-br shrink-0 ${avatarGradient(email)}`}>
        {email.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-white text-[13px] truncate">{email}</p>
        {role && <p className="text-[10px] text-gray-500 capitalize">{role}</p>}
      </div>
    </div>
  )
}

function StatusBadge({ s }: { s: Session }) {
  const status = resolveStatus(s)
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-green-400">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Aktif
      </span>
    )
  }
  if (status === 'idle') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-yellow-400">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> Boşta
      </span>
    )
  }
  return (
    <div>
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-500">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-600" /> Sona Erdi
      </span>
      {s.logout_at && <p className="text-[10px] text-gray-600 mt-0.5">{formatDate(s.logout_at)}</p>}
    </div>
  )
}

const ACTION_STYLES: Record<string, string> = {
  login: 'bg-green-500/10 text-green-400',
  logout: 'bg-gray-700 text-gray-400',
  create: 'bg-blue-500/10 text-blue-400',
  update: 'bg-amber-500/10 text-amber-400',
  delete: 'bg-red-500/10 text-red-400',
}
function ActionBadge({ action }: { action: string }) {
  const key = Object.keys(ACTION_STYLES).find(k => action.toLowerCase().includes(k))
  const cls = (key && ACTION_STYLES[key]) || 'bg-white/[0.06] text-gray-300'
  return <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${cls}`}>{action}</span>
}

const IconActivity = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
)
const IconPulse = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
)
const IconMoon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
)
const IconList = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
)

function StatCard({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: number | string; tint: string }) {
  return (
    <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-5 shadow-lg shadow-black/10 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-gray-500 text-xs">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export default function UserLogsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [sessionsError, setSessionsError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    const sessionsPromise = api.get<{ items: Session[] }>('/audit-logs/sessions')
      .then(res => { setSessionsError(false); return res.items || [] })
      .catch(() => { setSessionsError(true); return [] })
    const logsPromise = api.get<{ items: AuditLog[] }>('/audit-logs?limit=200')
      .then(res => res.items || [])
      .catch(() => [])
    const [sessionsData, logsData] = await Promise.all([sessionsPromise, logsPromise])
    setSessions(sessionsData)
    setLogs(logsData.filter(l => l.entity_type !== 'panel_user'))
    setLoading(false)
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Yükleniyor…</div>

  const activeSessions = sessions.filter(s => resolveStatus(s) === 'active').length
  const idleSessions = sessions.filter(s => resolveStatus(s) === 'idle').length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Kullanıcı Logları</h2>
        <p className="text-gray-500 text-sm mt-1">Giriş/çıkış kayıtları, gerçek zamanlı aktiflik ve oturum süreleri. 2 saat işlem yapılmayan oturumlar otomatik sonlandırılır.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<IconActivity />} label="Toplam Oturum" value={sessions.length} tint="bg-blue-500/10 text-blue-400" />
        <StatCard icon={<IconPulse />} label="Aktif Oturum" value={activeSessions} tint="bg-green-500/10 text-green-400" />
        <StatCard icon={<IconMoon />} label="Boşta Oturum" value={idleSessions} tint="bg-yellow-500/10 text-yellow-400" />
        <StatCard icon={<IconList />} label="Toplam İşlem" value={logs.length} tint="bg-purple-500/10 text-purple-400" />
      </div>

      <div className="bg-gray-800/50 rounded-2xl border border-gray-700 shadow-lg shadow-black/10 overflow-hidden">
        <div className="p-4 border-b border-gray-700/70">
          <h3 className="font-semibold text-white text-[15px]">Oturumlar</h3>
          {sessionsError && (
            <p className="text-xs text-yellow-500 mt-1">Oturum verilerini görmek için admin yetkisi gerekiyor</p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/20">
                <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs">Kullanıcı</th>
                <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs">Giriş</th>
                <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs">Son Görülme</th>
                <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs">Durum</th>
                <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs">Süre</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">Henüz oturum kaydı yok</td></tr>
              ) : sessions.map(s => (
                <tr key={s.id} className="border-t border-gray-700/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5"><UserCell email={s.panel_user?.email || '-'} role={s.panel_user?.role} /></td>
                  <td className="px-4 py-2.5 text-gray-400 text-[13px]">{formatDate(s.login_at)}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-[13px]">{formatDate(s.last_seen_at)}</td>
                  <td className="px-4 py-2.5"><StatusBadge s={s} /></td>
                  <td className="px-4 py-2.5 text-gray-400 text-[13px]">{formatDuration(s.duration_seconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-2xl border border-gray-700 shadow-lg shadow-black/10 overflow-hidden">
        <div className="p-4 border-b border-gray-700/70 flex items-center justify-between">
          <h3 className="font-semibold text-white text-[15px]">İşlem Kayıtları</h3>
          <span className="text-[11px] text-gray-500">son 200 kayıt</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/20">
                <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs">Kullanıcı</th>
                <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs">İşlem</th>
                <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs">Varlık</th>
                <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">Henüz işlem kaydı yok</td></tr>
              ) : logs.map(l => (
                <tr key={l.id} className="border-t border-gray-700/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5"><UserCell email={l.panel_user?.email || l.panel_user_id} /></td>
                  <td className="px-4 py-2.5"><ActionBadge action={l.action} /></td>
                  <td className="px-4 py-2.5 text-gray-400 text-[13px]">{l.entity_type}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-[13px]">{formatDate(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
