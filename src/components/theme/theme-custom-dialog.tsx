import { useEffect, useState } from 'react'

import { useTheme } from '@/components/theme/theme-provider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useCreateAppTheme,
  useDeleteAppTheme,
  useUpdateAppTheme,
} from '@/lib/api/app-theme'
import {
  BRAND_COLOR_LABELS,
  DEFAULT_CUSTOM_COLORS,
  type BrandColors,
} from '@/lib/theme/brand'
import {
  isValidBrandColors,
  normalizeBrandColors,
  normalizeHex,
} from '@/lib/theme/derive-tokens'
import type { AppTheme } from '@/lib/types/app-theme'

const COLOR_KEYS = Object.keys(BRAND_COLOR_LABELS) as (keyof BrandColors)[]

interface ThemeEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, dialog edits this theme (PATCH + delete). Otherwise creates. */
  theme?: AppTheme | null
}

export function ThemeEditorDialog({
  open,
  onOpenChange,
  theme = null,
}: ThemeEditorDialogProps) {
  const { applyAppTheme, clearActiveTheme, activeThemeUuid, setCustomColors } =
    useTheme()
  const createTheme = useCreateAppTheme()
  const updateTheme = useUpdateAppTheme()
  const deleteTheme = useDeleteAppTheme()

  const isEditing = Boolean(theme)
  const [name, setName] = useState('')
  const [draft, setDraft] = useState<BrandColors>(DEFAULT_CUSTOM_COLORS)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    if (theme) {
      setName(theme.name)
      setDraft({
        deep: theme.deep,
        mid: theme.mid,
        accent: theme.accent,
        sand: theme.sand,
      })
    } else {
      setName('')
      setDraft(DEFAULT_CUSTOM_COLORS)
    }
    setError(null)
  }, [open, theme])

  const updateColor = (key: keyof BrandColors, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const handleSave = async () => {
    if (!isValidBrandColors(draft)) return

    const colors = normalizeBrandColors(draft)
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Name is required')
      return
    }

    setError(null)

    try {
      if (theme) {
        const updated = await updateTheme.mutateAsync({
          uuid: theme.uuid,
          payload: { name: trimmedName.slice(0, 30), ...colors },
        })
        applyAppTheme(updated)
      } else {
        const created = await createTheme.mutateAsync({
          name: trimmedName.slice(0, 30),
          ...colors,
        })
        applyAppTheme(created)
      }
      onOpenChange(false)
    } catch {
      if (!theme) {
        setCustomColors(colors)
        onOpenChange(false)
        return
      }
      setError('Could not save theme. Check the API and try again.')
    }
  }

  const handleDelete = async () => {
    if (!theme) return
    const confirmed = window.confirm(`Delete palette "${theme.name}"?`)
    if (!confirmed) return

    try {
      await deleteTheme.mutateAsync(theme.uuid)
      if (activeThemeUuid === theme.uuid) {
        clearActiveTheme()
      }
      onOpenChange(false)
    } catch {
      setError('Could not delete theme.')
    }
  }

  const isPending =
    createTheme.isPending || updateTheme.isPending || deleteTheme.isPending
  const isValid = isValidBrandColors(draft) && name.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit palette' : 'New palette'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update name and colors, or delete this saved theme.'
              : 'Name four hex colors. They save as an App Theme on the server.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="theme-name">Name</Label>
            <Input
              id="theme-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Dune Mist"
              maxLength={30}
            />
          </div>

          {COLOR_KEYS.map((key) => {
            const normalized = normalizeHex(draft[key])
            const isFieldValid = normalized !== null

            return (
              <div key={key} className="grid gap-2">
                <Label htmlFor={`theme-${key}`}>{BRAND_COLOR_LABELS[key]}</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="size-9 shrink-0 rounded-md border border-border"
                    style={{
                      backgroundColor: isFieldValid ? normalized : '#cccccc',
                    }}
                  />
                  <Input
                    id={`theme-${key}`}
                    value={draft[key]}
                    onChange={(event) => updateColor(key, event.target.value)}
                    placeholder="#RRGGBB"
                    spellCheck={false}
                    aria-invalid={!isFieldValid}
                    className="font-mono"
                  />
                </div>
              </div>
            )
          })}

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {isEditing ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={isPending}
              className="border-destructive/40 text-destructive hover:bg-destructive hover:text-white"
            >
              {deleteTheme.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setDraft(DEFAULT_CUSTOM_COLORS)}
            >
              Reset
            </Button>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!isValid || isPending}
            >
              {isPending
                ? 'Saving…'
                : isEditing
                  ? 'Save changes'
                  : 'Create palette'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
