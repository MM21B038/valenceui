import { useDraggable } from '@dnd-kit/core'
import { FileText, GripVertical, Loader2, Search, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePrompts, useSkills } from '@/lib/api/prompt-entities'
import type { ReferenceType } from '@/lib/types/prompt-entities'
import { cn } from '@/lib/utils'

export const REFERENCE_LIBRARY_DRAG_PREFIX = 'reference-library:'

export interface ReferencePickerItem {
  refType: ReferenceType
  uuid: string
  name: string
}

interface ReferencePickerProps {
  onSelect: (item: ReferencePickerItem) => void
  draggable?: boolean
}

function ReferenceItem({
  item,
  onSelect,
  draggable = false,
}: {
  item: ReferencePickerItem
  onSelect: (item: ReferencePickerItem) => void
  draggable?: boolean
}) {
  const isSkill = item.refType === 'skill'

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${REFERENCE_LIBRARY_DRAG_PREFIX}${item.refType}:${item.uuid}`,
    data: item,
    disabled: !draggable,
  })

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onSelect(item)}
      {...(draggable ? listeners : {})}
      {...(draggable ? attributes : {})}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-node',
        isDragging && 'opacity-40',
        isSkill ? 'text-interactive' : 'text-connector',
        draggable && 'cursor-grab active:cursor-grabbing',
      )}
    >
      {draggable ? (
        <GripVertical className="size-3 shrink-0 text-panel-muted" />
      ) : null}
      <div
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-md',
          isSkill ? 'bg-interactive/10' : 'bg-connector/10',
        )}
      >
        {isSkill ? (
          <Sparkles className="size-3.5" />
        ) : (
          <FileText className="size-3.5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">{item.name}</p>
        <p className="text-[10px] capitalize text-panel-muted">{item.refType}</p>
      </div>
    </button>
  )
}

function FilteredList({
  items,
  query,
  emptyLabel,
  onSelect,
  draggable,
}: {
  items: ReferencePickerItem[]
  query: string
  emptyLabel: string
  onSelect: (item: ReferencePickerItem) => void
  draggable?: boolean
}) {
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return items
    return items.filter((item) => item.name.toLowerCase().includes(normalized))
  }, [items, query])

  if (filtered.length === 0) {
    return (
      <p className="px-2 py-6 text-center text-[11px] text-panel-muted">
        {query ? 'No matches.' : emptyLabel}
      </p>
    )
  }

  return (
    <div className="space-y-0.5">
      {filtered.map((item) => (
        <ReferenceItem
          key={`${item.refType}-${item.uuid}`}
          item={item}
          onSelect={onSelect}
          draggable={draggable}
        />
      ))}
    </div>
  )
}

export function ReferencePicker({ onSelect, draggable = false }: ReferencePickerProps) {
  const [query, setQuery] = useState('')
  const { data: prompts = [], isLoading: promptsLoading } = usePrompts()
  const { data: skills = [], isLoading: skillsLoading } = useSkills()

  const promptItems = useMemo(
    () =>
      prompts.map((prompt) => ({
        refType: 'prompt' as const,
        uuid: prompt.uuid,
        name: prompt.name,
      })),
    [prompts],
  )

  const skillItems = useMemo(
    () =>
      skills.map((skill) => ({
        refType: 'skill' as const,
        uuid: skill.uuid,
        name: skill.name,
      })),
    [skills],
  )

  const isLoading = promptsLoading || skillsLoading

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-panel-border px-3 py-3">
        <p className="text-xs font-semibold text-foreground">References</p>
        <p className="mt-0.5 text-[10px] leading-relaxed text-panel-muted">
          {draggable
            ? 'Drag into the editor to place, click to insert at cursor, or type @.'
            : 'Click to insert at cursor, or type @ in the editor.'}
        </p>
        <div className="relative mt-2.5">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-panel-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter references..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center py-10 text-panel-muted">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="all" className="flex h-full flex-col">
            <TabsList className="mb-2 grid w-full grid-cols-3">
              <TabsTrigger value="all" className="text-[10px]">All</TabsTrigger>
              <TabsTrigger value="prompts" className="text-[10px]">Prompts</TabsTrigger>
              <TabsTrigger value="skills" className="text-[10px]">Skills</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0 min-h-0 flex-1">
              <FilteredList
                items={[...promptItems, ...skillItems]}
                query={query}
                emptyLabel="Create prompts or skills under Basics first."
                onSelect={onSelect}
                draggable={draggable}
              />
            </TabsContent>

            <TabsContent value="prompts" className="mt-0 min-h-0 flex-1">
              <FilteredList
                items={promptItems}
                query={query}
                emptyLabel="No prompts yet."
                onSelect={onSelect}
                draggable={draggable}
              />
            </TabsContent>

            <TabsContent value="skills" className="mt-0 min-h-0 flex-1">
              <FilteredList
                items={skillItems}
                query={query}
                emptyLabel="No skills yet."
                onSelect={onSelect}
                draggable={draggable}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
