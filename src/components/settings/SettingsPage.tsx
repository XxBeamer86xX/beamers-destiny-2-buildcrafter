import { useAuthStore } from '../../store/authStore'
import { useAppStore } from '../../store/appStore'
import { Shield, Database, Info } from 'lucide-react'

export function SettingsPage() {
  const { displayName, profilePicture, memberships, selectedMembership, selectMembership } = useAuthStore()
  const { manifestStatus } = useAppStore()

  const clearManifest = async () => {
    if (!confirm('Clear the cached manifest? It will re-download next time you sign in.')) return
    const { deleteDB } = await import('idb')
    await deleteDB('d2-manifest')
    useAppStore.getState().setManifestStatus({ loaded: false, loading: false, progress: 0, stage: '' })
    alert('Manifest cache cleared.')
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-white">Settings</h1>

      {/* Account */}
      <section className="bg-destiny-card border border-destiny-border rounded-xl p-5 space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-300 uppercase tracking-wider">
          <Shield className="w-4 h-4 text-legendary" />
          Bungie Account
        </h2>
        <div className="flex items-center gap-3">
          {profilePicture ? (
            <img src={profilePicture} alt="" className="w-12 h-12 rounded-full border border-destiny-border" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-destiny-surface border border-destiny-border flex items-center justify-center">
              <span className="text-lg text-gray-400">{displayName?.[0]?.toUpperCase()}</span>
            </div>
          )}
          <div>
            <p className="font-semibold text-white">{displayName}</p>
            <p className="text-xs text-gray-500">{selectedMembership?.membershipId}</p>
          </div>
        </div>

        {memberships.length > 1 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Select platform:</p>
            <div className="flex flex-wrap gap-2">
              {memberships.map(m => {
                const platformNames: Record<number, string> = {
                  1: 'Xbox', 2: 'PSN', 3: 'Steam', 5: 'Stadia', 6: 'Epic',
                }
                return (
                  <button
                    key={m.membershipId}
                    onClick={() => selectMembership(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                      selectedMembership?.membershipId === m.membershipId
                        ? 'bg-legendary/20 border-legendary/40 text-white'
                        : 'bg-destiny-surface border-destiny-border text-gray-400 hover:text-white'
                    }`}
                  >
                    {platformNames[m.membershipType] ?? `Platform ${m.membershipType}`}
                    {m.bungieGlobalDisplayName && (
                      <span className="ml-1 text-gray-500">· {m.bungieGlobalDisplayName}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* Manifest */}
      <section className="bg-destiny-card border border-destiny-border rounded-xl p-5 space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-300 uppercase tracking-wider">
          <Database className="w-4 h-4 text-legendary" />
          Manifest Cache
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white">
              Status: <span className={manifestStatus.loaded ? 'text-strand' : 'text-solar'}>{manifestStatus.loaded ? 'Loaded' : 'Not loaded'}</span>
            </p>
            {manifestStatus.loaded && (
              <p className="text-xs text-gray-500 mt-0.5">Item definitions cached in your browser (IndexedDB)</p>
            )}
          </div>
          <button
            onClick={clearManifest}
            className="px-3 py-1.5 bg-destiny-surface border border-destiny-border text-xs text-gray-400 rounded-lg hover:text-white hover:border-red-500/40 hover:text-red-400 transition-colors"
          >
            Clear cache
          </button>
        </div>
      </section>

      {/* About */}
      <section className="bg-destiny-card border border-destiny-border rounded-xl p-5 space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-300 uppercase tracking-wider">
          <Info className="w-4 h-4 text-legendary" />
          About
        </h2>
        <p className="text-sm text-gray-400">
          D2 Loadout Manager uses the official Bungie.net API. Your data is never stored on any server —
          everything lives in your browser.
        </p>
        <p className="text-xs text-gray-600">
          Not affiliated with Bungie, Inc. Destiny 2 is a registered trademark of Bungie, Inc.
        </p>
      </section>
    </div>
  )
}
