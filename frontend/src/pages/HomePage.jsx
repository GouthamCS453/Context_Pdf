import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileTextIcon, SparklesIcon, MessageSquareIcon, ChevronDownIcon, ChevronUpIcon, LightbulbIcon } from '../components/Icons'
import Navbar from '../components/Navbar'
import { listPdfs } from '../api'
import { useAuth } from '../context/AuthContext'

function InsightCard({ pdf, index }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="card p-5 animate-slide-up hover:shadow-md transition-all duration-300"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-sea_green-500/10 dark:bg-sea_green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <FileTextIcon size={16} className="text-sea_green-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-body font-semibold text-sm text-dark_teal-500 dark:text-tea_green-500 truncate">
            {pdf.filename}
          </h3>
          {pdf.indexed ? (
            <span className="inline-flex items-center gap-1 text-xs text-sea_green-500 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sea_green-500" />
              Indexed
            </span>
          ) : (
            <span className="text-xs text-vanilla_cream-300 dark:text-dark_teal-700 mt-0.5">Not indexed</span>
          )}
        </div>
      </div>

      {pdf.summary && (
        <p className="text-sm font-body text-dark_teal-500/80 dark:text-tea_green-500/80 leading-relaxed mb-3">
          {pdf.summary}
        </p>
      )}

      {pdf.key_insights?.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 text-xs font-body font-medium text-sea_green-500 hover:text-sea_green-400 transition-colors mb-2"
          >
            <LightbulbIcon size={12} />
            Key Insights
            {expanded ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />}
          </button>
          {expanded && (
            <ul className="space-y-1.5 animate-fade-in">
              {pdf.key_insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-xs font-body text-dark_teal-500/70 dark:text-tea_green-500/70">
                  <span className="w-1 h-1 rounded-full bg-celadon-500 mt-1.5 flex-shrink-0" />
                  {insight}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!pdf.summary && !pdf.indexed && (
        <p className="text-xs font-body text-dark_teal-500/50 dark:text-tea_green-500/40 italic">
          Index documents to generate summary
        </p>
      )}
    </div>
  )
}

export default function HomePage() {
  const [pdfs, setPdfs] = useState([])
  const [loading, setLoading] = useState(true)
  const { token, user } = useAuth()
  const navigate = useNavigate()

  const fetchPdfs = async () => {
    setLoading(true)
    try {
      const res = await listPdfs(token)
      setPdfs(res.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchPdfs() }, [])

  const indexedCount = pdfs.filter(p => p.indexed).length

  return (
    <div className="min-h-screen bg-vanilla_cream-900 dark:bg-dark_teal-200">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Hero */}
        <div className="mb-10 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <SparklesIcon size={16} className="text-sea_green-500" />
            <span className="text-xs font-body font-medium text-sea_green-500 uppercase tracking-wider">Your Documents, Answered</span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-dark_teal-500 dark:text-tea_green-500 mb-3">
            Hello, {user?.username} 👋
          </h1>
          <p className="font-body text-base text-dark_teal-500/70 dark:text-tea_green-500/70 max-w-xl leading-relaxed">
            ContextPDF reads and understands your documents, then lets you have a natural conversation with them — ask questions, find answers, and uncover insights instantly.
          </p>
        </div>

        {/* Stats + Actions */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="card px-4 py-2.5 flex items-center gap-2">
            <FileTextIcon size={14} className="text-sea_green-500" />
            <span className="text-sm font-body text-dark_teal-500 dark:text-tea_green-500">
              <span className="font-semibold">{pdfs.length}</span> documents
            </span>
          </div>
          <div className="card px-4 py-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sea_green-500" />
            <span className="text-sm font-body text-dark_teal-500 dark:text-tea_green-500">
              <span className="font-semibold">{pdfs.filter(p => p.indexed).length}</span> indexed
            </span>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="ml-auto flex items-center gap-2 bg-dark_teal-500 hover:bg-dark_teal-400 text-white font-body font-medium px-5 py-2.5 rounded-lg transition-all duration-200 active:scale-95 text-sm"
          >
            <MessageSquareIcon size={14} />
            Open Chat
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-tea_green-800 dark:bg-dark_teal-400" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-tea_green-800 dark:bg-dark_teal-400 rounded w-3/4" />
                    <div className="h-2 bg-tea_green-800 dark:bg-dark_teal-400 rounded w-1/4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-tea_green-800 dark:bg-dark_teal-400 rounded" />
                  <div className="h-2 bg-tea_green-800 dark:bg-dark_teal-400 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : pdfs.length === 0 ? (
          <div className="card p-12 text-center">
            <FileTextIcon size={36} className="text-tea_green-400 mx-auto mb-3" />
            <p className="font-body text-dark_teal-500/60 dark:text-tea_green-500/50 text-sm">
              No PDF files found in the backend <code className="font-mono text-xs bg-tea_green-900 dark:bg-dark_teal-400 px-1.5 py-0.5 rounded">/pdfs</code> directory.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pdfs.map((pdf, i) => (
              <InsightCard key={pdf.filename} pdf={pdf} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}