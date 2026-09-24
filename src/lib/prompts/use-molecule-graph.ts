import type { Edge, Node } from '@xyflow/react'
import { useMemo } from 'react'

import type { buildReferenceUsageIndex } from '@/lib/prompts/entity-usage'
import {
  computeMoleculeLayout,
  moleculeNodeId,
  type MoleculePosition,
} from '@/lib/prompts/molecule-layout'
import { previewText } from '@/lib/prompts/resolve-references'
import {
  getAtomBondCount,
  getCompositionRefCount,
} from '@/lib/prompts/use-reference-usage'
import type { LabEntityRecord } from '@/lib/prompts/use-lab-entity-cache'
import { isComposedKind } from '@/lib/types/prompt-entities'

export interface AtomNodeData {
  kind: 'prompt' | 'skill'
  uuid: string
  name: string
  preview: string
  bondCount: number
  selected: boolean
  highlighted: boolean
  [key: string]: unknown
}

export interface CompoundNodeData {
  kind: 'system-prompt' | 'compression-prompt'
  uuid: string
  name: string
  preview: string
  refCount: number
  selected: boolean
  highlighted: boolean
  [key: string]: unknown
}

export function useMoleculeGraph(
  records: LabEntityRecord[],
  usageIndex: ReturnType<typeof buildReferenceUsageIndex>,
  savedPositions: Map<string, MoleculePosition>,
  selectedKey: string | null,
  highlightedKeys: Set<string>,
) {
  return useMemo(() => {
    const positions = computeMoleculeLayout(records, usageIndex, savedPositions)
    const nodes: Node[] = []
    const edges: Edge[] = []

    for (const record of records) {
      const id = moleculeNodeId(record.kind, record.uuid)
      const position = positions.get(id) ?? { x: 0, y: 0 }
      const selected = selectedKey === `${record.kind}:${record.uuid}`
      const highlighted = highlightedKeys.has(`${record.kind}:${record.uuid}`)

      if (isComposedKind(record.kind)) {
        nodes.push({
          id,
          type: 'labCompound',
          position,
          data: {
            kind: record.kind,
            uuid: record.uuid,
            name: record.name,
            preview: previewText(record.content, 60),
            refCount: getCompositionRefCount(usageIndex, record.uuid),
            selected,
            highlighted,
          } satisfies CompoundNodeData,
        })

        const refs = usageIndex.compositionRefs.get(record.uuid) ?? []
        for (const ref of refs) {
          const atomKind = ref.refType === 'skill' ? 'skill' : 'prompt'
          const atomId = moleculeNodeId(atomKind, ref.uuid)
          edges.push({
            id: `bond-${id}-${atomId}`,
            source: atomId,
            target: id,
            type: 'valenceBond',
            animated: true,
            data: { highlighted },
          })
        }
      } else {
        nodes.push({
          id,
          type: 'labAtom',
          position,
          data: {
            kind: record.kind as 'prompt' | 'skill',
            uuid: record.uuid,
            name: record.name,
            preview: previewText(record.content, 40),
            bondCount: getAtomBondCount(
              usageIndex,
              record.kind === 'skill' ? 'skill' : 'prompt',
              record.uuid,
            ),
            selected,
            highlighted,
          } satisfies AtomNodeData,
        })
      }
    }

    return { nodes, edges }
  }, [records, usageIndex, savedPositions, selectedKey, highlightedKeys])
}
