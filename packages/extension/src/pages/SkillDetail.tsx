import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import SettingsDropdown from '../components/SettingsDropdown'
import styles from './SkillDetail.module.css'

const MOCK_SKILLS: Record<string, { name: string; rarity: string; price: number; prompt: string }> = {
  '1': {
    name: 'Momentum Detector',
    rarity: 'rare',
    price: 0.5,
    prompt: `When the trading bot detects a momentum spike (volume + price movement) 
on Robin pump.fun, it will:
1. Analyze the token's recent 5m/15m chart
2. Check if volume exceeds 2x average
3. If conditions met: buy with 5% of available balance
4. Set trailing stop at -3%`,
  },
  '2': {
    name: 'Volume Spike',
    rarity: 'legendary',
    price: 1.2,
    prompt: `Detects unusual volume spikes on Robin tokens.`,
  },
  '3': {
    name: 'Trend Follower',
    rarity: 'common',
    price: 0.1,
    prompt: `Follows established trends with moving averages.`,
  },
  '4': {
    name: 'Smart Entry',
    rarity: 'rare',
    price: 0.8,
    prompt: `Identifies optimal entry points using RSI and support levels.`,
  },
  '5': {
    name: 'Stop Loss Master',
    rarity: 'legendary',
    price: 1.5,
    prompt: `Dynamic stop-loss adjustment based on volatility and trend.`,
  },
  '6': {
    name: 'Whale Tracker',
    rarity: 'rare',
    price: 0.6,
    prompt: `Monitors large wallet movements for early signal detection.`,
  },
  '7': {
    name: 'FOMO Guard',
    rarity: 'common',
    price: 0.15,
    prompt: `Prevents impulsive buys during pump phases.`,
  },
  '8': {
    name: 'Pattern Scanner',
    rarity: 'legendary',
    price: 1.8,
    prompt: `Recognizes chart patterns for breakout trades.`,
  },
}

interface SkillDetailProps {
  skillId?: string
}

export default function SkillDetail({ skillId: skillIdProp }: SkillDetailProps = {}) {
  const { skillId: skillIdParam } = useParams()
  const skillId = skillIdProp ?? skillIdParam
  const navigate = useNavigate()
  const { assets, addAsset } = useApp()
  const skillData = skillId ? MOCK_SKILLS[skillId] : null
  const owned = skillId ? assets.some((a) => a.id === skillId) : false

  const handleBuy = () => {
    if (skillId && skillData) {
      addAsset({ id: skillId, name: skillData.name, rarity: skillData.rarity })
      navigate('/profile')
    }
  }

  const handleEquip = () => {
    navigate('/')
  }

  if (!skillData) {
    return (
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={() => navigate('/shop')}>
          ← Back
        </button>
        <p>Skill not found</p>
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
        <p className={styles.promptHint}>This skill makes the bot act by the following logic</p>
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
