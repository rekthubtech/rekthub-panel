'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearToken }, api from '@/lib/api'

const NAV = [
  { href: '/channels', label: 'Kanallar' },
  { href: '/concepts', label: 'Konseptler' },
  { href: '/analytics', label: 'Analitik' },
  { href: '/user-logs', label: 'Kullanıcı Logları' },
  { href: '/settings', label: 'Ayarlar' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
      try {
            await api.post('/auth/logout', {})
      } catch {}
      clearToken()
      router.push('/login')
  }

  return (
    <div className="flex h-screen bg-gray-950">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <span className="font-bold text-lg text-white">RektHub</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? 'bg-blue-900/30 text-blue-400'
                  : 'text-gray-400 hover:bg-gray-800'
              }`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <button onClick={logout} className="w-full px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 rounded-lg text-left">
            Çıkış
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
