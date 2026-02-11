import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import SettingsDropdown from '../components/SettingsDropdown'
import styles from './Profile.module.css'

const TIME_RANGES = ['1H', '1D', '1W', '1M', '1Y', 'All']

const BASE_POINTS: Record<string, number[]> = {
  '1H': [100, 102, 98, 105, 103, 108, 106],
  '1D': [100, 95, 102, 98, 110, 105, 120, 115, 130, 125],
  '1W': [100, 110, 95, 120, 105, 130, 140],
  '1M': [100, 90, 110, 95, 120, 105, 130, 115, 140],
  '1Y': [100, 120, 90, 130, 100, 150, 120, 170, 140],
  All: [80, 100, 90, 120, 95, 140, 110, 160, 130, 180, 150],
}

// Deterministic "random" for consistent chart
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function generateComplexData(base: number[], count: number): number[] {
  const result: number[] = []
  const step = (base.length - 1) / (count - 1)
  for (let i = 0; i < count; i++) {
    const idx = i * step
    const lo = Math.floor(idx)
    const hi = Math.min(lo + 1, base.length - 1)
    const t = idx - lo
    let v = base[lo] * (1 - t) + base[hi] * t
    v += (seededRandom(i * 7 + 13) - 0.5) * 12
    v += Math.sin(i * 0.5) * 5
    result.push(Math.max(60, Math.min(190, v)))
  }
  return result
}

const CHART_DATA: Record<string, number[]> = {
  '1H': generateComplexData(BASE_POINTS['1H'], 24),
  '1D': generateComplexData(BASE_POINTS['1D'], 48),
  '1W': generateComplexData(BASE_POINTS['1W'], 56),
  '1M': generateComplexData(BASE_POINTS['1M'], 60),
  '1Y': generateComplexData(BASE_POINTS['1Y'], 52),
  All: generateComplexData(BASE_POINTS.All, 80),
}

type AssetTab = 'agent' | 'robin'

export default function Profile() {
  const [activeRange, setActiveRange] = useState('All')
  const [assetTab, setAssetTab] = useState<AssetTab>('agent')
  const { assets } = useApp()

  const points = CHART_DATA[activeRange] || CHART_DATA.All
  const minVal = Math.min(...points)
  const maxVal = Math.max(...points)
  const range = maxVal - minVal || 1
  const width = 320
  const height = 100
  const padding = 8

  const chartPath = points
    .map((v, i) => {
      const x = padding + (i / (points.length - 1 || 1)) * (width - padding * 2)
      const y = height - padding - ((v - minVal) / range) * (height - padding * 2)
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  const areaPath =
    chartPath +
    ` L ${padding + (width - padding * 2)} ${height - padding} L ${padding} ${height - padding} Z`

  const totalValue = 258.35
  const agentAssetList =
    assets.length > 0
      ? Object.entries(
          assets.reduce<Record<string, { name: string; count: number }>>((acc, a) => {
            if (acc[a.id]) acc[a.id].count++
            else acc[a.id] = { name: a.name, count: 1 }
            return acc
          }, {})
        ).map(([id, { name, count }], i) => ({
          name,
          amount: String(count),
          value: `US$${(0.5 + i * 0.2).toFixed(2)}`,
        }))
      : [
          { name: 'Momentum Detector', amount: '2', value: 'US$1.00' },
          { name: 'Volume Spike', amount: '1', value: 'US$1.20' },
        ]

  const robinAssets: { name: string; amount: string; value: string }[] = []

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Your Balance</h1>
          <p className={styles.subtitle}>Total balance, chart, and your skill tokens</p>
        </div>
        <SettingsDropdown />
      </header>

      <div className={styles.balanceCard}>
        <div className={styles.balanceValue}>${totalValue.toFixed(2)}</div>
        <div className={styles.chart}>
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2196f3" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#2196f3" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path
              d={areaPath}
              fill="url(#chartGradient)"
            />
            <path
              d={chartPath}
              fill="none"
              stroke="#2196f3"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className={styles.timeRanges}>
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              className={`${styles.rangeBtn} ${activeRange === r ? styles.active : ''}`}
              onClick={() => setActiveRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <h2 className={styles.assetsTitle}>your assets</h2>
      <p className={styles.assetsHint}>Agent Skill: skills you bought. Robin Pump: tokens from trading</p>

      <div className={styles.assetTabs}>
        <button
          className={`${styles.assetTab} ${assetTab === 'agent' ? styles.active : ''}`}
          onClick={() => setAssetTab('agent')}
        >
          Agent Skill Token
        </button>
        <button
          className={`${styles.assetTab} ${assetTab === 'robin' ? styles.active : ''}`}
          onClick={() => setAssetTab('robin')}
        >
          Robin Pump Token
        </button>
      </div>

      <div className={styles.assetList}>
        {assetTab === 'agent'
          ? agentAssetList.map((asset) => (
              <div key={asset.name} className={styles.assetItem}>
                <div className={styles.assetIcon}>📦</div>
                <div className={styles.assetInfo}>
                  <span className={styles.assetName}>{asset.name}</span>
                  <span className={styles.assetAmount}>{asset.amount} tokens</span>
                </div>
                <div className={styles.assetValue}>{asset.value}</div>
              </div>
            ))
          : robinAssets.length > 0
            ? robinAssets.map((asset) => (
                <div key={asset.name} className={styles.assetItem}>
                  <div className={styles.assetIcon}>🪙</div>
                  <div className={styles.assetInfo}>
                    <span className={styles.assetName}>{asset.name}</span>
                    <span className={styles.assetAmount}>{asset.amount} tokens</span>
                  </div>
                  <div className={styles.assetValue}>{asset.value}</div>
                </div>
              ))
            : (
                <p className={styles.emptyState}>Coming soon — Robin pump tokens</p>
              )}
      </div>
    </div>
  )
}
