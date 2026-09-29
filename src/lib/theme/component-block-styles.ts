import type { CSSProperties } from 'react'

import type { ThemedComponentType } from '@/lib/theme/derive-component-tokens'

const CSS_PREFIX: Record<ThemedComponentType, string> = {
  llm: 'llm',
  toolServer: 'tool-server',
  threadConfig: 'thread-config',
  serverStack: 'server-stack',
  agentSkill: 'agent-skill',
  agentInterface: 'agent-interface',
  agentCard: 'agent-card',
  agentExecutor: 'agent-executor',
  skillStack: 'skill-stack',
  interfaceStack: 'interface-stack',
}

export function componentVar(
  type: ThemedComponentType,
  token: string,
): string {
  return `var(--${CSS_PREFIX[type]}-${token})`
}

export function componentSurfaceStyle(type: ThemedComponentType): CSSProperties {
  return { backgroundColor: componentVar(type, 'surface') }
}

export function componentSurfaceHoverStyle(
  type: ThemedComponentType,
): CSSProperties {
  return { backgroundColor: componentVar(type, 'surface-hover') }
}

export function componentPaintBorderStyle(
  type: ThemedComponentType,
): CSSProperties {
  const surface = componentVar(type, 'surface')
  const from = componentVar(type, 'icon-from')
  const to = componentVar(type, 'icon-to')

  return {
    backgroundImage: `linear-gradient(${surface}, ${surface}), linear-gradient(135deg, ${from}, ${to})`,
    backgroundOrigin: 'padding-box, border-box',
    backgroundClip: 'padding-box, border-box',
    border: '2px solid transparent',
  }
}

/** Surface + border for palette/rail/nodes — avoids background/backgroundColor clashes. */
export function componentBlockChromeStyle(
  type: ThemedComponentType,
  options: { selected?: boolean; hasPaint?: boolean; hovered?: boolean } = {},
): CSSProperties {
  const { selected = false, hasPaint = false, hovered = false } = options

  if (selected) {
    return componentSelectedRingStyle(type)
  }

  if (hasPaint || hovered) {
    return componentPaintBorderStyle(type)
  }

  return {
    ...componentSurfaceStyle(type),
    ...componentBorderMutedStyle(type),
  }
}

/**
 * Outer hex ring fill — CSS `border` does not follow clip-path, so hex
 * strokes are drawn as a larger clipped layer behind the surface.
 */
export function componentHexRingStyle(
  type: ThemedComponentType,
  options: { selected?: boolean; hasPaint?: boolean } = {},
): CSSProperties {
  const from = componentVar(type, 'icon-from')
  const to = componentVar(type, 'icon-to')
  const muted = componentVar(type, 'border-muted')
  const { selected = false, hasPaint = false } = options

  if (selected || hasPaint) {
    return {
      backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
      ...(selected
        ? {
            filter: `drop-shadow(0 0 6px color-mix(in oklch, ${to} 45%, transparent)) drop-shadow(0 8px 18px color-mix(in oklch, ${from} 22%, transparent))`,
          }
        : {}),
    }
  }

  return { backgroundColor: muted }
}

export function componentBorderMutedStyle(
  type: ThemedComponentType,
): CSSProperties {
  return {
    borderColor: componentVar(type, 'border-muted'),
    borderWidth: 2,
    borderStyle: 'solid',
  }
}

export function componentIconGradientStyle(
  type: ThemedComponentType,
): CSSProperties {
  return {
    backgroundImage: `linear-gradient(135deg, ${componentVar(type, 'icon-from')}, ${componentVar(type, 'icon-to')})`,
    color: componentVar(type, 'icon-fg'),
  }
}

export function componentSelectedRingStyle(
  type: ThemedComponentType,
): CSSProperties {
  const from = componentVar(type, 'icon-from')
  const to = componentVar(type, 'icon-to')

  return {
    ...componentPaintBorderStyle(type),
    boxShadow: `0 0 0 4px color-mix(in oklch, ${to} 22%, transparent), 0 8px 24px color-mix(in oklch, ${from} 18%, transparent)`,
  }
}

export function componentShellStyle(
  type: ThemedComponentType,
  selected: boolean,
): CSSProperties {
  const from = componentVar(type, 'icon-from')
  const to = componentVar(type, 'icon-to')

  return {
    backgroundImage: selected
      ? `linear-gradient(135deg, color-mix(in oklch, ${from} 75%, transparent), color-mix(in oklch, ${to} 75%, transparent))`
      : `linear-gradient(135deg, color-mix(in oklch, ${from} 28%, transparent), color-mix(in oklch, ${to} 28%, transparent))`,
  }
}

/** @deprecated Use componentPaintBorderStyle */
export function componentBorderStyle(type: ThemedComponentType): CSSProperties {
  return componentPaintBorderStyle(type)
}
