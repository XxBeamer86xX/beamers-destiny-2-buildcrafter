import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DestinyItem } from '../types/destiny'
import type { DIMLoadout, DIMBackup } from '../types/dim'

interface ManifestStatus {
  loaded: boolean
  loading: boolean
  progress: number
  stage: string
  error: string | null
}

interface AppState {
  selectedCharacterId: string | null
  manifestStatus: ManifestStatus
  loadouts: DIMLoadout[]
  dimBackup: DIMBackup | null
  // Loadout builder state
  builderLoadout: Partial<Record<string, DestinyItem>> | null  // slotName → item
  builderName: string
  builderClassType: number
  activePanel: 'character' | 'vault' | 'loadouts' | 'settings'
}

interface AppActions {
  setSelectedCharacter: (id: string) => void
  setManifestStatus: (status: Partial<ManifestStatus>) => void
  addLoadout: (loadout: DIMLoadout) => void
  updateLoadout: (id: string, updates: Partial<DIMLoadout>) => void
  deleteLoadout: (id: string) => void
  importLoadouts: (loadouts: DIMLoadout[], backup: DIMBackup) => void
  setBuilderItem: (slot: string, item: DestinyItem) => void
  clearBuilderItem: (slot: string) => void
  setBuilderName: (name: string) => void
  setBuilderClassType: (type: number) => void
  clearBuilder: () => void
  setActivePanel: (panel: AppState['activePanel']) => void
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      selectedCharacterId: null,
      manifestStatus: { loaded: false, loading: false, progress: 0, stage: '', error: null },
      loadouts: [],
      dimBackup: null,
      builderLoadout: null,
      builderName: 'New Loadout',
      builderClassType: 2,
      activePanel: 'character',

      setSelectedCharacter: (id) => set({ selectedCharacterId: id }),

      setManifestStatus: (status) =>
        set(s => ({ manifestStatus: { ...s.manifestStatus, ...status } })),

      addLoadout: (loadout) =>
        set(s => ({ loadouts: [...s.loadouts, loadout] })),

      updateLoadout: (id, updates) =>
        set(s => ({
          loadouts: s.loadouts.map(l => l.id === id ? { ...l, ...updates } : l),
        })),

      deleteLoadout: (id) =>
        set(s => ({ loadouts: s.loadouts.filter(l => l.id !== id) })),

      importLoadouts: (loadouts, backup) =>
        set({ loadouts, dimBackup: backup }),

      setBuilderItem: (slot, item) =>
        set(s => ({
          builderLoadout: { ...(s.builderLoadout ?? {}), [slot]: item },
        })),

      clearBuilderItem: (slot) => {
        const { builderLoadout } = get()
        if (!builderLoadout) return
        const next = { ...builderLoadout }
        delete next[slot]
        set({ builderLoadout: next })
      },

      setBuilderName: (name) => set({ builderName: name }),
      setBuilderClassType: (type) => set({ builderClassType: type }),

      clearBuilder: () =>
        set({ builderLoadout: null, builderName: 'New Loadout' }),

      setActivePanel: (panel) => set({ activePanel: panel }),
    }),
    {
      name: 'd2-app',
      partialize: (state: AppState & AppActions) => ({
        selectedCharacterId: state.selectedCharacterId,
        loadouts: state.loadouts,
        dimBackup: state.dimBackup,
        builderName: state.builderName,
        builderClassType: state.builderClassType,
      }),
    }
  )
)
