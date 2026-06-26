'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, setToken } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.post<{ token: string }>('/auth/login', { email, password })
      setToken(data.token)
      router.push('/channels')
    } catch (err: unknown) {
      setError((err as Error).message || 'GiriÅ baÅarÄ±sÄ±z')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-full max-w-sm px-4">
        <h1 className="text-2xl font-bold text-white text-center mb-2">RektHub Panel</h1>
        <p className="text-gray-500 text-center text-sm mb-8">YÃ¶netim arayÃ¼zÃ¼</p>
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-8 space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500 transition"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Åifre</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500 transition"
              required
            />
          </div>
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-2.5 rounded-lg">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition"
          >
            {loading ? 'GiriÅ yapÄ±lÄ±yor...' : 'GiriÅ Yap'}
          </button>
        </form>
      </div>
    </div>
  )
}
