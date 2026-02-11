import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { useApp } from '../contexts/AppContext'
import SettingsDropdown from '../components/SettingsDropdown'
import styles from './Home.module.css'

const HOME_BOT_LOTTIES = [
  'https://lottie.host/6d8da68c-9bae-41c8-a3e5-e03d3f014182/M0iCPHQxoa.lottie',
  'https://lottie.host/8b2d85e6-0f57-4b48-ae58-4d43bb1e396c/wEntREqzNY.lottie',
  'https://lottie.host/195d5bc3-1bf2-42a4-a98f-8116a937a97a/pa7luwwhBC.lottie',
]

export default function Home() {
  const navigate = useNavigate()
  const {
    robotHeadSlots,
    equipToHead,
    unequipHeadSlot,
    getInventorySlots,
  } = useApp()
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)
  const [dragOverInventory, setDragOverInventory] = useState<number | null>(null)
  const [absorbed, setAbsorbed] = useState(false)
  const [draggingFromHead, setDraggingFromHead] = useState(false)
  const inventorySlots = getInventorySlots()
  const equippedCount = robotHeadSlots.filter(Boolean).length
  const lottieIndex = Math.min(equippedCount, HOME_BOT_LOTTIES.length - 1)
  const currentLottie = HOME_BOT_LOTTIES[lottieIndex]

  const handleInventoryDragStart = (e: React.DragEvent, slotIndex: number) => {
    const skill = inventorySlots[slotIndex]
    if (!skill) return
    e.dataTransfer.setData('application/json', JSON.stringify({ skill, from: 'inventory', slotIndex }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggingFromHead(false)
  }

  const handleHeadDragStart = (e: React.DragEvent, headSlot: number) => {
    const skill = robotHeadSlots[headSlot]
    if (!skill) return
    setDraggingFromHead(true)
    e.dataTransfer.setData('application/json', JSON.stringify({ skill, from: 'head', headSlot }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleHeadSlotDragOver = (e: React.DragEvent, headSlot: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverSlot(headSlot)
  }

  const handleHeadSlotDragLeave = () => {
    setDragOverSlot(null)
  }

  const handleHeadSlotDrop = (e: React.DragEvent, headSlot: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverSlot(null)
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json') || '{}')
      const { skill, from } = data
      if (skill && from === 'inventory') {
        equipToHead(skill, headSlot)
        setAbsorbed(true)
        setTimeout(() => setAbsorbed(false), 500)
      }
    } catch {
      // ignore
    }
  }

  const handleInventoryDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault()
    setDragOverInventory(null)
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json') || '{}')
      const { from, headSlot } = data
      if (from === 'head' && headSlot !== undefined) {
        unequipHeadSlot(headSlot)
      }
    } catch {
      // ignore
    }
  }

  const handleSlotClick = (slotIndex: number) => {
    const skill = inventorySlots[slotIndex]
    if (skill) {
      // Clicking filled slot could unequip from head if it's there - but it's in inventory so it's not on head. Nothing to do. Or we go to shop for empty.
    }
    if (!skill) {
      navigate('/shop')
    }
  }

  const handleHeadSlotClick = (headSlot: number) => {
    unequipHeadSlot(headSlot)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>EasyA Robin Bot</div>
        <SettingsDropdown />
      </header>

      <p className={styles.pageHint}>Drag skills to the bot's head to equip, then click Execute to start</p>
      <div
        className={`${styles.botDisplay} ${absorbed ? styles.absorbed : ''} ${dragOverSlot !== null ? styles.botDragOver : ''} ${draggingFromHead ? styles.botDragOff : ''}`}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.robotWrapper}>
          <p className={styles.headHint}>Three slots: drag skills here to equip, click to unequip</p>
          <div className={styles.headSlots}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`${styles.headSlot} ${dragOverSlot === i ? styles.dragOver : ''}`}
                draggable={!!robotHeadSlots[i]}
                onDragStart={(e) => handleHeadDragStart(e, i)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleHeadSlotDragOver(e, i)}
                onDragLeave={handleHeadSlotDragLeave}
                onDrop={(e) => handleHeadSlotDrop(e, i)}
                onClick={() => handleHeadSlotClick(i)}
              >
                {robotHeadSlots[i] ? (
                  <span className={styles.headSlotSkill} title={robotHeadSlots[i]!.name}>
                    {robotHeadSlots[i]!.name.slice(0, 4)}..
                  </span>
                ) : (
                  <span className={styles.headSlotEmpty}>+</span>
                )}
              </div>
            ))}
          </div>
          <div className={styles.lottieWrapper}>
            <DotLottieReact
              key={lottieIndex}
              src={currentLottie}
              loop
              autoplay
              width={200}
              height={200}
              className={styles.lottieCanvas}
              renderConfig={{ autoResize: true }}
            />
          </div>
          <button
            className={styles.executeBtn}
            onClick={() => navigate('/agent')}
          >
            Execute
          </button>
        </div>
      </div>

      <p className={styles.inventoryHint}>Your skills: drag to equip. Empty slots — tap to buy from Shop</p>
      <div className={styles.skillSlots}>
        {[0, 1, 2, 3].map((slot) => {
          const skill = inventorySlots[slot]
          return (
            <div
              key={slot}
              className={`${styles.slot} ${dragOverInventory === slot ? styles.dragOver : ''}`}
              draggable={!!skill}
              onDragStart={(e) => handleInventoryDragStart(e, slot)}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverInventory(slot)
              }}
              onDragLeave={() => setDragOverInventory(null)}
              onDrop={(e) => handleInventoryDrop(e, slot)}
              onClick={() => handleSlotClick(slot)}
            >
              {skill ? (
                <span className={styles.skillPlaceholder} title={skill.name}>
                  {skill.name.length > 10 ? skill.name.slice(0, 8) + '..' : skill.name}
                </span>
              ) : (
                <span className={styles.emptySlot}>+</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

