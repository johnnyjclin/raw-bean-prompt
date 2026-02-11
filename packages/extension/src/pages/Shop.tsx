import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import SettingsDropdown from '../components/SettingsDropdown'
import { getAllTokenAddresses, getTokenInfo, getTokenBalance, delay } from '../lib/contract-helpers'
import styles from './Shop.module.css'

interface TokenSkill {
  id: string
  name: string
  symbol: string
  prompt: string
  description: string
  creator: string
  totalSupply: string
  balance: string
  rarity: 'common' | 'rare' | 'legendary'
  price: number
  change: number
}

export default function Shop() {
  const navigate = useNavigate()
  const { assets, removeAsset } = useApp()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  // Hardcoded address for demonstration/development
  // TODO: Replace with your actual wallet address
  const HARDCODED_DEVICE_ADDRESS = "0x1cF1fb97E6A4AfaA4167FA19d52AD19D6689C677"
  
  const [skills, setSkills] = useState<TokenSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadSkills() {
      try {
        setLoading(true)
        setError(null)

        const addresses = await getAllTokenAddresses()
        
        if (!isMounted) return

        const skillsData: TokenSkill[] = []
        for (const address of addresses) {
          try {
            const info = await getTokenInfo(address)
            
            let rarity: 'common' | 'rare' | 'legendary' = 'common'
            const supply = BigInt(info.totalSupply)
            if (supply < 1000000n) {
              rarity = 'legendary'
            } else if (supply < 10000000n) {
              rarity = 'rare'
            }

            const price = Math.random() * 2
            const change = (Math.random() - 0.5) * 20

            skillsData.push({
              id: address,
              name: info.name,
              symbol: info.symbol,
              prompt: info.prompt,
              description: info.description,
              creator: info.creator,
              totalSupply: info.totalSupply,
              balance: '0',
              rarity,
              price,
              change,
            })

            await delay(100)
          } catch (err) {
            console.error(`Failed to load token ${address}:`, err)
          }
        }

        if (isMounted) {
          setSkills(skillsData)
          setLoading(false)
        }
      } catch (err: any) {
        console.error('Failed to load skills:', err)
        if (isMounted) {
          setError(err.message || 'Failed to load skills')
          setLoading(false)
        }
      }
    }

    loadSkills()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadBalances() {
      // Use hardcoded address to bypass wallet connection requirement
      const userAddress = HARDCODED_DEVICE_ADDRESS
      
      console.log("Loading balances for hardcoded address:", userAddress)

      const updatedSkills = [...skills]

      for (let i = 0; i < updatedSkills.length; i++) {
        if (!isMounted) return
        
        try {
          const balance = await getTokenBalance(updatedSkills[i].id, userAddress)
          updatedSkills[i].balance = balance.toString()
          // Incrementally update UI for better feedback
          if (isMounted) {
              setSkills([...updatedSkills]) 
          }
          await delay(20)
        } catch (err) {
          console.error(`Failed to load balance for ${updatedSkills[i].id}:`, err)
        }
      }
    }

    if (skills.length > 0) {
      loadBalances()
    }

    return () => {
      isMounted = false
    }
  }, [skills.length])

  // Clear selection when selected skill is no longer owned (after sell)
  useEffect(() => {
    if (selectedId && !assets.some((a) => a.id === selectedId)) {
      setSelectedId(null)
    }
  }, [assets, selectedId])

  const handleBuy = () => {
    if (selectedId) {
      const skill = skills.find(s => s.id === selectedId)
      const hasBalance = skill && BigInt(skill.balance) > 0n
      if (!hasBalance) {
        navigate(`/shop/${selectedId}`)
      }
    }
  }

  const handleSell = () => {
    if (selectedId) {
      const skill = skills.find(s => s.id === selectedId)
      const hasBalance = skill && BigInt(skill.balance) > 0n
      if (hasBalance) {
        removeAsset(selectedId)
        setSelectedId(null)
      }
    }
  }

  const selectedSkill = selectedId ? skills.find(s => s.id === selectedId) : null
  const isSelectedOwned = selectedSkill ? BigInt(selectedSkill.balance) > 0n : false
  const canBuy = selectedId && !isSelectedOwned
  const canSell = selectedId && isSelectedOwned

  if (loading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Agent Skill Market Place</h1>
            <p className={styles.subtitle}>Loading skills from blockchain...</p>
          </div>
          <SettingsDropdown />
        </header>
        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
          Loading skills...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Agent Skill Market Place</h1>
            <p className={styles.subtitle}>Failed to load skills</p>
          </div>
          <SettingsDropdown />
        </header>
        <div style={{ padding: '40px', textAlign: 'center', color: '#f44336' }}>
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Agent Skill Market Place</h1>
          <p className={styles.subtitle}>
            Select a skill → Buy to purchase / Sell (owned only) • {skills.length} skills available
          </p>
        </div>
        <SettingsDropdown />
      </header>

      <div className={styles.skillList}>
        {skills.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            No skills available yet. Create your first skill!
          </div>
        ) : (
          skills.map((skill) => {
            const owned = BigInt(skill.balance) > 0n
            const isSelected = selectedId === skill.id
            return (
              <button
                key={skill.id}
                type="button"
                className={`${styles.skillCard} ${isSelected ? styles.selected : ''}`}
                onClick={() => {
                  setSelectedId(skill.id)
                  if (!owned) {
                    navigate(`/shop/${skill.id}`)
                  }
                }}
                style={{ cursor: 'pointer' }}
                title={`${skill.description}\nSymbol: ${skill.symbol}\nSupply: ${skill.totalSupply}`}
              >
                <div className={styles.skillIcon}>
                  <span className={styles.rarityBadge}>{skill.rarity}</span>
                </div>
                <div className={styles.skillInfo}>
                  <span className={styles.skillName}>{skill.name}</span>
                  {/* <span className={styles.skillChange} data-negative={skill.change < 0}>
                    {skill.change > 0 ? '+' : ''}{skill.change.toFixed(2)}%
                  </span> */}
                </div>
                <div className={styles.skillPrice}>
                  <span className={styles.usd}>US${skill.price.toFixed(2)}</span>
                  {owned && <span className={styles.ownedBadge}>Owned</span>}
                </div>
              </button>
            )
          })
        )}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.btnPrimary}
          onClick={handleBuy}
          disabled={!canBuy}
        >
          Buy Skill
        </button>
        <button
          className={styles.btnSecondary}
          onClick={handleSell}
          disabled={!canSell}
        >
          Sell
        </button>
      </div>
    </div>
  )
}
