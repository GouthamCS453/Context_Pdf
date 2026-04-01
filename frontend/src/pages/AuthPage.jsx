import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpenIcon, EyeIcon, EyeOffIcon, SunIcon, MoonIcon } from '../components/Icons'
import { loginApi, signup, indexPdfs } from '../api'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ username: '', email: '', password: '' })

  const { login } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      if (isLogin) {
        const res = await loginApi({ email: form.email, password: form.password })
        login(res.data.token, res.data.user)
        // Auto-index all documents on login
        try { await indexPdfs(res.data.token) } catch {}
        navigate('/')
      } else {
        if (!form.username.trim()) { setError('Username is required'); setLoading(false); return }
        await signup({ username: form.username, email: form.email, password: form.password })
        setIsLogin(true)
        setForm({ username: '', email: form.email, password: '' })
        setError('')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit() }

  return (
    <div className="min-h-screen bg-vanilla_cream-900 dark:bg-dark_teal-200 flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sea_green-500 flex items-center justify-center">
            <BookOpenIcon size={14} className="text-white" />
          </div>
          <span className="font-display font-semibold text-lg text-dark_teal-500 dark:text-tea_green-500">ContextPDF</span>
        </div>
        <button onClick={toggle} className="w-8 h-8 rounded-lg flex items-center justify-center text-dark_teal-500 dark:text-tea_green-500 hover:bg-tea_green-800 dark:hover:bg-dark_teal-400 transition-colors">
          {dark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-slide-up">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-semibold text-dark_teal-500 dark:text-tea_green-500 mb-2">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="font-body text-sm text-dark_teal-600 dark:text-tea_green-400">
              {isLogin ? 'Sign in to your ContextPDF workspace' : 'Get started with your document assistant'}
            </p>
          </div>

          {/* Card */}
          <div className="card p-8">
            {/* Toggle */}
            <div className="flex bg-tea_green-900 dark:bg-dark_teal-400 rounded-lg p-1 mb-6">
              {['Login', 'Sign Up'].map((label, i) => (
                <button
                  key={label}
                  onClick={() => { setIsLogin(i === 0); setError('') }}
                  className={`flex-1 py-2 rounded-md text-sm font-body font-medium transition-all duration-200 ${
                    isLogin === (i === 0)
                      ? 'bg-white dark:bg-dark_teal-300 text-dark_teal-500 dark:text-tea_green-500 shadow-sm'
                      : 'text-dark_teal-500/60 dark:text-tea_green-500/50 hover:text-dark_teal-500 dark:hover:text-tea_green-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Fields */}
            <div className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-body font-medium text-dark_teal-500 dark:text-tea_green-500 mb-1.5">Username</label>
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Your display name"
                    className="input-field"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-body font-medium text-dark_teal-500 dark:text-tea_green-500 mb-1.5">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="you@example.com"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-body font-medium text-dark_teal-500 dark:text-tea_green-500 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="••••••••"
                    className="input-field pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-tea_green-400 hover:text-dark_teal-500 dark:hover:text-tea_green-500 transition-colors"
                  >
                    {showPassword ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-xs font-body bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary w-full mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </div>

            {/* Switch */}
            <p className="text-center text-xs font-body text-dark_teal-500/60 dark:text-tea_green-500/50 mt-5">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setIsLogin(!isLogin); setError('') }}
                className="text-sea_green-500 hover:text-sea_green-400 font-medium transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}