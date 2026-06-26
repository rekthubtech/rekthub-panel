'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Summary { total_cost_today: number; total_cost_this_week: number; total_cost_this_month: number; total_views_today: number; total_views_this_week: number; total_views_this_month: number; total_subscriber_gain_this_week: number; total_subscriber_gain_this_month: number }
interface ViewDataPoint { date: string; views: number }
interface ChannelStat { channel_name: string; views_today: number; views_this_week: number; views_this_month: number; subscriber_gain_week: number; subscriber_gain_month: number; estimated_revenue_week: number; estimated_revenue_month: number }
interface TopVideo { title: string; channel_name: string; views: number; published_at: string; url: string }
interface Expense { id: number; date: string; amount: number; currency: string; description: string; created_by: string }

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [views, setViews] = useState<ViewDataPoint[]>([])
  const [channels, setChannels] = useState<ChannelStat[]>([])
  const [topVideos, setTopVideos] = useState<TopVideo[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expenseForm, setExpenseForm] = useState({ date: '', amount: '', currency: 'USD', description: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [sumRes, viewsRes, chRes, topRes, expRes] = await Promise.all([
        api.get<Summary>('/analytics/summary'),
        api.get<ViewDataPoint[]>('/analytics/views?days=14'),
        api.get<ChannelStat[]>('/analytics/channels'),
        api.get<TopVideo[]>('/analytics/top-videos'),
        api.get<Expense[]>('/analytics/expenses'),
      ])
      setSummary(sumRes)
      setViews(viewsRes)
      setChannels(chRes)
      setTopVideos(topRes)
      setExpenses(expRes)
    } finally { setLoading(false) }
  }

  async function addExpense() {
    setSubmitting(true)
    try {
      await api.post('/analytics/expenses', {
        date: expenseForm.date,
        amount: parseFloat(expenseForm.amount),
        currency: expenseForm.currency,
        description: expenseForm.description,
      })
      setShowExpenseModal(false)
      setExpenseForm({ date: '', amount: '', currency: 'USD', description: '' })
      fetchAll()
    } finally { setSubmitting(false) }
  }

  const maxViews = Math.max(...views.map(v => v.views), 1)

  if (loading) return <div className="p-8 text-center">YÃ¼kleniyorâ¦ </div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Maliyet &amp; Analitik</h2>
        <button onClick={() => setShowExpenseModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Gider Ekle
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        { [
          { label: 'BugÃ¼n Maliyet', value: `$${summary?.total_cost_today?.toFixed(4) ?? '0'}` },
          { label: 'Bu Hafta Maliyet', value: `$${summary?.total_cost_this_week?.toFixed(2) ?? '0'}` },
          { label: 'BugÃ¼n Izlenme', value: summary?.total_views_today?.toLocaleString() ?? '0' },
          { label: 'Bu Hafta Abone KazancÄ±', value: summary?.total_subscriber_gain_this_week?.toLocaleString() ?? '0' },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.value}</p>
          </div>
        )) }
      </div>

      {/* Views Bar Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold mb-4">Son 14 GÃ¼n Izlenme</h3>
        <div className="flex items-end gap-1 h-48">
          {views.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xxs text-gray-400">{v.views.toLocaleString()}</span>
              <div
                className="w-full bg-blue-500 rounded-t"
                style={{ height: `${Math.round((v.views / maxViews) * 160)}px` }}
              />
              <span className="text-xxs text-gray-400 rotate-45">{v.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Channel Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold mb-4">Kanal PerformansÄ±</h3>
        <div className="overflow-x-auto">
          <table className="wmin-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4">Kanal</th>
                <th className="pb-2 pr-4">BugÃ¼n Izlenme</th>
                <th className="pb-2 pr-4">Bu Hafta Izlenme</th>
                <th className="pb-2 pr-4">Bu Hafta Abone</th>
                <th className="pb-2">Bu Hafta Gelir</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((c, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 pr-4 font-medium">{c.channel_name}</td>
                  <td className="py-3 pr-4">{c.views_today.toLocaleString()}</td>
                  <td className="py-3 pr-4">{c.views_this_week.toLocaleString()}</td>
                  <td className="py-3 pr-4">{c.subscriber_gain_week}+</td>
                  <td className="py-3">${c.estimated_revenue_week?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Videos */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold mb-4">Top Videolar</h3>
        <div className="space-y-3">
          {topVideos.map((v, i) => (
            <div key={i} className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
              <div>
                <a href={v.url} target="_blank" className="font-medium hover:text-blue-600">{v.title}</a>
                <p className="text-xs text-gray-500">{v.channel_name} â¢ {new Date(v.published_at).toLocaleDateString('tr-TR')}</p>
              </div>
              <span className="text-sm font-medium">{v.views.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expenses */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold mb-4">Giderler</h3>
        <div className="space-y-2">
          {expenses.map((e, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="font-medium">{e.description}</p>
                <p className="text-xs text-gray-500">{e.date} â¢ {e.created_by}</p>
              </div>
              <span className="font-medium">{e.amount} {e.currency}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-semibold mb-4">Gider Ekle</h3>
            <div className="space-y-3">
              <input type="date" value={expenseForm.date} onChange={e => setExpenseForm(p => ({...p, date: e.target.value}))} className="w-full border rounded-lg p-2" />
              <div className="flex gap-2">
                <input type="number" placeholder="Tutar" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({...p, amount: e.target.value}))} className="flex-1 border rounded-lg p-2" />
                <select value={expenseForm.currency} onChange={e => setExpenseForm(p => ({...p, currency: e.target.value}))} className="border rounded-lg p-2">
                  <option>USD</option><option>EUR</option><option>TRY</option>
                </select>
              </div>
              <textarea placeholder="AÃ§iklama" value={expenseForm.description} onChange={e => setExpenseForm(p => ({...p, description: e.target.value}))} className="w-full border rounded-lg p-2" rows={3} />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowExpenseModal(false)} className="px-4 py-2 border rounded-lg text-sm">Iptal</button>
                <button onClick={addExpense} disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">{submitting ? 'Kaydediliyor...' : 'Kaydet'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
