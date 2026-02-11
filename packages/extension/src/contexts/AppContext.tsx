import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getAllTokenAddresses, getTokenInfo, getTokenBalance, delay } from '../lib/contract-helpers'

export interface Skill {
  id: string
  name: string
  rarity: string
  slot?: number
}

interface AppState {
  robotHeadSlots: (Skill | null)[]
  assets: Skill[]
  isLoading: boolean
  addAsset: (skill: Skill) => void
  removeAsset: (skillId: string) => void
  equipToHead: (skill: Skill, headSlot: number) => void
  unequipHeadSlot: (headSlot: number) => void
  getInventorySlots: () => (Skill | null)[]
}

const AppContext = createContext<AppState | null>(null)

// TODO: Replace with your actual wallet address or logic to get connected wallet
const HARDCODED_DEVICE_ADDRESS = "0x1cF1fb97E6A4AfaA4167FA19d52AD19D6689C677"

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [robotHeadSlots, setRobotHeadSlots] = useState<(Skill | null)[]>([
    null,
    null,
    null,
  ])
  const [assets, setAssets] = useState<Skill[]>([])

  useEffect(() => {
    let isMounted = true

    const loadAssets = async () => {
      setIsLoading(true)
      try {
        const addresses = await getAllTokenAddresses()
        if (!isMounted) return

        const ownedAssets: Skill[] = []
        
        for (const address of addresses) {
          if (!isMounted) break
          
          try {
            const balance = await getTokenBalance(address, HARDCODED_DEVICE_ADDRESS)
            
            if (balance > 0n) {
              const info = await getTokenInfo(address)
              
              let rarity = 'common'
              const supply = BigInt(info.totalSupply)
              if (supply < 1000000n) {
                rarity = 'legendary'
              } else if (supply < 10000000n) {
                rarity = 'rare'
              }
              
              ownedAssets.push({
                id: address,
                name: info.name,
                rarity
              })
            }
            // Small delay to prevent rate limiting
            await delay(50)
          } catch (err) {
            console.error(`Failed to load asset ${address}:`, err)
          }
        }

        if (isMounted) {
          setAssets(ownedAssets)
        }
      } catch (err) {
        console.error('Failed to load assets:', err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadAssets()

    return () => {
      isMounted = false
    }
  }, [])

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
        isLoading,
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
