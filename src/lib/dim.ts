import type { DIMBackup, DIMLoadout } from '../types/dim'
import type { DestinyItem } from '../types/destiny'

export function parseDIMBackup(json: string): DIMBackup {
  const data = JSON.parse(json) as DIMBackup
  if (!data || typeof data !== 'object') throw new Error('Invalid DIM backup file')
  return data
}

export function exportDIMBackup(loadouts: DIMLoadout[], existingBackup?: DIMBackup): string {
  const backup: DIMBackup = {
    settings: existingBackup?.settings ?? {},
    loadouts,
    tags: existingBackup?.tags ?? [],
    itemHashTags: existingBackup?.itemHashTags ?? [],
    triumphs: existingBackup?.triumphs ?? [],
    searches: existingBackup?.searches ?? [],
  }
  return JSON.stringify(backup, null, 2)
}

export function buildDIMLoadout(
  name: string,
  classType: number,
  equippedItems: DestinyItem[],
  subclassItem?: DestinyItem
): DIMLoadout {
  const equipped = equippedItems
    .filter(item => item.instanceId && item.definition)
    .map(item => ({
      id: item.instanceId!,
      hash: item.itemHash,
      socketOverrides: {} as Record<string, number>,
    }))

  if (subclassItem?.instanceId) {
    equipped.push({
      id: subclassItem.instanceId,
      hash: subclassItem.itemHash,
      socketOverrides: {},
    })
  }

  return {
    id: crypto.randomUUID(),
    name,
    classType,
    clearSpace: false,
    equipped,
    unequipped: [],
    parameters: {
      statConstraints: [
        { statHash: 2996146975 },  // Mobility
        { statHash: 392767087 },   // Resilience
        { statHash: 1943323491 },  // Recovery
        { statHash: 1735777505 },  // Discipline
        { statHash: 144602215 },   // Intellect
        { statHash: 4244567218 },  // Strength
      ],
      mods: [],
    },
    lastUpdatedAt: Date.now(),
    createdAt: Date.now(),
  }
}

export function downloadJSON(data: string, filename: string) {
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
