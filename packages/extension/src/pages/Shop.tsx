import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import SettingsDropdown from '../components/SettingsDropdown'
import styles from './Shop.module.css'

const MOCK_SKILLS = [
  { id: '1', name: 'Momentum Detector', rarity: 'rare', price: 0.5, change: -2.99 },
  { id: '2', name: 'Volume Spike', rarity: 'legendary', price: 1.2, change: 5.42 },
  { id: '3', name: 'Trend Follower', rarity: 'common', price: 0.1, change: -1.15 },
  { id: '4', name: 'Smart Entry', rarity: 'rare', price: 0.8, change: 3.21 },
  { id: '5', name: 'Stop Loss Master', rarity: 'legendary', price: 1.5, change: -0.85 },
  { id: '6', name: 'Whale Tracker', rarity: 'rare', price: 0.6, change: 7.12 },
  { id: '7', name: 'FOMO Guard', rarity: 'common', price: 0.15, change: -2.1 },
  { id: '8', name: 'Pattern Scanner', rarity: 'legendary', price: 1.8, change: 4.55 },
]

export default function Shop() {
  const navigate = useNavigate()
  const { assets, removeAsset } = useApp()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Clear selection when selected skill is no longer owned (after sell)
  useEffect(() => {
    if (selectedId && !assets.some((a) => a.id === selectedId)) {
      setSelectedId(null)
    }
  }, [assets, selectedId])

  const handleBuy = () => {
    if (selectedId && !assets.some((a) => a.id === selectedId)) {
      navigate(`/shop/${selectedId}`)
    }
  }

  const handleSell = () => {
    if (selectedId && assets.some((a) => a.id === selectedId)) {
      removeAsset(selectedId)
      setSelectedId(null)
    }
  }

  const isSelectedOwned = selectedId ? assets.some((a) => a.id === selectedId) : false
  const canBuy = selectedId && !isSelectedOwned
  const canSell = selectedId && isSelectedOwned

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Agent Skill Market Place</h1>
          <p className={styles.subtitle}>Select a skill → Buy to purchase / Sell (owned only)</p>
        </div>
        <SettingsDropdown />
      </header>

      <div className={styles.skillList}>
        {MOCK_SKILLS.map((skill) => {
          const owned = assets.some((a) => a.id === skill.id)
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
            >
              <div className={styles.skillIcon}>
                <span className={styles.rarityBadge}>{skill.rarity}</span>
              </div>
              <div className={styles.skillInfo}>
                <span className={styles.skillName}>{skill.name}</span>
                <span className={styles.skillChange} data-negative={skill.change < 0}>
                  {skill.change > 0 ? '+' : ''}{skill.change}%
                </span>
              </div>
              <div className={styles.skillPrice}>
                <span className={styles.usd}>US${skill.price.toFixed(2)}</span>
                {owned && <span className={styles.ownedBadge}>Owned</span>}
              </div>
            </button>
          )
        })}
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
