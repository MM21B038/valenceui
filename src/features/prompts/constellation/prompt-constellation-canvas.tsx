import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Node,
  type OnNodeDrag,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { LabAtomNode } from '@/features/prompts/constellation/lab-atom-node'
import { LabCompoundNode } from '@/features/prompts/constellation/lab-compound-node'
import { LabNucleus } from '@/features/prompts/constellation/lab-nucleus'
import { ValenceBondEdge } from '@/features/prompts/constellation/valence-bond-edge'
import type { buildReferenceUsageIndex } from '@/lib/prompts/entity-usage'
import {
  moleculeNodeId,
  parseMoleculeNodeId,
  type MoleculePosition,
} from '@/lib/prompts/molecule-layout'
import { useMoleculeGraph } from '@/lib/prompts/use-molecule-graph'
import type { LabEntityRecord } from '@/lib/prompts/use-lab-entity-cache'
import type { EntityKind } from '@/lib/types/prompt-entities'

const nodeTypes = {
  labAtom: LabAtomNode,
  labCompound: LabCompoundNode,
}

const edgeTypes = {
  valenceBond: ValenceBondEdge,
}

function nodesOverlap(a: Node, b: Node) {
  const ax = a.position.x
  const ay = a.position.y
  const aw = a.type === 'labCompound' ? 200 : 118
  const ah = a.type === 'labCompound' ? 100 : 108
  const bx = b.position.x
  const by = b.position.y
  const bw = b.type === 'labCompound' ? 200 : 118
  const bh = b.type === 'labCompound' ? 100 : 108

  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

interface PromptConstellationCanvasProps {
  records: LabEntityRecord[]
  usageIndex: ReturnType<typeof buildReferenceUsageIndex>
  selectedKey: string | null
  onSelect: (kind: EntityKind, uuid: string) => void
  onCreate: (kind: EntityKind) => void
  onBondAtomToCompound: (
    atomKind: 'prompt' | 'skill',
    atomUuid: string,
    compoundKind: 'system-prompt' | 'compression-prompt',
    compoundUuid: string,
  ) => void
}

function ConstellationFlowInner({
  records,
  usageIndex,
  selectedKey,
  onSelect,
  onCreate,
  onBondAtomToCompound,
}: PromptConstellationCanvasProps) {
  const { fitView, getNodes } = useReactFlow()
  const [savedPositions, setSavedPositions] = useState<Map<string, MoleculePosition>>(
    () => new Map(),
  )

  const highlightedKeys = useMemo(() => {
    const keys = new Set<string>()
    if (!selectedKey) return keys

    const [kind, uuid] = selectedKey.split(':')
    if (!kind || !uuid) return keys

    keys.add(selectedKey)

    if (kind === 'prompt' || kind === 'skill') {
      for (const record of records) {
        if (record.kind !== 'system-prompt' && record.kind !== 'compression-prompt') continue
        const refs = usageIndex.compositionRefs.get(record.uuid) ?? []
        if (refs.some((ref) => ref.refType === kind && ref.uuid === uuid)) {
          keys.add(`${record.kind}:${record.uuid}`)
        }
      }
    } else {
      const refs = usageIndex.compositionRefs.get(uuid) ?? []
      for (const ref of refs) {
        const atomKind = ref.refType === 'skill' ? 'skill' : 'prompt'
        keys.add(`${atomKind}:${ref.uuid}`)
      }
    }

    return keys
  }, [selectedKey, records, usageIndex])

  const { nodes, edges } = useMoleculeGraph(
    records,
    usageIndex,
    savedPositions,
    selectedKey,
    highlightedKeys,
  )

  useEffect(() => {
    if (nodes.length === 0) return
    const timer = window.setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [nodes.length, fitView])

  useEffect(() => {
    if (!selectedKey || nodes.length === 0) return
    const colonIndex = selectedKey.indexOf(':')
    if (colonIndex === -1) return
    const kind = selectedKey.slice(0, colonIndex) as EntityKind
    const uuid = selectedKey.slice(colonIndex + 1)
    const nodeId = moleculeNodeId(kind, uuid)
    const node = nodes.find((entry) => entry.id === nodeId)
    if (!node) return

    fitView({ nodes: [node], padding: 0.85, duration: 500, maxZoom: 1.25 })
  }, [selectedKey, nodes, fitView])

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const parsed = parseMoleculeNodeId(node.id)
      if (!parsed) return
      onSelect(parsed.kind, parsed.uuid)
    },
    [onSelect],
  )

  const handleNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      setSavedPositions((previous) => {
        const next = new Map(previous)
        next.set(node.id, node.position)
        return next
      })

      if (!node.id.startsWith('atom:')) return

      const parsed = parseMoleculeNodeId(node.id)
      if (!parsed || (parsed.kind !== 'prompt' && parsed.kind !== 'skill')) return

      const compounds = getNodes().filter((entry) => entry.id.startsWith('compound:'))
      for (const compound of compounds) {
        if (!nodesOverlap(node, compound)) continue
        const compoundParsed = parseMoleculeNodeId(compound.id)
        if (
          !compoundParsed ||
          (compoundParsed.kind !== 'system-prompt' &&
            compoundParsed.kind !== 'compression-prompt')
        ) {
          continue
        }

        onBondAtomToCompound(
          parsed.kind,
          parsed.uuid,
          compoundParsed.kind,
          compoundParsed.uuid,
        )
        return
      }
    },
    [getNodes, onBondAtomToCompound],
  )

  const isEmpty = records.length === 0

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        onNodeDragStop={handleNodeDragStop}
        nodesConnectable={false}
        elementsSelectable
        panOnScroll
        zoomOnScroll
        minZoom={0.35}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
        className="bg-transparent"
        defaultEdgeOptions={{ type: 'valenceBond' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="var(--workspace-dot)"
        />
        <Controls showInteractive={false} className="!border-panel-border !bg-node/90" />
        <MiniMap
          pannable
          zoomable
          className="!border-panel-border !bg-node/90"
          nodeColor={(node) =>
            node.type === 'labCompound' ? 'var(--interactive)' : 'var(--connector)'
          }
        />
      </ReactFlow>

      {isEmpty ? <LabNucleus onCreate={onCreate} /> : null}

      {!isEmpty ? (
        <div className="pointer-events-none absolute bottom-5 left-1/2 z-10 -translate-x-1/2">
          <div className="rounded-full border border-panel-border bg-node/80 px-4 py-2 text-[10px] text-panel-muted shadow-lg backdrop-blur-md">
            Drag atoms onto compounds to bond · Click to focus · Ctrl+K to jump
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function PromptConstellationCanvas(props: PromptConstellationCanvasProps) {
  return (
    <ReactFlowProvider>
      <ConstellationFlowInner {...props} />
    </ReactFlowProvider>
  )
}
