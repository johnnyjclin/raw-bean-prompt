import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useApp } from '../contexts/AppContext'
import SettingsDropdown from '../components/SettingsDropdown'
import { getTokenInfo, getTokenBalance } from '../lib/contract-helpers'
import styles from './SkillDetail.module.css'

interface SkillData {
  name: string
  rarity: string
  price: number
  prompt: string
  description: string
  totalSupply: string
  balance: string
}

export default function SkillDetail({ skillId: skillIdProp }: { skillId?: string } = {}) {
  const { skillId: skillIdParam } = useParams()
  const skillId = skillIdProp ?? skillIdParam
  const navigate = useNavigate()
  const { assets, addAsset } = useApp()
  
  const [skillData, setSkillData] = useState<SkillData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Hardcoded address for demonstration (same as in Shop.tsx)
  const HARDCODED_DEVICE_ADDRESS = "0x1cF1fb97E6A4AfaA4167FA19d52AD19D6689C677"

  useEffect(() => {
    let isMounted = true

    async function loadSkill() {
      if (!skillId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // Fetch token info
        const info = await getTokenInfo(skillId)
        
        // Determine rarity
        let rarity = 'common'
        const supply = BigInt(info.totalSupply)
        if (supply < 1000000n) rarity = 'legendary'
        else if (supply < 10000000n) rarity = 'rare'

        // Fetch balance
        let balance = '0'
        try {
          // Use hardcoded address or wallet
          const userAddress = HARDCODED_DEVICE_ADDRESS
          /*
          if (typeof window !== 'undefined' && window.ethereum) {
             const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[]
             if (accounts && accounts.length > 0) userAddress = accounts[0]
          }
          */
          if (userAddress) {
             const bal = await getTokenBalance(skillId, userAddress)
             balance = bal.toString()
          }
        } catch (e) {
          console.warn('Failed to load balance', e)
        }

        if (isMounted) {
          setSkillData({
            name: info.name,
            rarity,
            price: 0.5, // Mock price
            prompt: info.prompt,
            description: info.description,
            totalSupply: info.totalSupply,
            balance
          })
          setLoading(false)
        }
      } catch (err: any) {
        console.error('Failed to load skill details:', err)
        if (isMounted) {
          setError(err.message || 'Failed to load skill')
          setLoading(false)
        }
      }
    }

    loadSkill()
    return () => { isMounted = false }
  }, [skillId])


  const owned = skillData ? BigInt(skillData.balance) > 0n : false

  const handleBuy = () => {
    if (skillId && skillData) {
      // In a real app, this would trigger a blockchain transaction
      // For now, we simulate adding to "local" assets context if that's still being used
      // But really we rely on the balance check above.
      addAsset({ id: skillId, name: skillData.name, rarity: skillData.rarity })
      navigate('/profile')
    }
  }

  const handleEquip = () => {
    navigate('/')
  }

  if (loading) {
     return (
       <div className={styles.page}>
         <div className={styles.loading}>Loading skill details...</div>
       </div>
     )
  }

  if (error || !skillData) {
    return (
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={() => navigate('/shop')}>
          ← Back
        </button>
        <div className={styles.error}>
          {error || 'Skill not found'}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/shop')}>
            ← Back
          </button>
          <h1 className={styles.title}>{skillData.name}</h1>
        </div>
        <SettingsDropdown />
      </header>

      <div className={styles.card}>
        <span className={styles.rarity}>{skillData.rarity}</span>
        <div className={styles.price}>US${skillData.price.toFixed(2)}</div>
      </div>

      <div className={styles.promptSection}>
        <h3>Agent Prompt</h3>
        <p className={styles.promptHint}>{skillData.description}</p>
        <pre className={styles.prompt}>{skillData.prompt}</pre>
      </div>

      <div className={styles.actions}>
        {!owned ? (
          <button className={styles.btnBuy} onClick={handleBuy}>
            Buy & Equip
          </button>
        ) : (
          <button className={styles.btnEquip} onClick={handleEquip}>
            Equip (owned)
          </button>
        )}
      </div>
    </div>
  )
}
