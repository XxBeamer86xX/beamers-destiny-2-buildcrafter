import { useManifest } from '../../hooks/useManifest'
import { Loader2 } from 'lucide-react'

export function ManifestLoader() {
  const { loading, loaded, progress, stage, error } = useManifest()

  if (!loading || loaded) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-destiny-card border border-destiny-border rounded-lg p-4 w-72 shadow-xl">
      <div className="flex items-center gap-3 mb-3">
        <Loader2 className="w-4 h-4 text-legendary animate-spin flex-shrink-0" />
        <span className="text-sm text-white font-medium">Loading Destiny Manifest</span>
      </div>
      <p className="text-xs text-gray-400 mb-2">{stage}</p>
      <div className="w-full bg-destiny-border rounded-full h-1.5">
        <div
          className="bg-legendary h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">{progress}% — First load only, cached after</p>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
