import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-vanilla_cream-900 dark:bg-dark_teal-200 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sea_green-500/30 border-t-sea_green-500 rounded-full animate-spin" />
          <p className="text-sm font-body text-dark_teal-500/50 dark:text-tea_green-500/40">Loading...</p>
        </div>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}