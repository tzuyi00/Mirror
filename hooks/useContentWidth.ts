import { useState, useEffect, useRef } from 'react'

/**
 * Custom hook to track the width of a content container and determine responsive breakpoints
 * This allows for responsive design based on actual available space, not just viewport size
 */
export function useContentWidth() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [contentWidth, setContentWidth] = useState(0)
  const [colCount, setColCount] = useState(1)

  useEffect(() => {
    if (!containerRef.current) return

    // Create ResizeObserver to watch container width changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        setContentWidth(width)

        // Determine column count based on available width
        if (width < 600) {
          setColCount(1)
        } else if (width < 1200) {
          setColCount(2)
        } else {
          setColCount(3)
        }
      }
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return {
    containerRef,
    contentWidth,
    colCount,
    gridClassName: `grid gap-6 ${
      colCount === 1
        ? 'grid-cols-1'
        : colCount === 2
        ? 'grid-cols-2'
        : 'grid-cols-3'
    }`,
  }
}
