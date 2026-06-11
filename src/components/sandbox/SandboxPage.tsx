import { useEffect, useState } from 'react'
import { Loader2, AlertCircle, RefreshCw, RotateCcw, Swords } from 'lucide-react'
import { useProfile } from '../../hooks/useProfile'
import { useAppStore } from '../../store/appStore'
import { useSandboxStore } from '../../store/sandboxStore'
import { BUNGIE_ROOT } from '../../lib/bungie-api'
import { CLASS_TYPE_MAP, CLASS_NAMES, BUCKET_HASH_MAP } from '../../types/destiny'
import type { DestinyItem } from '../../types/destiny'
import { EquipmentLayout, SLOT_TO_BUCKET } from './EquipmentLayout'
import { StatPanel } from './StatPanel'
import { BuildPanel } from './BuildPanel'
import { SlotPicker } from './SlotPicker'

export function SandboxPage() {
  const { data: profile, isLoading, error, refetch } = useProfile()
  const { selectedCharacterId, setSelectedCharacter } = useAppStore()
  const { virtualLoadout, initialized, initSandbox, setSlotItem, resetToEquipped } = useSandboxStore()

  const [pickerSlot, setPickerSlot] = useState<string | null>(null)

  // Auto-select first character
  useEffect(() => {
    if (!selectedCharacterId && profile?.characters.length) {
      setSelectedCharacter(profile.characters[0].characterId)
    }
  }, [selectedCharacterId, profile, setSelectedCharacter])

  // Init sandbox when profile loads / character changes
  const charId = selectedCharacterId ?? profile?.characters[0]?.characterId ?? null
  const character = profile?.characters.find(c => c.characterId === charId)
  const equipped = charId ? (profile?.characterEquipped[charId] ?? []) : []

  useEffect(() => {
    if (charId && equipped.length > 0) {
      initSandbox(charId, equipped)
    }
  }, [charId, profile]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-legendary animate-spin" />
          <p className="text-gray-400 text-sm">Loading profile…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-red-400 font-medium">Failed to load profile</p>
          <p className="text-gray-500 text-sm">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-destiny-card border border-destiny-border rounded-lg text-sm hover:bg-destiny-hover transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!profile || !character || !initialized) return null

  const charClass = CLASS_TYPE_MAP[character.classType]
  const avgPower = equipped.length
    ? Math.round(equipped.reduce((s, i) => s + (i.powerLevel ?? 0), 0) / equipped.filter(i => i.powerLevel).length)
    : 0

  // Build original loadout map for swap indicator
  const originalLoadout: Partial<Record<string, DestinyItem>> = {}
  for (const item of equipped) {
    const slot = BUCKET_HASH_MAP[item.bucketHash]
    if (slot) originalLoadout[slot] = item
  }

  // All items available for picking (vault + character inventory + equipped)
  const inventory = profile.characterInventory[charId ?? ''] ?? []
  const allItems = [...equipped, ...inventory, ...profile.vault]

  // The slot currently open in the picker
  const pickerBucketHash = pickerSlot ? SLOT_TO_BUCKET[pickerSlot] : null

  const handleSlotClick = (slot: string) => {
    setPickerSlot(slot)
  }

  const handlePickerSelect = (item: DestinyItem | null) => {
    if (pickerSlot) {
      setSlotItem(pickerSlot, item)
    }
    setPickerSlot(null)
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div
        className="flex-shrink-0 px-4 py-3 border-b border-destiny-border flex items-center gap-4"
        style={{
          background: character.emblemBackgroundPath
            ? `linear-gradient(to right, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.5)), url(${BUNGIE_ROOT}${character.emblemBackgroundPath}) center/cover`
            : 'transparent',
        }}
      >
        {character.emblemPath && (
          <img
            src={`${BUNGIE_ROOT}${character.emblemPath}`}
            alt=""
            className="w-10 h-10 rounded border border-destiny-border flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">{CLASS_NAMES[charClass]}</span>
            <span className="text-exotic font-bold">{character.light}</span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-legendary/20 border border-legendary/30 text-xs text-legendary font-medium">
              <Swords className="w-3 h-3" />
              Sandbox Mode
            </span>
          </div>
          <p className="text-xs text-gray-500">Avg {avgPower} · Virtual loadout, no transfers</p>
        </div>

        {/* Character selector */}
        {profile.characters.length > 1 && (
          <div className="flex gap-1">
            {profile.characters.map(c => {
              const cls = CLASS_TYPE_MAP[c.classType]
              const isSelected = c.characterId === charId
              return (
                <button
                  key={c.characterId}
                  onClick={() => {
                    setSelectedCharacter(c.characterId)
                  }}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-legendary/20 border border-legendary/40 text-white'
                      : 'text-gray-500 hover:text-white hover:bg-destiny-hover'
                  }`}
                >
                  {CLASS_NAMES[cls]}
                </button>
              )
            })}
          </div>
        )}

        {/* Reset button */}
        <button
          onClick={() => resetToEquipped(equipped)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destiny-card border border-destiny-border text-xs text-gray-300 hover:text-white hover:bg-destiny-hover transition-colors flex-shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* Main 3-column layout */}
      <div className="flex-1 overflow-auto p-3 md:p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 h-full min-h-[600px]">
          {/* Left: Equipment silhouette */}
          <div className="bg-destiny-card border border-destiny-border rounded-lg p-3 flex flex-col">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Equipment
            </h2>
            <div className="flex-1 flex items-start justify-center">
              <EquipmentLayout
                virtualLoadout={virtualLoadout}
                originalLoadout={originalLoadout}
                onSlotClick={handleSlotClick}
              />
            </div>
            <p className="text-[10px] text-gray-700 text-center mt-2">
              Click a slot to swap items
            </p>
          </div>

          {/* Middle: Stat panel */}
          <div>
            <StatPanel virtualLoadout={virtualLoadout} charClass={charClass} />
          </div>

          {/* Right: Build panel */}
          <div>
            <BuildPanel virtualLoadout={virtualLoadout} />
          </div>
        </div>
      </div>

      {/* Slot picker modal */}
      {pickerSlot && pickerBucketHash && (
        <SlotPicker
          bucketHash={pickerBucketHash}
          currentItem={virtualLoadout[pickerSlot]}
          allItems={allItems}
          onSelect={handlePickerSelect}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </div>
  )
}
