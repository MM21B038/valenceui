import { Loader2, Pencil, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

import { ThemeEditorDialog } from '@/components/theme/theme-custom-dialog'
import { useTheme } from '@/components/theme/theme-provider'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppThemes, useSelectAppTheme } from '@/lib/api/app-theme'
import { palettes, type BuiltInPalette } from '@/lib/theme/brand'
import type { AppTheme } from '@/lib/types/app-theme'

const builtInPaletteIds = Object.keys(palettes) as BuiltInPalette[]

type DialogMode = 'create' | 'edit' | null

function SwatchRow({ colors }: { colors: string[] }) {
  return (
    <span className="flex shrink-0 overflow-hidden rounded-sm">
      {colors.map((hex) => (
        <span
          key={hex}
          className="size-2.5 first:rounded-l-sm last:rounded-r-sm"
          style={{ backgroundColor: hex }}
        />
      ))}
    </span>
  )
}

export function ThemePalettePicker() {
  const {
    palette,
    activeThemeUuid,
    setPalette,
    applyAppTheme,
  } = useTheme()
  const { data: appThemes = [], isLoading } = useAppThemes()
  const selectTheme = useSelectAppTheme()

  const [dialogMode, setDialogMode] = useState<DialogMode>(null)

  const activeSavedTheme = useMemo(
    () => appThemes.find((theme) => theme.uuid === activeThemeUuid) ?? null,
    [appThemes, activeThemeUuid],
  )

  const selectValue = activeThemeUuid
    ? `theme:${activeThemeUuid}`
    : `builtin:${palette === 'custom' ? 'default' : palette}`

  const triggerLabel = activeSavedTheme
    ? activeSavedTheme.name
    : palette === 'dune'
      ? palettes.dune.name
      : palettes.default.name

  const triggerColors = activeSavedTheme
    ? [
        activeSavedTheme.deep,
        activeSavedTheme.mid,
        activeSavedTheme.accent,
        activeSavedTheme.sand,
      ]
    : Object.values(
        palettes[palette === 'dune' ? 'dune' : 'default'].colors,
      )

  const handleSelect = async (value: string) => {
    if (value.startsWith('builtin:')) {
      const id = value.replace('builtin:', '') as BuiltInPalette
      if (id === 'default' || id === 'dune') {
        setPalette(id)
      }
      return
    }

    if (value.startsWith('theme:')) {
      const uuid = value.replace('theme:', '')
      const theme = appThemes.find((item) => item.uuid === uuid)
      if (!theme) return
      applyAppTheme(theme)
      try {
        await selectTheme.mutateAsync(uuid)
      } catch {
        // Local apply already happened
      }
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Select
          value={selectValue}
          onValueChange={handleSelect}
          disabled={selectTheme.isPending}
        >
          <SelectTrigger
            size="sm"
            className="h-7 min-w-[9.5rem] border-chrome-fg/25 bg-transparent text-chrome-fg shadow-none hover:bg-chrome-fg/10 focus-visible:ring-chrome-fg/30 [&_svg]:text-chrome-fg/70"
            aria-label="Color palette"
          >
            <SelectValue>
              <span className="flex items-center gap-1.5">
                {isLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <SwatchRow colors={triggerColors} />
                )}
                <span className="max-w-[6rem] truncate text-xs">
                  {triggerLabel}
                </span>
              </span>
            </SelectValue>
          </SelectTrigger>

          <SelectContent align="end" className="min-w-[12rem]">
            <SelectGroup>
              <SelectLabel>Built-in</SelectLabel>
              {builtInPaletteIds.map((id) => {
                const { name, colors } = palettes[id]
                return (
                  <SelectItem key={id} value={`builtin:${id}`}>
                    <span className="flex items-center gap-2">
                      <SwatchRow colors={Object.values(colors)} />
                      <span>{name}</span>
                    </span>
                  </SelectItem>
                )
              })}
            </SelectGroup>

            {appThemes.length > 0 && (
              <>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Saved</SelectLabel>
                  {appThemes.map((theme: AppTheme) => (
                    <SelectItem key={theme.uuid} value={`theme:${theme.uuid}`}>
                      <span className="flex items-center gap-2">
                        <SwatchRow
                          colors={[
                            theme.deep,
                            theme.mid,
                            theme.accent,
                            theme.sand,
                          ]}
                        />
                        <span className="truncate">{theme.name}</span>
                        {theme.default && (
                          <span className="text-[10px] text-muted-foreground">
                            default
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </>
            )}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setDialogMode('create')}
          aria-label="Create palette"
          className="size-7 text-chrome-fg hover:bg-chrome-fg/10 hover:text-chrome-fg"
        >
          <Plus className="size-3.5" />
        </Button>

        {activeSavedTheme && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setDialogMode('edit')}
            aria-label={`Edit ${activeSavedTheme.name}`}
            className="size-7 text-chrome-fg hover:bg-chrome-fg/10 hover:text-chrome-fg"
          >
            <Pencil className="size-3.5" />
          </Button>
        )}
      </div>

      <ThemeEditorDialog
        open={dialogMode !== null}
        onOpenChange={(open) => {
          if (!open) setDialogMode(null)
        }}
        theme={dialogMode === 'edit' ? activeSavedTheme : null}
      />
    </>
  )
}
