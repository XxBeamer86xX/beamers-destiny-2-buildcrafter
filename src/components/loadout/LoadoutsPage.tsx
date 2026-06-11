import { useState, useRef } from 'react'
import { Plus, Upload, Download, Trash2, Edit3, BookMarked } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useProfile } from '../../hooks/useProfile'
import { parseDIMBackup, exportDIMBackup, downloadJSON, buildDIMLoadout } from '../../lib/dim'
import { ItemCard } from '../item/ItemCard'
import { CLASS_NAMES } from '../../types/destiny'
import type { DIMLoadout } from '../../types/dim'

export function LoadoutsPage() {
  const { loadouts, addLoadout, deleteLoadout, updateLoadout, importLoadouts, dimBackup } = useAppStore()
  const { data: profile } = useProfile()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const backup = parseDIMBackup(ev.target?.result as string)
        importLoadouts(backup.loadouts ?? [], backup)
        alert(`Imported ${(backup.loadouts ?? []).length} loadouts successfully!`)
      } catch {
        alert('Failed to parse DIM backup file. Make sure it is a valid DIM export.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleExport = () => {
    const json = exportDIMBackup(loadouts, dimBackup ?? undefined)
    downloadJSON(json, `dim-loadouts-${new Date().toISOString().split('T')[0]}.json`)
  }

  const handleSnapshotCharacter = () => {
    if (!profile) return
    const chars = profile.characters
    if (!chars.length) return

    for (const char of chars) {
      const equipped = profile.characterEquipped[char.characterId] ?? []
      const subclass = equipped.find(i => i.itemCategory === 'subclass')
      const gearItems = equipped.filter(i => i.itemCategory === 'weapon' || i.itemCategory === 'armor')

      const name = `${CLASS_NAMES[char.classType === 0 ? 'titan' : char.classType === 1 ? 'hunter' : 'warlock']} — ${new Date().toLocaleDateString()}`
      const loadout = buildDIMLoadout(name, char.classType, gearItems, subclass)
      addLoadout(loadout)
    }

    alert(`Snapshotted ${chars.length} character loadout(s)!`)
  }

  const startEdit = (loadout: DIMLoadout) => {
    setEditingId(loadout.id)
    setEditName(loadout.name)
  }

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      updateLoadout(editingId, { name: editName.trim(), lastUpdatedAt: Date.now() })
    }
    setEditingId(null)
  }

  const classLabel = (ct: number) =>
    ct === 0 ? 'Titan' : ct === 1 ? 'Hunter' : ct === 2 ? 'Warlock' : 'Any'

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-white">Loadouts</h1>

        <div className="flex items-center gap-2">
          {/* Snapshot current equipped */}
          {profile && (
            <button
              onClick={handleSnapshotCharacter}
              className="flex items-center gap-2 px-3 py-2 bg-legendary/15 border border-legendary/30 text-legendary text-sm rounded-lg hover:bg-legendary/25 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Snapshot Equipped
            </button>
          )}

          {/* Import DIM */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-destiny-card border border-destiny-border text-gray-300 text-sm rounded-lg hover:bg-destiny-hover hover:text-white transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import DIM
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />

          {/* Export */}
          {loadouts.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 bg-destiny-card border border-destiny-border text-gray-300 text-sm rounded-lg hover:bg-destiny-hover hover:text-white transition-colors"
            >
              <Download className="w-4 h-4" />
              Export to DIM
            </button>
          )}
        </div>
      </div>

      {loadouts.length === 0 ? (
        <EmptyState onImport={() => fileInputRef.current?.click()} />
      ) : (
        <div className="space-y-3">
          {loadouts.map(loadout => (
            <LoadoutCard
              key={loadout.id}
              loadout={loadout}
              profile={profile}
              isEditing={editingId === loadout.id}
              editName={editName}
              onEditName={setEditName}
              onStartEdit={() => startEdit(loadout)}
              onSaveEdit={saveEdit}
              onDelete={() => {
                if (confirm(`Delete "${loadout.name}"?`)) deleteLoadout(loadout.id)
              }}
              classLabel={classLabel}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ onImport }: { onImport: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <BookMarked className="w-12 h-12 text-gray-600 mb-4" />
      <h2 className="text-lg font-semibold text-gray-300 mb-2">No loadouts yet</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-sm">
        Snapshot your current equipped gear with one click, or import an existing DIM backup file.
      </p>
      <button
        onClick={onImport}
        className="flex items-center gap-2 px-4 py-2 bg-legendary text-white rounded-lg hover:bg-legendary/80 transition-colors text-sm font-medium"
      >
        <Upload className="w-4 h-4" />
        Import DIM Backup
      </button>
    </div>
  )
}

function LoadoutCard({
  loadout,
  profile,
  isEditing,
  editName,
  onEditName,
  onStartEdit,
  onSaveEdit,
  onDelete,
  classLabel,
}: {
  loadout: DIMLoadout
  profile: import('../../hooks/useProfile').ProfileData | undefined
  isEditing: boolean
  editName: string
  onEditName: (n: string) => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onDelete: () => void
  classLabel: (ct: number) => string
}) {
  // Match loadout items to live profile items
  const resolvedItems = profile
    ? loadout.equipped
        .map(li => {
          // Find the instance in character equipped or inventory
          for (const charId of Object.keys(profile.characterEquipped)) {
            const found = profile.characterEquipped[charId]?.find(i => i.instanceId === li.id)
            if (found) return found
          }
          for (const charId of Object.keys(profile.characterInventory)) {
            const found = profile.characterInventory[charId]?.find(i => i.instanceId === li.id)
            if (found) return found
          }
          const fromVault = profile.vault.find(i => i.instanceId === li.id)
          if (fromVault) return fromVault
          // No instance match — just return hash-based placeholder
          return null
        })
        .filter(Boolean)
    : []

  return (
    <div className="bg-destiny-card border border-destiny-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                value={editName}
                onChange={e => onEditName(e.target.value)}
                onBlur={onSaveEdit}
                onKeyDown={e => e.key === 'Enter' && onSaveEdit()}
                autoFocus
                className="bg-destiny-surface border border-legendary/50 rounded px-2 py-0.5 text-white font-semibold text-base w-full focus:outline-none"
              />
            ) : (
              <h3 className="font-semibold text-white text-base truncate">{loadout.name}</h3>
            )}
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              <span>{classLabel(loadout.classType)}</span>
              <span>·</span>
              <span>{loadout.equipped.length} items</span>
              {loadout.lastUpdatedAt && (
                <>
                  <span>·</span>
                  <span>{new Date(loadout.lastUpdatedAt).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onStartEdit}
            className="p-1.5 rounded text-gray-500 hover:text-white hover:bg-destiny-hover transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-destiny-hover transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Item previews */}
      {resolvedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {resolvedItems.slice(0, 12).map((item, i) =>
            item ? (
              <ItemCard key={item.instanceId ?? i} item={item} size="sm" showPower={false} />
            ) : null
          )}
        </div>
      )}

      {/* No live items found */}
      {resolvedItems.length === 0 && loadout.equipped.length > 0 && (
        <p className="text-xs text-gray-500">
          {loadout.equipped.length} items saved • Sign in and refresh to see live previews
        </p>
      )}

      {/* Notes */}
      {loadout.notes && (
        <p className="text-xs text-gray-400 italic border-l-2 border-destiny-border pl-2">
          {loadout.notes}
        </p>
      )}
    </div>
  )
}
