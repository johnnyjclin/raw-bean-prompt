import { useEffect } from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import styles from './SplashScreen.module.css'

const DISPLAY_MS = 3000

const EXECUTING_LOTTIE = 'https://lottie.host/90e892a0-b21c-43fc-bd7f-7f5d8c90b007/VvejiIExdJ.lottie'

const BOT_LOTTIES_TO_PRELOAD = [
  'https://lottie.host/6d8da68c-9bae-41c8-a3e5-e03d3f014182/M0iCPHQxoa.lottie',
  'https://lottie.host/8b2d85e6-0f57-4b48-ae58-4d43bb1e396c/wEntREqzNY.lottie',
  'https://lottie.host/195d5bc3-1bf2-42a4-a98f-8116a937a97a/pa7luwwhBC.lottie',
  EXECUTING_LOTTIE,
]

const splashImg =
  typeof chrome !== 'undefined' && chrome.runtime
    ? chrome.runtime.getURL('assets/bot animation finished.png')
    : '/assets/bot animation finished.png'

interface SplashScreenProps {
  onReady?: () => void
}

export default function SplashScreen({ onReady }: SplashScreenProps) {
  useEffect(() => {
    BOT_LOTTIES_TO_PRELOAD.forEach((url) => {
      fetch(url, { mode: 'cors' }).catch(() => {})
    })
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      onReady?.()
    }, DISPLAY_MS)
    return () => clearTimeout(t)
  }, [onReady])

  return (
    <div className={styles.splash}>
      <div className={styles.logo}>EasyA Robin Bot</div>
      <p className={styles.tagline}>Buy Agent skills, equip them to your trading bot, and let it trade on Robin</p>
      <div className={styles.splashImgWrap}>
        <img
          src={splashImg}
          alt="EasyA Robin Bot"
          className={styles.splashImg}
        />
      </div>
      <div className={styles.preloadExecuting} aria-hidden="true">
        <DotLottieReact
          src={EXECUTING_LOTTIE}
          loop
          autoplay
          width={1}
          height={1}
          renderConfig={{ autoResize: false }}
        />
      </div>
    </div>
  )
}
