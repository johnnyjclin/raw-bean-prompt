import { useState } from 'react'
import { HashRouter, useLocation, matchPath } from 'react-router-dom'
import Layout from './components/Layout'
import SplashScreen from './components/SplashScreen'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Agent from './pages/Agent'
import Profile from './pages/Profile'
import SkillDetail from './pages/SkillDetail'
import { AppProvider } from './contexts/AppContext'

function AppContent() {
  const location = useLocation()
  const path = location.pathname
  const shopDetailMatch = matchPath({ path: '/shop/:skillId', end: true }, path)
  const isShopDetail = !!shopDetailMatch
  const skillId = shopDetailMatch?.params?.skillId

  return (
    <Layout>
      <div className="tab-panels">
        <div
          className={`tab-panel ${path === '/' ? 'active' : 'hidden'}`}
          data-tab="home"
        >
          <Home />
        </div>
        <div
          className={`tab-panel ${path === '/shop' ? 'active' : 'hidden'}`}
          data-tab="shop"
        >
          <Shop />
        </div>
        <div
          className={`tab-panel ${isShopDetail ? 'active' : 'hidden'}`}
          data-tab="skillDetail"
        >
          <SkillDetail skillId={skillId} />
        </div>
        <div
          className={`tab-panel ${path === '/agent' ? 'active' : 'hidden'}`}
          data-tab="agent"
        >
          <Agent />
        </div>
        <div
          className={`tab-panel ${path === '/profile' ? 'active' : 'hidden'}`}
          data-tab="profile"
        >
          <Profile />
        </div>
      </div>
      <style>{`
        .tab-panels {
          position: relative;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        .tab-panel {
          position: absolute;
          inset: 0;
          overflow-y: auto;
          padding-bottom: 8px;
        }
        .tab-panel.hidden {
          visibility: hidden;
          pointer-events: none;
          z-index: -1;
        }
        .tab-panel.active {
          visibility: visible;
          z-index: 0;
        }
      `}</style>
    </Layout>
  )
}

function App() {
  const [ready, setReady] = useState(false)

  if (!ready) {
    return <SplashScreen onReady={() => setReady(true)} />
  }

  return (
    <AppProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AppProvider>
  )
}

export default App
