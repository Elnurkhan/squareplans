import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useScrollStore } from '../store/scrollStore'

const NAV_ITEMS = [
  { id: 'intro', label: 'интро' },
  { id: 'projects', label: 'проекты' },
  { id: 'about', label: 'о нас' },
  { id: 'contacts', label: 'контакты' },
]

export default function Header() {
  const headerRef = useRef<HTMLElement>(null)
  const activeSection = useScrollStore((s) => s.activeSection)
  const phase = useScrollStore((s) => s.phase)

  useEffect(() => {
    if (!headerRef.current) return

    const el = headerRef.current

    gsap.set(el, { opacity: 0, y: '0%' })

    const tl = gsap.timeline({ delay: 0.5 })

    // Fade in at center — slow and elegant
    tl.to(el, {
      opacity: 1,
      duration: 1.2,
      ease: 'power2.out',
    })

    // Move to top — smooth and luxurious
    tl.to(el, {
      y: '-45svh',
      duration: 1.4,
      ease: 'power4.inOut',
      delay: 0.6,
    })

    tl.call(() => {
      gsap.set(el, { y: 0, top: '2rem', position: 'fixed' })
      useScrollStore.getState().setPhase('chaos-in')
    })

    return () => { tl.kill() }
  }, [])

  return (
    <header
      ref={headerRef}
      className="fixed left-0 right-0 z-50 flex justify-center"
      style={{
        top: '50%',
        transform: 'translateY(-50%)',
        opacity: 0,
      }}
    >
      <nav className="flex gap-8">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="relative text-sm uppercase"
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 300,
              color:
                phase === 'scroll-driven' && activeSection === item.id
                  ? 'var(--color-text)'
                  : 'var(--color-muted)',
              letterSpacing: '0.12em',
              fontSize: '0.8rem',
              transition: 'color 0.6s cubic-bezier(0.19, 1, 0.22, 1)',
            }}
          >
            {item.label}
            <span
              className="absolute -bottom-1 left-0 right-0 h-px bg-current"
              style={{
                transform:
                  phase === 'scroll-driven' && activeSection === item.id
                    ? 'scaleX(1)'
                    : 'scaleX(0)',
                transition: 'transform 0.6s cubic-bezier(0.19, 1, 0.22, 1)',
                transformOrigin: 'left',
              }}
            />
          </a>
        ))}
      </nav>
    </header>
  )
}
