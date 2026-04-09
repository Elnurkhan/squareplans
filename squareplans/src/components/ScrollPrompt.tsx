import { useScrollStore } from '../store/scrollStore'

export default function ScrollPrompt() {
  const phase = useScrollStore((s) => s.phase)
  const progress = useScrollStore((s) => s.scrollProgress)

  let opacity = 0
  if (phase === 'to-circle') {
    opacity = 1
  } else if (phase === 'scroll-driven') {
    opacity = progress <= 0.15 ? 1 - progress / 0.15 : 0
  }

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
      style={{
        opacity,
        transform: `scale(${0.97 + opacity * 0.03})`,
        transition: 'opacity 0.8s cubic-bezier(0.19, 1, 0.22, 1), transform 0.8s cubic-bezier(0.19, 1, 0.22, 1)',
      }}
    >
      <div
        className="text-2xl tracking-[0.2em] uppercase font-light mb-6"
        style={{
          fontFamily: 'var(--font-sans)',
          color: 'var(--color-text)',
          letterSpacing: '0.25em',
        }}
      >
        squareplans
      </div>
      <div
        className="text-xs tracking-[0.15em]"
        style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 300,
          color: 'var(--color-muted)',
        }}
      >
        листайте, чтобы узнать больше
      </div>
    </div>
  )
}
