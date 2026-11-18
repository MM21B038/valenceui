import type {
  WorkspaceAggregateState,
  WorkspaceExecutorStatus,
} from '@/lib/types/dnd-workspace'
import { cn } from '@/lib/utils'

/** Normalize API/Docker status strings for node display. */
export function normalizeContainerStatus(
  status: string | null | undefined,
): string | null {
  if (!status) return null
  const lower = status.toLowerCase()
  if (lower === 'not_found' || lower === 'not_started') return 'not_started'
  return status
}

export function containerStatusLabel(
  status: string | null | undefined,
): string | null {
  const normalized = normalizeContainerStatus(status)
  if (!normalized) return null
  if (normalized === 'not_started') return 'not started'
  return normalized
}

export type ContainerLampTone = 'running' | 'partial' | 'stopped' | 'idle'

export function containerStatusTone(
  status: string | null | undefined,
): ContainerLampTone {
  const lower = normalizeContainerStatus(status)?.toLowerCase() ?? ''
  if (
    lower.includes('run') ||
    lower.includes('up') ||
    lower === 'created' ||
    lower === 'restarting'
  ) {
    return 'running'
  }
  if (lower === 'not_started' || !lower) return 'idle'
  if (lower.includes('exited') || lower.includes('stop') || lower === 'dead') {
    return 'stopped'
  }
  return 'partial'
}

export const CONTAINER_LAMP_CLASS: Record<ContainerLampTone, string> = {
  running: 'bg-emerald-500',
  partial: 'bg-amber-500',
  stopped: 'bg-chrome-muted',
  idle: 'bg-chrome-muted/70',
}

export function aggregateStateLabel(state: WorkspaceAggregateState): string {
  switch (state) {
    case 'running':
      return 'Running'
    case 'partial':
      return 'Partial'
    case 'stopped':
      return 'Stopped'
    case 'not_started':
      return 'Not started'
  }
}

export function aggregateStateChipClass(state: WorkspaceAggregateState): string {
  switch (state) {
    case 'running':
      return 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
    case 'partial':
      return 'border-amber-500/50 bg-amber-500/15 text-amber-200'
    case 'stopped':
      return 'border-chrome-fg/25 bg-chrome-fg/5 text-chrome-muted'
    case 'not_started':
      return 'border-chrome-fg/20 bg-transparent text-chrome-muted'
  }
}

export function aggregateStateDotClass(state: WorkspaceAggregateState): string {
  return cn(
    'size-1.5 shrink-0 rounded-full',
    state === 'running' && 'bg-emerald-500',
    state === 'partial' && 'bg-amber-500',
    (state === 'stopped' || state === 'not_started') && 'bg-chrome-muted',
  )
}

/** Map status-API executors → display containerStatus for bound nodes. */
export function displayStatusFromExecutor(
  executor: WorkspaceExecutorStatus,
): string | null {
  return normalizeContainerStatus(executor.container_status)
}
