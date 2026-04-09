import { useRef } from 'react'
import { useScrollStore } from '../store/scrollStore'

const LINES = [
  'индивидуальные дизайн-проекты',
  'для жилых и коммерческих',
  'помещений под ключ',
  'авторский надзор',
]

export default function TextReveal() {
  const containerRef = useRef<HTMLDivElement>(null)
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([])
  const phase = useScrollStore((s) => s.phase)
  const progress = useScrollStore((s) => s.scrollProgress)

  // Calculate visibility for each word based on scroll progress
  // Words appear in the range 0.15 - 0.85 (circle already formed, full scroll for text)
  const lineProgress = (lineIndex: number) => {
    const rangeStart = 0.15
    const rangeEnd = 0.85
    const totalRange = rangeEnd - rangeStart
    const perLine = totalRange / LINES.length
    const lineStart = rangeStart + lineIndex * perLine
    const lineEnd = lineStart + perLine

    if (progress < lineStart) return 0
    if (progress > lineEnd) return 1
    return (progress - lineStart) / (lineEnd - lineStart)
  }

  const isVisible = phase === 'scroll-driven' && progress >= 0.12

  return (
    <div
      ref={containerRef}
      className="absolute inset-x-0 bottom-0 flex justify-center z-10 pointer-events-none"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        paddingBottom: 'clamp(2rem, 5vh, 4rem)',
      }}
    >
      <div className="text-center max-w-md px-6 flex flex-col items-center gap-1">
        {LINES.map((line, i) => {
          const lp = lineProgress(i)
          const eased = lp * lp * (3 - 2 * lp) // smoothstep

          return (
            <div
              key={i}
              ref={(el) => { wordsRef.current[i] = el }}
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(0.85rem, 1.6vw, 1.15rem)',
                fontWeight: 300,
                fontStyle: 'italic',
                color: 'var(--color-text)',
                opacity: eased,
                transform: `translateY(${(1 - eased) * 20}px)`,
                filter: `blur(${(1 - eased) * 6}px)`,
                transition: 'none',
                whiteSpace: 'nowrap',
                lineHeight: 1.6,
                letterSpacing: '0.03em',
              }}
            >
              {line}
            </div>
          )
        })}
      </div>
    </div>
  )
}
