export interface AppTheme {
  uuid: string
  name: string
  deep: string
  mid: string
  accent: string
  sand: string
  default: boolean
}

export interface AppThemeCreatePayload {
  name: string
  deep: string
  mid: string
  accent: string
  sand: string
}

export type AppThemeUpdatePayload = Partial<AppThemeCreatePayload> & {
  default?: boolean
}
