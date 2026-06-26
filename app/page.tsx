const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">RektHub Panel</h1>
        <p className="text-gray-400 text-lg">Management interface</p>
        <div className="mt-4 text-sm">
          <span className="text-green-400 font-mono">{API_URL || 'API not configured'}</span>
        </div>
      </div>
    </main>
  )
}
