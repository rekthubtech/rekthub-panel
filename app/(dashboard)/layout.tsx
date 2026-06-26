'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearToken } from '@/lib/api'

const NAV = [
  { href: '/channels',  label: 'Kanallar' },
  { href: '/concepts',  label: 'Konseptler' },
  { href: '/analytics', label: 'Maliyet & Analitik' },
  { href: '/settings',  label: 'Ayarlar' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()

  function logout() {
    clearToken()
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <aside className="w-56 bg-gray-900 flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-gray-800">
          <span className="text-lg font-bold text-green-400">RektHub</span>
          <span className="text-gray-600 text-xs ml-1">Panel</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center px-4 py-2.5 rounded-lg text-sm transition-colors ${
                pathname.startsWith(n.href)
                  ? 'bg-green-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={logout}
            className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            ÃÄ±kÄ±Å Yap
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
