import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileTextIcon, SendIcon, PlusIcon, TrashIcon, MessageSquareIcon, ChevronRightIcon,
  ChevronLeftIcon, LightbulbIcon, ChevronDownIcon, ChevronUpIcon, BotIcon, UserIcon, ClockIcon
} from '../components/Icons'
import Navbar from '../components/Navbar'
import { listPdfs, getChatSessions, createChatSession, getSessionMessages, deleteSession, sendMessage } from '../api'
import { useAuth } from '../context/AuthContext'
import ReactMarkdown from 'react-markdown'

// ─── PDF Sidebar Item ─────────────────────────────────────────────────────────
function PdfItem({ pdf }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg overflow-hidden border border-tea_green-700 dark:border-dark_teal-400 mb-2">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-dark_teal-300 cursor-pointer hover:bg-tea_green-900 dark:hover:bg-dark_teal-400 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <FileTextIcon size={13} className="text-sea_green-500 flex-shrink-0" />
        <span className="text-xs font-body font-medium text-dark_teal-500 dark:text-tea_green-500 truncate flex-1">
          {pdf.filename}
        </span>
        {pdf.summary && (open ? <ChevronUpIcon size={12} className="text-dark_teal-500/40 flex-shrink-0" /> : <ChevronDownIcon size={12} className="text-dark_teal-500/40 flex-shrink-0" />)}
      </div>
      {open && pdf.summary && (
        <div className="px-3 py-3 bg-tea_green-900 dark:bg-dark_teal-400 animate-fade-in border-t border-tea_green-700 dark:border-dark_teal-500">
          <p className="text-xs font-body text-dark_teal-500/80 dark:text-tea_green-500/80 leading-relaxed mb-2">{pdf.summary}</p>
          {pdf.key_insights?.length > 0 && (
            <div>
              <p className="flex items-center gap-1 text-xs font-body font-semibold text-sea_green-500 mb-1.5">
                <LightbulbIcon size={10} /> Key Insights
              </p>
              <ul className="space-y-1">
                {pdf.key_insights.map((ins, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs font-body text-dark_teal-500/70 dark:text-tea_green-500/70">
                    <span className="w-1 h-1 rounded-full bg-celadon-500 mt-1.5 flex-shrink-0" />
                    {ins}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────
function ChatBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 animate-slide-up ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-sea_green-500/10 border border-sea_green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <BotIcon size={13} className="text-sea_green-500" />
        </div>
      )}
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm font-body leading-relaxed ${
        isUser
          ? 'bg-sea_green-500 text-white rounded-tr-sm'
          : 'bg-white dark:bg-dark_teal-300 border border-tea_green-700 dark:border-dark_teal-400 text-dark_teal-500 dark:text-tea_green-500 rounded-tl-sm'
      }`}>
        {isUser ? (
          <p>{msg.content}</p>
        ) : (
          <ReactMarkdown
            components={{
              p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({children}) => <ul className="list-disc ml-4 mb-2 space-y-0.5">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal ml-4 mb-2 space-y-0.5">{children}</ol>,
              strong: ({children}) => <strong className="font-semibold">{children}</strong>,
              code: ({children}) => <code className="bg-tea_green-800 dark:bg-dark_teal-400 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
            }}
          >
            {msg.content}
          </ReactMarkdown>
        )}
        {msg.timestamp && (
          <p className={`text-xs mt-1.5 ${isUser ? 'text-white/60' : 'text-dark_teal-500/40 dark:text-tea_green-500/40'}`}>
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-dark_teal-500/10 border border-dark_teal-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <UserIcon size={13} className="text-dark_teal-500 dark:text-tea_green-500" />
        </div>
      )}
    </div>
  )
}

// ─── Main Chat Page ───────────────────────────────────────────────────────────
export default function ChatPage() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [pdfs, setPdfs] = useState([])
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)

  const bottomRef = useRef(null)

  useEffect(() => {
    listPdfs(token).then(r => setPdfs(r.data)).catch(() => {})
    loadSessions()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSessions = async () => {
    try {
      const res = await getChatSessions(token)
      setSessions(res.data)
    } catch {}
  }

  const loadSession = async (sessionId) => {
    setActiveSession(sessionId)
    try {
      const res = await getSessionMessages(sessionId, token)
      setMessages(res.data.messages || [])
    } catch {}
  }

  const newSession = async () => {
    try {
      const res = await createChatSession(token, 'New Chat')
      await loadSessions()
      setActiveSession(res.data.session_id)
      setMessages([])
    } catch {}
  }

  const removeSession = async (e, sid) => {
    e.stopPropagation()
    await deleteSession(sid, token)
    if (activeSession === sid) { setActiveSession(null); setMessages([]) }
    loadSessions()
  }

  const handleSend = async () => {
    const q = input.trim()
    if (!q || sending) return
    setInput('')
    setSending(true)

    const userMsg = { role: 'user', content: q, timestamp: new Date().toISOString() }
    setMessages(m => [...m, userMsg])

    try {
      const res = await sendMessage({ token, question: q, session_id: activeSession })
      const botMsg = { role: 'assistant', content: res.data.answer, timestamp: new Date().toISOString() }
      setMessages(m => [...m, botMsg])
      if (!activeSession) {
        setActiveSession(res.data.session_id)
        loadSessions()
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.', timestamp: new Date().toISOString() }])
    }
    setSending(false)
  }

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }

  return (
    <div className="min-h-screen bg-vanilla_cream-900 dark:bg-dark_teal-200 flex flex-col">
      <Navbar />

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

        {/* ── Left Sidebar: Documents ── */}
        <aside className={`flex-shrink-0 transition-all duration-300 ${leftOpen ? 'w-64' : 'w-10'} border-r border-tea_green-700 dark:border-dark_teal-400 bg-tea_green-900 dark:bg-dark_teal-300 flex flex-col`}>
          <div className="flex items-center justify-between px-3 py-3 border-b border-tea_green-700 dark:border-dark_teal-400">
            {leftOpen && <span className="text-xs font-body font-semibold text-dark_teal-500 dark:text-tea_green-500 uppercase tracking-wider">Documents</span>}
            <button onClick={() => setLeftOpen(o => !o)} className="ml-auto w-6 h-6 rounded flex items-center justify-center text-dark_teal-500/40 dark:text-tea_green-500/40 hover:text-dark_teal-500 dark:hover:text-tea_green-500 hover:bg-tea_green-800 dark:hover:bg-dark_teal-400 transition-colors">
              {leftOpen ? <ChevronLeftIcon size={14} /> : <ChevronRightIcon size={14} />}
            </button>
          </div>
          {leftOpen && (
            <div className="flex-1 overflow-y-auto p-3">
              {pdfs.length === 0 ? (
                <p className="text-xs font-body text-dark_teal-500/40 dark:text-tea_green-500/40 text-center mt-4">No documents found</p>
              ) : (
                pdfs.map(pdf => <PdfItem key={pdf.filename} pdf={pdf} />)
              )}
            </div>
          )}
        </aside>

        {/* ── Main Chat Area ── */}
        <main className="flex-1 flex flex-col min-w-0 bg-vanilla_cream-900 dark:bg-dark_teal-200">

          {/* Chat header */}
          <div className="px-5 py-3 border-b border-tea_green-700 dark:border-dark_teal-400 bg-white/60 dark:bg-dark_teal-300/60 backdrop-blur-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquareIcon size={15} className="text-sea_green-500" />
              <span className="text-sm font-body font-medium text-dark_teal-500 dark:text-tea_green-500">
                {activeSession
                  ? sessions.find(s => s.session_id === activeSession)?.title || 'Chat'
                  : 'New Conversation'}
              </span>
            </div>
            <button onClick={newSession} className="flex items-center gap-1.5 text-xs font-body font-medium text-sea_green-500 hover:text-sea_green-400 transition-colors">
              <PlusIcon size={13} /> New Chat
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
                <div className="w-12 h-12 rounded-2xl bg-sea_green-500/10 flex items-center justify-center mb-3">
                  <BotIcon size={22} className="text-sea_green-500" />
                </div>
                <p className="font-body font-medium text-dark_teal-500 dark:text-tea_green-500 mb-1">Ask anything about your documents</p>
                <p className="text-xs font-body text-dark_teal-500/50 dark:text-tea_green-500/40 max-w-xs">
                  Your questions are answered using only the content from the indexed PDFs.
                </p>
              </div>
            )}
            {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
            {sending && (
              <div className="flex gap-3 justify-start animate-fade-in">
                <div className="w-7 h-7 rounded-full bg-sea_green-500/10 border border-sea_green-500/20 flex items-center justify-center flex-shrink-0">
                  <BotIcon size={13} className="text-sea_green-500" />
                </div>
                <div className="bg-white dark:bg-dark_teal-300 border border-tea_green-700 dark:border-dark_teal-400 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-sea_green-500 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-5 py-4 border-t border-tea_green-700 dark:border-dark_teal-400 bg-white/60 dark:bg-dark_teal-300/60 backdrop-blur-sm">
            <div className="flex gap-3 items-end">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask a question about your documents..."
                rows={1}
                className="input-field flex-1 resize-none max-h-32 leading-relaxed"
                style={{ height: 'auto' }}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-xl bg-sea_green-500 hover:bg-sea_green-400 text-white flex items-center justify-center transition-all duration-200 active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <SendIcon size={15} />
              </button>
            </div>
            <p className="text-xs font-body text-dark_teal-500/30 dark:text-tea_green-500/30 mt-1.5 text-center">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </main>

        {/* ── Right Sidebar: Chat History ── */}
        <aside className={`flex-shrink-0 transition-all duration-300 ${rightOpen ? 'w-60' : 'w-10'} border-l border-tea_green-700 dark:border-dark_teal-400 bg-tea_green-900 dark:bg-dark_teal-300 flex flex-col`}>
          <div className="flex items-center justify-between px-3 py-3 border-b border-tea_green-700 dark:border-dark_teal-400">
            <button onClick={() => setRightOpen(o => !o)} className="w-6 h-6 rounded flex items-center justify-center text-dark_teal-500/40 dark:text-tea_green-500/40 hover:text-dark_teal-500 dark:hover:text-tea_green-500 hover:bg-tea_green-800 dark:hover:bg-dark_teal-400 transition-colors">
              {rightOpen ? <ChevronRightIcon size={14} /> : <ChevronLeftIcon size={14} />}
            </button>
            {rightOpen && <span className="text-xs font-body font-semibold text-dark_teal-500 dark:text-tea_green-500 uppercase tracking-wider">History</span>}
          </div>
          {rightOpen && (
            <div className="flex-1 overflow-y-auto p-2">
              {sessions.length === 0 ? (
                <p className="text-xs font-body text-dark_teal-500/40 dark:text-tea_green-500/40 text-center mt-4 px-2">
                  No chat history yet
                </p>
              ) : (
                sessions.map(session => (
                  <div
                    key={session.session_id}
                    onClick={() => loadSession(session.session_id)}
                    className={`group flex items-start gap-2 px-3 py-2.5 rounded-lg mb-1 cursor-pointer transition-colors ${
                      activeSession === session.session_id
                        ? 'bg-sea_green-500/10 dark:bg-sea_green-500/20'
                        : 'hover:bg-tea_green-800 dark:hover:bg-dark_teal-400'
                    }`}
                  >
                    <ClockIcon size={11} className="text-dark_teal-500/40 dark:text-tea_green-500/40 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-body font-medium text-dark_teal-500 dark:text-tea_green-500 truncate">{session.title}</p>
                      <p className="text-xs font-body text-dark_teal-500/40 dark:text-tea_green-500/40 mt-0.5">
                        {session.message_count} messages
                      </p>
                    </div>
                    <button
                      onClick={(e) => removeSession(e, session.session_id)}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-dark_teal-500/40 hover:text-red-400 transition-all flex-shrink-0"
                    >
                      <TrashIcon size={10} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </aside>

      </div>
    </div>
  )
}