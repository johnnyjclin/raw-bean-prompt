import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import SettingsDropdown from '../components/SettingsDropdown'
import styles from './Agent.module.css'

const EXECUTING_LOTTIE = 'https://lottie.host/90e892a0-b21c-43fc-bd7f-7f5d8c90b007/VvejiIExdJ.lottie'

const MOCK_MESSAGES = [
  'Trading bot is monitoring Robin pump.fun...',
  'Analyzing token: XYZ — Momentum detected',
]

export default function Agent() {
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)
  const [currentMsg] = useState(MOCK_MESSAGES[0])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>EasyA Robin Bot</div>
        <SettingsDropdown />
      </header>

      <p className={styles.pageHint}>Bot is monitoring Robin pump.fun. Trade confirmations will pop up when opportunities are detected</p>
      <div className={styles.botArea}>
        <div className={styles.lottieWrapper}>
          <DotLottieReact
            src={EXECUTING_LOTTIE}
            loop
            autoplay
            width={200}
            height={200}
            className={styles.lottieCanvas}
            renderConfig={{ autoResize: true }}
          />
        </div>
      </div>

      <div className={styles.zeroUI}>
        {showConfirm ? (
          <div className={styles.confirmOverlay}>
            <p>Buy 1000 XYZ?</p>
            <p className={styles.confirmHint}>Confirm the trade or reject</p>
            <div className={styles.confirmActions}>
              <button
                className={styles.btnConfirm}
                onClick={() => {
                  setShowConfirm(false)
                  navigate('/profile')
                }}
              >
                Confirm
              </button>
              <button
                className={styles.btnReject}
                onClick={() => setShowConfirm(false)}
              >
                Reject
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className={styles.glowText}>{currentMsg}</p>
            <p className={styles.simulateHint}>Click below to simulate a trade confirmation</p>
            <button
              className={styles.simulateBtn}
              onClick={() => setShowConfirm(true)}
            >
              Simulate trade confirm
            </button>
          </>
        )}
      </div>
    </div>
  )
}
