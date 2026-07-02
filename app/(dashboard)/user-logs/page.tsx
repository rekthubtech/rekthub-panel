'use client'
import { useEffect, useState, createElement as e } from 'react'
import { api } from '@/lib/api'

type Session = { id: string; panel_user: { id: string; email: string; role: string } | null; login_at: string; logout_at: string | null; duration_seconds: number | null }
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

export default function UserLogsPage() {
    const [sessions, setSessions] = useState<Session[]>([])
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [sessionsError, setSessionsError] = useState(false)
    const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
        setLoading(true)
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

  const activeSessions = sessions.filter(s => !s.logout_at).length

  const statCard = (label: string, value: number | string) =>
        e('div', { className: 'bg-gray-900 border border-gray-800 rounded-xl p-5', key: label },
                e('div', { className: 'text-gray-400 text-sm' }, label),
                e('div', { className: 'text-2xl font-bold text-white mt-1' }, value)
              )

  const th = (label: string) => e('th', { className: 'text-left px-4 py-2 text-gray-400 font-medium', key: label }, label)
    const td = (content: any, key: any, cls?: string) => e('td', { className: 'px-4 py-2 ' + (cls || 'text-gray-400'), key }, content)

  const sessionRows = sessions.length === 0
      ? [e('tr', { key: 'empty' }, e('td', { colSpan: 5, className: 'px-4 py-6 text-center text-gray-500' }, 'Henuz oturum kaydi yok'))]
        : sessions.map(s => e('tr', { key: s.id, className: 'border-t border-gray-800' },
                                      td(s.panel_user?.email || '-', 'a', 'text-white'),
                                      td(s.panel_user?.role || '-', 'b'),
                                      td(new Date(s.login_at).toLocaleString('tr-TR'), 'c'),
                                      td(s.logout_at ? new Date(s.logout_at).toLocaleString('tr-TR') : e('span', { className: 'text-green-400' }, 'Aktif'), 'd'),
                                      td(formatDuration(s.duration_seconds), 'ee')
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
                       e('p', { className: 'text-gray-400 text-sm mt-1' }, 'Giris/cikis kayitlari ve oturum sureleri')
                     ),
               e('div', { className: 'grid grid-cols-1 sm:grid-cols-3 gap-4', key: 'stats' },
                       statCard('Toplam Oturum', sessions.length),
                       statCard('Aktif Oturum', activeSessions),
                       statCard('Toplam Islem', logs.length)
                     ),
               e('div', { className: 'bg-gray-900 border border-gray-800 rounded-xl overflow-hidden', key: 'sessionsBox' },
                       e('div', { className: 'p-4 border-b border-gray-800' },
                                 e('h2', { className: 'font-semibold text-white' }, 'Oturumlar'),
                                 sessionsError ? e('p', { className: 'text-xs text-yellow-500 mt-1' }, 'Oturum verilerini gormek icin admin yetkisi gerekiyor') : null
                               ),
                       e('div', { className: 'overflow-x-auto' },
                                 e('table', { className: 'w-full text-sm' },
                                             e('thead', { className: 'bg-gray-800/50' }, e('tr', {}, th('Kullanici'), th('Rol'), th('Giris'), th('Cikis'), th('Sure'))),
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
