'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Concept {
  id: number; channel_id: number; channel_name: string;
  title: string; status: string; notes: string; created_at: string;
}

export default function ConceptsPage() {
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchConcepts() }, [])

  async function fetchConcepts() {
    setLoading(true)
    try { setConcepts(await api.get<Concept[]>('/concepts')) }
    finally { setLoading(false) }
  }

  async function updateStatus(id: number, status: string) {
    await api.patch(`/concepts/${id}`, { status })
    setConcepts(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  async function deleteConcept(id: number) {
    await api.delete(`/concepts/${id}`)
    setConcepts(prev => prev.filter(c => c.id !== id))
  }

  const statuses = ['all', 'pending', 'approved', 'rejected', 'published']
  const filtered = filter === 'all' ? concepts : concepts.filter(c => c.status === filter)

  const statusLabel: Record<string, string> = {
    pending: 'Bekliyor',
    approved: 'Onaylandı',
    rejected: 'Reddedildi',
    published: 'Yayınlandı',
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    published: 'bg-blue-100 text-blue-700',
  }

  if (loading) return <div className="p-8 text-center">Yükleniyor…</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Konseptler</h2>
        <div className="flex gap-2">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium ${filter === s ? 'bg-gray-800 text-white' : 'bg-white border text-gray-600'}`}>
              {s === 'all' ? 'Tümü' : statusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <p className="text-gray-500">Konsept bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold">{c.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[c.status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabel[c.status] || c.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{c.channel_name} · {new Date(c.created_at).toLocaleDateString('tr-TR')}</p>
                  {c.notes && <p className="text-sm text-gray-600">{c.notes}</p>}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <select value={c.status} onChange={e => updateStatus(c.id, e.target.value)}
                    className="text-xs border rounded-lg px-2 py-1.5">
                    {['pending','approved','rejected','published'].map(s => (
                      <option key={s} value={s}>{statusLabel[s]}</option>
                    ))}
                  </select>
                  <button onClick={() => deleteConcept(c.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600">Sil</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
