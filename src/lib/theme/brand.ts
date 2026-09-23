/**
 * Valence brand palette — four colors mapped to UI roles in index.css.
 */

export const brand = {
  deep: '#1B3C53',   // chrome, panel
  mid: '#234C6A',    // inspector, nodes (dark)
  accent: '#456882', // connectors, icons, interactive
  sand: '#D2C1B6',   // text on dark, warm highlights
} as const

export const colorRoles = {
  chrome: 'Top bar — navigation & actions',
  panel: 'Side panels — palette & inspector',
  workspace: 'Canvas work area',
  node: 'Node & palette card surfaces',
  connector: 'Handles, edges, focus rings',
} as const

export type ThemeMode = 'light' | 'dark'

export const THEME_MODE_STORAGE_KEY = 'valence-theme'
