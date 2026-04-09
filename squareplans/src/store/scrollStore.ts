import { create } from 'zustand'

export type Phase =
  | 'loading'
  | 'chaos-in'
  | 'to-line'
  | 'to-circle'
  | 'scroll-driven'

interface ScrollState {
  phase: Phase
  scrollProgress: number
  activeSection: string
  selectedCard: number
  setPhase: (phase: Phase) => void
  setProgress: (progress: number) => void
  setActiveSection: (section: string) => void
  setSelectedCard: (index: number) => void
}

export const useScrollStore = create<ScrollState>((set) => ({
  phase: 'loading',
  scrollProgress: 0,
  activeSection: 'intro',
  selectedCard: -1,
  setPhase: (phase) => set({ phase }),
  setProgress: (scrollProgress) => set({ scrollProgress }),
  setActiveSection: (activeSection) => set({ activeSection }),
  setSelectedCard: (selectedCard) => set({ selectedCard }),
}))
