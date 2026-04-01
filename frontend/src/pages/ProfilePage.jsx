import { useState } from 'react'
import { UserIcon, MailIcon, LockIcon, CalendarIcon, CheckCircleIcon, AlertCircleIcon, EyeIcon, EyeOffIcon } from '../components/Icons'
import Navbar from '../components/Navbar'
import { updateProfile } from '../api'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const { user, token, updateUser } = useAuth()
  const [username, setUsername] = useState(user?.username || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleSave = async () => {
    setMessage(null)

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    if (newPassword && newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }

    setLoading(true)
    try {
      const payload = { token }
      if (username !== user.username) payload.username = username
      if (newPassword) { payload.current_password = currentPassword; payload.new_password = newPassword }

      if (Object.keys(payload).length === 1) {
        setMessage({ type: 'info', text: 'No changes to save.' })
        setLoading(false)
        return
      }

      const res = await updateProfile(payload)
      updateUser({ ...user, username: res.data.username })
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update profile.' })
    }
    setLoading(false)
  }

  const formatDate = (iso) => {
    if (!iso) return 'Unknown'
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-vanilla_cream-900 dark:bg-dark_teal-200">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <h1 className="font-display text-2xl font-semibold text-dark_teal-500 dark:text-tea_green-500 mb-1">Profile</h1>
          <p className="text-sm font-body text-dark_teal-500/60 dark:text-tea_green-500/50">Manage your account information</p>
        </div>

        {/* Account info */}
        <div className="card p-5 mb-4 animate-slide-up" style={{ animationDelay: '60ms' }}>
          <h2 className="text-xs font-body font-semibold text-dark_teal-500/60 dark:text-tea_green-500/50 uppercase tracking-wider mb-4">Account Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sea_green-500/10 flex items-center justify-center">
                <MailIcon size={13} className="text-sea_green-500" />
              </div>
              <div>
                <p className="text-xs font-body text-dark_teal-500/50 dark:text-tea_green-500/40">Email</p>
                <p className="text-sm font-body text-dark_teal-500 dark:text-tea_green-500">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sea_green-500/10 flex items-center justify-center">
                <CalendarIcon size={13} className="text-sea_green-500" />
              </div>
              <div>
                <p className="text-xs font-body text-dark_teal-500/50 dark:text-tea_green-500/40">Member since</p>
                <p className="text-sm font-body text-dark_teal-500 dark:text-tea_green-500">{formatDate(user?.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="card p-5 animate-slide-up" style={{ animationDelay: '120ms' }}>
          <h2 className="text-xs font-body font-semibold text-dark_teal-500/60 dark:text-tea_green-500/50 uppercase tracking-wider mb-5">Edit Profile</h2>

          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-body font-medium text-dark_teal-500 dark:text-tea_green-500 mb-1.5">
                <span className="flex items-center gap-1.5"><UserIcon size={12} /> Username</span>
              </label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input-field"
                placeholder="Your display name"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-tea_green-700 dark:border-dark_teal-400 pt-4">
              <p className="text-xs font-body text-dark_teal-500/50 dark:text-tea_green-500/40 mb-3 flex items-center gap-1.5">
                <LockIcon size={11} /> Change password (leave blank to keep current)
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-body font-medium text-dark_teal-500 dark:text-tea_green-500 mb-1.5">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="input-field pr-10"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowCurrent(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-tea_green-400 hover:text-dark_teal-500 dark:hover:text-tea_green-500 transition-colors">
                      {showCurrent ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-body font-medium text-dark_teal-500 dark:text-tea_green-500 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="input-field pr-10"
                      placeholder="Min. 6 characters"
                    />
                    <button type="button" onClick={() => setShowNew(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-tea_green-400 hover:text-dark_teal-500 dark:hover:text-tea_green-500 transition-colors">
                      {showNew ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-body font-medium text-dark_teal-500 dark:text-tea_green-500 mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="input-field"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>
            </div>

            {message && (
              <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm font-body animate-fade-in ${
                message.type === 'success' ? 'bg-sea_green-500/10 text-sea_green-500 border border-sea_green-500/20'
                : message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-800'
                : 'bg-vanilla_cream-800 dark:bg-dark_teal-400 text-dark_teal-500 dark:text-tea_green-500 border border-tea_green-700 dark:border-dark_teal-500'
              }`}>
                {message.type === 'success' ? <CheckCircleIcon size={14} className="mt-0.5 flex-shrink-0" /> : <AlertCircleIcon size={14} className="mt-0.5 flex-shrink-0" />}
                {message.text}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}