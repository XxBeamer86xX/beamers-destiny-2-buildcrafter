import { useState, useEffect, useCallback } from 'react'
import { loadManifest, isManifestLoaded } from '../lib/manifest'
import { useAppStore } from '../store/appStore'
import { useAuthStore } from '../store/authStore'

export function useManifest() {
  const { manifestStatus, setManifestStatus } = useAppStore()
  const { accessToken } = useAuthStore()
  const [triggered, setTriggered] = useState(false)

  const load = useCallback(async () => {
    if (manifestStatus.loading || manifestStatus.loaded) return

    // Check if already in IndexedDB
    const cached = await isManifestLoaded()
    if (cached) {
      setManifestStatus({ loaded: true, stage: 'Ready', progress: 100 })
      return
    }

    setManifestStatus({ loading: true, error: null })
    try {
      await loadManifest((p) => {
        setManifestStatus({ stage: p.stage, progress: p.progress })
        if (p.done) {
          setManifestStatus({ loaded: true, loading: false })
        }
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load manifest'
      setManifestStatus({ loading: false, error: msg })
    }
  }, [manifestStatus.loading, manifestStatus.loaded, setManifestStatus])

  useEffect(() => {
    if (accessToken && !triggered) {
      setTriggered(true)
      load()
    }
  }, [accessToken, triggered, load])

  return manifestStatus
}
