'use client'
import { useEffect, useState, createElement as e } from 'react'
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

function formatLastSeen(s: Session) {
if (!s.last_seen_at) return '-'
return new Date(s.last_seen_at).toLocaleString('tr-TR')
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

const fetchData = async () => {
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

if (loading) {
return e('div', { className: 'p-8 text-gray-400' }, 'Yukleniyor...')
}

const activeSessions = sessions.filter(s => resolveStatus(s) === 'active').length
const idleSessions = sessions.filter(s => resolveStatus(s) === 'idle').length

const statCard = (label: string, value: number | string) =>
e('div', { className: 'bg-gray-900 border border-gray-800 rounded-xl p-5', key: label },
e('div', { className: 'text-gray-400 text-sm' }, label),
e('div', { className: 'text-2xl font-bold text-white mt-1' }, value)
)

const th = (label: string) => e('th', { className: 'text-left px-4 py-2 text-gray-400 font-medium', key: label }, label)
const td = (content: any, key: any, cls?: string) => e('td', { className: 'px-4 py-2 ' + (cls || 'text-gray-400'), key }, content)

const statusBadge = (s: Session) => {
const status = resolveStatus(s)
if (status === 'active') {
return e('span', { className: 'inline-flex items-center gap-1.5 text-green-400' },
e('span', { className: 'w-1.5 h-1.5 rounded-full bg-green-400' }),
'Aktif'
)
}
if (status === 'idle') {
return e('span', { className: 'inline-flex items-center gap-1.5 text-yellow-400' },
e('span', { className: 'w-1.5 h-1.5 rounded-full bg-yellow-400' }),
'Bosta'
)
}
return e('span', { className: 'inline-flex items-center gap-1.5 text-gray-500' },
e('span', { className: 'w-1.5 h-1.5 rounded-full bg-gray-600' }),
s.logout_at ? new Date(s.logout_at).toLocaleString('tr-TR') : 'Sona Erdi'
)
}

const sessionRows = sessions.length === 0
? [e('tr', { key: 'empty' }, e('td', { colSpan: 6, className: 'px-4 py-6 text-center text-gray-500' }, 'Henuz oturum kaydi yok'))]
: sessions.map(s => e('tr', { key: s.id, className: 'border-t border-gray-800' },
td(s.panel_user?.email || '-', 'a', 'text-white'),
td(s.panel_user?.role || '-', 'b'),
td(new Date(s.login_at).toLocaleString('tr-TR'), 'c'),
td(formatLastSeen(s), 'd'),
td(statusBadge(s), 'e'),
td(formatDuration(s.duration_seconds), 'ff')
))

const logRows = logs.length === 0
? [e('tr', { key: 'empty' }, e('td', { colSpan: 4, className: 'px-4 py-6 text-center text-gray-500' }, 'Henuz islem kaydi yok'))]
: logs.map(l => e('tr', { key: l.id, className: 'border-t border-gray-800' },
td(l.panel_user?.email || l.panel_user_id, 'a', 'text-white'),
td(l.action, 'b'),
td(l.entity_type, 'c'),
td(new Date(l.created_at).toLocaleString('tr-TR'), 'd')
))

return e('div', { className: 'p-8 space-y-8' },
e('div', { key: 'header' },
e('h1', { className: 'text-2xl font-bold text-white' }, 'Kullanici Loglari'),
e('p', { className: 'text-gray-400 text-sm mt-1' }, 'Giris/cikis kayitlari, gercek zamanli aktiflik ve oturum sureleri. 2 saat islem yapilmayan oturumlar otomatik sonlandirilir.')
),
e('div', { className: 'grid grid-cols-2 sm:grid-cols-4 gap-4', key: 'stats' },
statCard('Toplam Oturum', sessions.length),
statCard('Aktif Oturum', activeSessions),
statCard('Bosta Oturum', idleSessions),
statCard('Toplam Islem', logs.length)
),
e('div', { className: 'bg-gray-900 border border-gray-800 rounded-xl overflow-hidden', key: 'sessionsBox' },
e('div', { className: 'p-4 border-b border-gray-800' },
e('h2', { className: 'font-semibold text-white' }, 'Oturumlar'),
sessionsError ? e('p', { className: 'text-xs text-yellow-500 mt-1' }, 'Oturum verilerini gormek icin admin yetkisi gerekiyor') : null
),
e('div', { className: 'overflow-x-auto' },
e('table', { className: 'w-full text-sm' },
e('thead', { className: 'bg-gray-800/50' }, e('tr', {}, th('Kullanici'), th('Rol'), th('Giris'), th('Son Gorulme'), th('Durum'), th('Sure'))),
e('tbody', {}, sessionRows)
)
)
),
e('div', { className: 'bg-gray-900 border border-gray-800 rounded-xl overflow-hidden', key: 'logsBox' },
e('div', { className: 'p-4 border-b border-gray-800' }, e('h2', { className: 'font-semibold text-white' }, 'Islem Kayitlari')),
e('div', { className: 'overflow-x-auto' },
e('table', { className: 'w-full text-sm' },
e('thead', { className: 'bg-gray-800/50' }, e('tr', {}, th('Kullanici'), th('Islem'), th('Varlik'), th('Tarih'))),
e('tbody', {}, logRows)
)
)
)
)
}
