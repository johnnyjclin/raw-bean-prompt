import { createContext, useContext, useState, useCallback } from 'react'

export interface Skill {
  id: string
  name: string
  rarity: string
  slot?: number
}

interface AppState {
  robotHeadSlots: (Skill | null)[]
  assets: Skill[]
  addAsset: (skill: Skill) => void
  removeAsset: (skillId: string) => void
  equipToHead: (skill: Skill, headSlot: number) => void
  unequipHeadSlot: (headSlot: number) => void
  getInventorySlots: () => (Skill | null)[]
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [robotHeadSlots, setRobotHeadSlots] = useState<(Skill | null)[]>([
    null,
    null,
    null,
  ])
  const [assets, setAssets] = useState<Skill[]>([
    { id: '1', name: 'Momentum Detector', rarity: 'rare' },
    { id: '2', name: 'Volume Spike', rarity: 'legendary' },
  ])

  const addAsset = useCallback((skill: Skill) => {
    setAssets((prev) => [...prev, skill])
  }, [])

  const removeAsset = useCallback((skillId: string) => {
    setAssets((prev) => {
      const idx = prev.findIndex((s) => s.id === skillId)
      if (idx < 0) return prev
      return prev.filter((_, i) => i !== idx)
    })
  }, [])

  const equipToHead = useCallback((skill: Skill, headSlot: number) => {
    setRobotHeadSlots((prev) => {
      const next = [...prev]
      next[headSlot] = { ...skill }
      return next
    })
  }, [])

  const unequipHeadSlot = useCallback((headSlot: number) => {
    setRobotHeadSlots((prev) => {
      const next = [...prev]
      next[headSlot] = null
      return next
    })
  }, [])

  const getInventorySlots = useCallback(() => {
    const pool = [...assets]
    for (const head of robotHeadSlots) {
      if (head) {
        const idx = pool.findIndex((p) => p.id === head.id)
        if (idx >= 0) pool.splice(idx, 1)
      }
    }
    const slots: (Skill | null)[] = []
    for (let i = 0; i < 4; i++) {
      slots.push(pool[i] ?? null)
    }
    return slots
  }, [assets, robotHeadSlots])

  return (
    <AppContext.Provider
      value={{
        robotHeadSlots,
        assets,
        addAsset,
        removeAsset,
        equipToHead,
        unequipHeadSlot,
        getInventorySlots,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
