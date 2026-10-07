import type { Edge } from '@xyflow/react'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { workspaceKeys, useWorkspace } from '@/lib/api/dnd-workspace'
import { persistWorkspaceGraph } from '@/lib/canvas/workspace-graph'
import type { WorkspaceDetail, WorkspaceType } from '@/lib/types/dnd-workspace'
import type { ValenceNode } from '@/lib/types/workflow'
import { useWorkflowStore } from '@/stores/workflow-store'

const AUTOSAVE_DELAY_MS = 10_000

type SavePayload = {
  workspaceId: string
  workspaceType: WorkspaceType
  name: string
  nodes: ValenceNode[]
  edges: Edge[]
  signature: string
}

function workspaceGraphSignature(nodes: ValenceNode[], edges: Edge[]) {
  const nodePart = nodes
    .map((node) => {
      const data = { ...node.data } as Record<string, unknown>
      delete data.containerStatus
      return {
        id: node.id,
        type: node.type ?? '',
        x: node.position.x,
        y: node.position.y,
        hidden: node.hidden === true,
        data,
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id))

  const edgePart = edges
    .map((edge) => ({
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? '',
      targetHandle: edge.targetHandle ?? '',
    }))
    .sort((a, b) =>
      `${a.source}|${a.sourceHandle}|${a.target}|${a.targetHandle}`.localeCompare(
        `${b.source}|${b.sourceHandle}|${b.target}|${b.targetHandle}`,
      ),
    )

  return JSON.stringify({ nodes: nodePart, edges: edgePart })
}

/**
 * Autosave the open executor or A2A workspace 10 seconds after the last
 * canvas change. The loaded graph is the baseline, so opening a workspace
 * does not write it back.
 */
export function useWorkspaceAutosave() {
  const queryClient = useQueryClient()
  const workflowId = useWorkflowStore((state) => state.workflowId)
  const workflowName = useWorkflowStore((state) => state.workflowName)
  const workspaceType = useWorkflowStore((state) => state.workspaceType)
  const nodes = useWorkflowStore((state) => state.nodes)
  const edges = useWorkflowStore((state) => state.edges)

  const isPersisted = workflowId !== 'local-draft'
  const { isSuccess: workspaceLoaded } = useWorkspace(
    isPersisted ? workflowId : '',
  )

  const signature = useMemo(
    () => workspaceGraphSignature(nodes, edges),
    [nodes, edges],
  )

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'pending' | 'saved'>('idle')
  const [resumeTick, setResumeTick] = useState(0)

  const savingRef = useRef(false)
  const savedSignatureRef = useRef<string | null>(null)
  const payloadRef = useRef<SavePayload | null>(null)
  const queuedRef = useRef<SavePayload | null>(null)
  const seenWorkspaceRef = useRef(workflowId)
  const saveEpochRef = useRef(0)
  const suppressFlushRef = useRef(false)
  const signatureBeforeDiscardRef = useRef<string | null>(null)
  const timerRef = useRef<number | null>(null)

  const persistPayload = useCallback(
    async (payload: SavePayload, epoch: number) => {
      if (payload.workspaceId === 'local-draft') return
      if (savingRef.current) {
        queuedRef.current = payload
        return
      }

      savingRef.current = true
      setSaving(true)
      setSaveError(null)
      try {
        const previous =
          queryClient.getQueryData<WorkspaceDetail>(
            workspaceKeys.detail(payload.workspaceId),
          ) ?? null
        const saved = await persistWorkspaceGraph({
          workspaceUuid: payload.workspaceId,
          workspaceType: payload.workspaceType,
          name: payload.name,
          nodes: payload.nodes,
          edges: payload.edges,
          previous,
        })
        queryClient.setQueryData(
          workspaceKeys.detail(payload.workspaceId),
          saved,
        )
        if (
          saveEpochRef.current === epoch &&
          payload.workspaceId === seenWorkspaceRef.current
        ) {
          savedSignatureRef.current = payload.signature
          setPhase('saved')
        }
      } catch {
        if (
          saveEpochRef.current === epoch &&
          payload.workspaceId === seenWorkspaceRef.current
        ) {
          setSaveError('Save failed.')
        }
      } finally {
        savingRef.current = false
        setSaving(false)
        const queued = queuedRef.current
        queuedRef.current = null
        if (queued && queued.signature !== payload.signature) {
          void persistPayload(queued, saveEpochRef.current)
        }
      }
    },
    [queryClient],
  )

  // Keep the latest graph for a flush when the workspace changes. This effect
  // is declared before the leave-flush effect so a workspace switch still
  // flushes the previous graph (cleanups run before the next effect pass).
  useEffect(() => {
    if (seenWorkspaceRef.current !== workflowId) {
      seenWorkspaceRef.current = workflowId
      savedSignatureRef.current = signature
      suppressFlushRef.current = false
      setPhase('idle')
      setSaveError(null)
    } else if (savedSignatureRef.current === null) {
      savedSignatureRef.current = signature
    }

    payloadRef.current = {
      workspaceId: workflowId,
      workspaceType,
      name: workflowName,
      nodes,
      edges,
      signature,
    }
  }, [edges, nodes, signature, workflowId, workflowName, workspaceType])

  useEffect(() => {
    if (!isPersisted || !workspaceLoaded) return
    if (suppressFlushRef.current) return
    if (savedSignatureRef.current === signature) return
    if (saving) return

    setPhase('pending')
    const epoch = saveEpochRef.current
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      const payload = payloadRef.current
      if (!payload || payload.workspaceId !== workflowId) return
      void persistPayload(payload, epoch)
    }, AUTOSAVE_DELAY_MS)

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [
    signature,
    isPersisted,
    workspaceLoaded,
    saving,
    workflowId,
    persistPayload,
    resumeTick,
  ])

  useEffect(() => {
    saveEpochRef.current += 1
    return () => {
      if (suppressFlushRef.current) return
      const payload = payloadRef.current
      if (!payload || payload.workspaceId === 'local-draft') return
      if (savedSignatureRef.current === payload.signature) return
      void persistPayload(payload, saveEpochRef.current)
    }
  }, [workflowId, persistPayload])

  const saveNow = useCallback(() => {
    if (!isPersisted) {
      setSaveError('Create a workspace from Home first.')
      return
    }
    const payload = payloadRef.current
    if (!payload || payload.workspaceId !== workflowId) {
      setSaveError('Create a workspace from Home first.')
      return
    }
    void persistPayload(payload, saveEpochRef.current)
  }, [isPersisted, persistPayload, workflowId])

  const discardUnsavedGraph = useCallback(() => {
    suppressFlushRef.current = true
    signatureBeforeDiscardRef.current = savedSignatureRef.current
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (payloadRef.current) {
      savedSignatureRef.current = payloadRef.current.signature
    }
    setPhase('idle')
    setSaveError(null)
  }, [])

  const resumeAutosave = useCallback(() => {
    suppressFlushRef.current = false
    if (signatureBeforeDiscardRef.current !== null) {
      savedSignatureRef.current = signatureBeforeDiscardRef.current
    }
    setResumeTick((tick) => tick + 1)
  }, [])

  const autosavePhase: 'off' | 'saving' | 'saved' | 'pending' =
    !isPersisted || saveError
      ? 'off'
      : saving
        ? 'saving'
        : phase === 'pending'
          ? 'pending'
          : 'saved'

  return {
    saving,
    saveError,
    saveNow,
    discardUnsavedGraph,
    resumeAutosave,
    autosavePhase,
  }
}
