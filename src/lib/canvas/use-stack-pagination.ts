import { useEffect, useState } from 'react'

import { STACK_PAGE_INTERVAL_MS, STACK_PAGE_SIZE } from '@/lib/canvas/stack-dump'

export function padStackPageSlots<T>(items: T[]): Array<T | null> {
  if (items.length === 0) return []

  const slots: Array<T | null> = [...items]
  while (slots.length < STACK_PAGE_SIZE) {
    slots.push(null)
  }

  return slots
}

export function useStackPagination(
  itemCount: number,
  resetKey?: string | null,
  autoRotate = false,
) {
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(itemCount / STACK_PAGE_SIZE))

  useEffect(() => {
    setPage(0)
  }, [resetKey])

  useEffect(() => {
    setPage((current) => {
      const maxPage = Math.max(0, pageCount - 1)
      return current > maxPage ? maxPage : current
    })
  }, [itemCount, pageCount])

  useEffect(() => {
    if (!autoRotate || itemCount <= STACK_PAGE_SIZE) return

    const timer = window.setInterval(() => {
      setPage((current) => (current + 1) % pageCount)
    }, STACK_PAGE_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [autoRotate, itemCount, pageCount])

  return { page, pageCount, setPage }
}
