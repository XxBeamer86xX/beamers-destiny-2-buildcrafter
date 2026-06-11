import { Shield } from 'lucide-react'
import { bungieApi } from '../../lib/bungie-api'
import { useAuthStore } from '../../store/authStore'

export function LoginPage() {
  const error = useAuthStore(s => s.error)

  const handleLogin = () => {
    window.location.href = bungieApi.getOAuthUrl()
  }

  const apiKeyMissing = !import.meta.env.VITE_BUNGIE_API_KEY || !import.meta.env.VITE_BUNGIE_CLIENT_ID

  return (
    <div className="min-h-screen bg-destiny-bg flex flex-col items-center justify-center p-6">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-legendary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md w-full">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-destiny-card border border-destiny-border flex items-center justify-center shadow-legendary">
            <Shield className="w-10 h-10 text-legendary" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide">Beamer's D2 Buildcrafter</h1>
          <p className="text-destiny-border text-sm tracking-widest uppercase">
            Build · Analyze · Deploy
          </p>
        </div>

        {/* Features */}
        <div className="w-full bg-destiny-card border border-destiny-border rounded-lg p-5 space-y-3">
          {[
            'Browse all equipped gear and vault items',
            'View subclass aspects, fragments, and abilities',
            'See exotic perks and armor 3.0 synergies',
            'Build loadouts and export to DIM',
          ].map(feature => (
            <div key={feature} className="flex items-center gap-3 text-sm text-gray-300">
              <span className="w-1.5 h-1.5 rounded-full bg-legendary flex-shrink-0" />
              {feature}
            </div>
          ))}
        </div>

        {/* Auth error */}
        {error && !apiKeyMissing && (
          <div className="w-full bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-sm text-red-400">
            <p className="font-semibold mb-1">Authentication error</p>
            <p className="text-gray-300 break-all">{error}</p>
          </div>
        )}

        {/* API key warning */}
        {apiKeyMissing && (
          <div className="w-full bg-solar/10 border border-solar/30 rounded-lg p-4 text-sm text-solar">
            <p className="font-semibold mb-1">Setup required</p>
            <p className="text-gray-300">
              Add <code className="bg-destiny-bg px-1 rounded">VITE_BUNGIE_API_KEY</code> and{' '}
              <code className="bg-destiny-bg px-1 rounded">VITE_BUNGIE_CLIENT_ID</code> to your{' '}
              <code className="bg-destiny-bg px-1 rounded">.env.local</code> file.
              See <span className="font-medium">README.md</span> for setup instructions.
            </p>
          </div>
        )}

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={apiKeyMissing}
          className="w-full bg-legendary hover:bg-legendary/80 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all duration-150 flex items-center justify-center gap-3 text-base shadow-legendary"
        >
          <img
            src="https://www.bungie.net/img/misc/missing_icon_d2.png"
            alt=""
            className="w-5 h-5 opacity-80"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          Sign in with Bungie.net
        </button>

        <p className="text-xs text-gray-500 text-center">
          Your data stays on your device. We never store your items or account info.
        </p>
      </div>
    </div>
  )
}
