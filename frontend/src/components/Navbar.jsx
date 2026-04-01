import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { logoutApi } from '../api'
import { SunIcon, MoonIcon, UserIcon, LogOutIcon, MessageSquareIcon, HomeIcon, BookOpenIcon } from './Icons'

export default function Navbar() {
  const { dark, toggle } = useTheme()
  const { user, token, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await logoutApi(token) } catch {}
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-dark_teal-300/90 backdrop-blur-md border-b border-tea_green-700 dark:border-dark_teal-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-sea_green-500 flex items-center justify-center">
              <BookOpenIcon size={14} className="text-white" />
            </div>
            <span className="font-display font-semibold text-lg text-dark_teal-500 dark:text-tea_green-500">
              ContextPDF
            </span>
          </Link>

          {/* Nav links — only shown when logged in */}
          {user && (
            <div className="flex items-center gap-1">
              <Link
                to="/"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-sea_green-500/10 text-sea_green-500 dark:text-sea_green-600'
                    : 'text-dark_teal-500 dark:text-tea_green-500 hover:bg-tea_green-800 dark:hover:bg-dark_teal-400'
                }`}
              >
                <HomeIcon size={14} />
                Home
              </Link>
              <Link
                to="/chat"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-colors ${
                  isActive('/chat')
                    ? 'bg-sea_green-500/10 text-sea_green-500 dark:text-sea_green-600'
                    : 'text-dark_teal-500 dark:text-tea_green-500 hover:bg-tea_green-800 dark:hover:bg-dark_teal-400'
                }`}
              >
                <MessageSquareIcon size={14} />
                Chat
              </Link>
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-dark_teal-500 dark:text-tea_green-500 hover:bg-tea_green-800 dark:hover:bg-dark_teal-400 transition-colors"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            </button>

            {user && (
              <>
                <Link
                  to="/profile"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-colors ${
                    isActive('/profile')
                      ? 'bg-sea_green-500/10 text-sea_green-500'
                      : 'text-dark_teal-500 dark:text-tea_green-500 hover:bg-tea_green-800 dark:hover:bg-dark_teal-400'
                  }`}
                >
                  <UserIcon size={14} />
                  {user.username}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-dark_teal-500 dark:text-tea_green-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOutIcon size={15} />
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}