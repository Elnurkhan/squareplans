import { useEffect, useRef } from 'react'
import Header from './components/Header'
import IntroSection from './components/IntroSection'

export default function App() {
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot = cursorRef.current
    if (!dot) return

    let x = 0, y = 0
    let targetX = 0, targetY = 0
    let rafId: number

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX
      targetY = e.clientY
    }

    const onMouseOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a, button')) {
        dot.classList.add('hovering')
      }
    }

    const onMouseOut = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a, button')) {
        dot.classList.remove('hovering')
      }
    }

    const animate = () => {
      x += (targetX - x) * 0.15
      y += (targetY - y) * 0.15
      dot.style.left = `${x}px`
      dot.style.top = `${y}px`
      rafId = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseover', onMouseOver)
    document.addEventListener('mouseout', onMouseOut)
    rafId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseover', onMouseOver)
      document.removeEventListener('mouseout', onMouseOut)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div className="bg-bg min-w-[320px]">
      <Header />
      <IntroSection />
      <div ref={cursorRef} className="cursor-dot" />
    </div>
  )
}
