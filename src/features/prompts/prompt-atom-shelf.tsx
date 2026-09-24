import { useDraggable } from '@dnd-kit/core'
import { FileText, GripVertical, Loader2, Sparkles } from 'lucide-react'

import { usePrompts, useSkills } from '@/lib/api/prompt-entities'
import {
  REFERENCE_LIBRARY_DRAG_PREFIX,
  type ReferencePickerItem,
} from '@/features/prompts/reference-picker'
import { cn } from '@/lib/utils'

function ShelfChip({
  item,
  onSelect,
}: {
  item: ReferencePickerItem
  onSelect: (item: ReferencePickerItem) => void
}) {
  const isSkill = item.refType === 'skill'

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${REFERENCE_LIBRARY_DRAG_PREFIX}${item.refType}:${item.uuid}`,
    data: item,
  })

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onSelect(item)}
      {...listeners}
      {...attributes}
      className={cn(
        'flex shrink-0 cursor-grab items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium shadow-sm transition-all active:cursor-grabbing',
        isDragging && 'opacity-40',
        isSkill
          ? 'border-interactive/35 bg-interactive/10 text-interactive hover:bg-interactive/15'
          : 'border-connector/35 bg-connector/10 text-connector hover:bg-connector/15',
      )}
    >
      <GripVertical className="size-3 text-panel-muted" />
      {isSkill ? (
        <Sparkles className="size-3.5" />
      ) : (
        <FileText className="size-3.5" />
      )}
      <span className="max-w-[140px] truncate">{item.name}</span>
    </button>
  )
}

interface PromptAtomShelfProps {
  onSelect: (item: ReferencePickerItem) => void
}

export function PromptAtomShelf({ onSelect }: PromptAtomShelfProps) {
  const { data: prompts = [], isLoading: promptsLoading } = usePrompts()
  const { data: skills = [], isLoading: skillsLoading } = useSkills()

  const items: ReferencePickerItem[] = [
    ...prompts.map((prompt) => ({
      refType: 'prompt' as const,
      uuid: prompt.uuid,
      name: prompt.name,
    })),
    ...skills.map((skill) => ({
      refType: 'skill' as const,
      uuid: skill.uuid,
      name: skill.name,
    })),
  ]

  const isLoading = promptsLoading || skillsLoading

  return (
    <div className="shrink-0 border-t border-panel-border bg-panel/50">
      <div className="flex items-center gap-3 px-4 py-2">
        <p className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-panel-muted">
          Atom shelf
        </p>
        <div className="h-px flex-1 bg-panel-border" />
        <p className="shrink-0 text-[10px] text-panel-muted">
          Drag onto canvas or click to insert
        </p>
      </div>

      <div className="scrollbar-hidden flex gap-2 overflow-x-auto px-4 pb-4">
        {isLoading ? (
          <div className="flex w-full justify-center py-3 text-panel-muted">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-2 text-xs text-panel-muted">
            Create prompts & skills in the workbench first.
          </p>
        ) : (
          items.map((item) => (
            <ShelfChip key={`${item.refType}-${item.uuid}`} item={item} onSelect={onSelect} />
          ))
        )}
      </div>
    </div>
  )
}
