import type { buildReferenceUsageIndex } from '@/lib/prompts/entity-usage'
import { referenceKey } from '@/lib/prompts/reference-syntax'
import type { LabEntityRecord } from '@/lib/prompts/use-lab-entity-cache'
import { isComposedKind, type EntityKind } from '@/lib/types/prompt-entities'

export interface MoleculePosition {
  x: number
  y: number
}

const ATOM_BASE_X = 100
const COMPOUND_BASE_X = 560
const ROW_GAP = 148
const ORBIT_RADIUS = 72

export function moleculeNodeId(kind: EntityKind, uuid: string) {
  return isComposedKind(kind) ? `compound:${kind}:${uuid}` : `atom:${kind}:${uuid}`
}

export function parseMoleculeNodeId(id: string) {
  const [zone, kind, ...rest] = id.split(':')
  const uuid = rest.join(':')
  if (!zone || !kind || !uuid) return null
  return { zone, kind: kind as EntityKind, uuid }
}

export function computeMoleculeLayout(
  records: LabEntityRecord[],
  usageIndex: ReturnType<typeof buildReferenceUsageIndex>,
  savedPositions: Map<string, MoleculePosition>,
): Map<string, MoleculePosition> {
  const positions = new Map<string, MoleculePosition>()

  const atoms = records.filter((record) => !isComposedKind(record.kind))
  const compounds = records.filter((record) => isComposedKind(record.kind))

  compounds.forEach((compound, index) => {
    const id = moleculeNodeId(compound.kind, compound.uuid)
    const saved = savedPositions.get(id)
    if (saved) {
      positions.set(id, saved)
      return
    }

    const refs = usageIndex.compositionRefs.get(compound.uuid) ?? []
    let y = 80 + index * ROW_GAP

    if (refs.length > 0) {
      const bondedYs = refs
        .map((ref) => {
          const atomKind = ref.refType === 'skill' ? 'skill' : 'prompt'
          const atomId = moleculeNodeId(atomKind, ref.uuid)
          return positions.get(atomId)?.y
        })
        .filter((value): value is number => value !== undefined)

      if (bondedYs.length > 0) {
        y = bondedYs.reduce((sum, value) => sum + value, 0) / bondedYs.length
      }
    }

    positions.set(id, { x: COMPOUND_BASE_X, y })
  })

  atoms.forEach((atom, index) => {
    const id = moleculeNodeId(atom.kind, atom.uuid)
    const saved = savedPositions.get(id)
    if (saved) {
      positions.set(id, saved)
      return
    }

    const bondCount =
      usageIndex.atomUsage.get(referenceKey(
        atom.kind === 'skill' ? 'skill' : 'prompt',
        atom.uuid,
      )) ?? 0

    const column = atom.kind === 'skill' ? 1 : 0
    const baseY = 60 + index * ROW_GAP
    const orbitOffset = bondCount > 0 ? Math.sin(index * 1.4) * ORBIT_RADIUS : 0

    positions.set(id, {
      x: ATOM_BASE_X + column * 130,
      y: baseY + orbitOffset,
    })
  })

  return positions
}
