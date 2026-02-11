import { useLocation, useNavigate } from 'react-router-dom'

const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
)

const ShopIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
)

const RobotIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5zM16 17H8v-2h8v2zm-.5-4c-.83 0-1.5-.67-1.5-1.5S14.67 10 15.5 10s1.5.67 1.5 1.5S16.33 13 15.5 13z" />
  </svg>
)

const ProfileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
)

const tabs = [
  { path: '/', icon: HomeIcon, label: 'Home' },
  { path: '/shop', icon: ShopIcon, label: 'Shop' },
  { path: '/agent', icon: RobotIcon, label: 'Agent' },
  { path: '/profile', icon: ProfileIcon, label: 'Profile' },
]

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="layout">
      <main className="layout-content">{children}</main>
      <nav className="tab-bar">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive =
            location.pathname === path ||
            (path === '/shop' && location.pathname.startsWith('/shop'))
          return (
            <button
              key={path}
              className={`tab-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(path)}
              aria-label={label}
            >
              <Icon />
            </button>
          )
        })}
      </nav>
      <style>{`
        .layout {
          display: flex;
          flex-direction: column;
        height: 560px;
        max-height: 560px;
          overflow: hidden;
        }
        .layout-content {
          flex: 1;
          min-height: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .tab-bar {
          flex-shrink: 0;
          display: flex;
          justify-content: space-around;
          align-items: center;
          background: #e8e8e8;
          padding: 10px 0;
          border-top: 1px solid #ddd;
        }
        .tab-item {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          padding: 8px 16px;
          border-radius: 8px;
        }
        .tab-item:hover {
          color: #333;
        }
        .tab-item.active {
          color: #000;
        }
      `}</style>
    </div>
  )
}
