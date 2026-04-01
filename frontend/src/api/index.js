import axios from 'axios'

const BASE = '/api'

const api = axios.create({ baseURL: BASE })

// ─── Auth ──────────────────────────────────────────────────────────────────
export const signup = (data) => api.post('/auth/signup', data)
export const loginApi = (data) => api.post('/auth/login', data)
export const logoutApi = (token) => api.post(`/auth/logout?token=${token}`)

// ─── Profile ──────────────────────────────────────────────────────────────
export const getProfile = (token) => api.get(`/profile?token=${token}`)
export const updateProfile = (data) => api.put('/profile', data)

// ─── PDFs ─────────────────────────────────────────────────────────────────
export const listPdfs = (token) => api.get(`/pdfs?token=${token}`)
export const indexPdfs = (token) => api.post(`/pdfs/index?token=${token}`)


export const getChatSessions = (token) => api.get(`/chat/sessions?token=${token}`)
export const createChatSession = (token, title) => api.post('/chat/sessions', { token, title })
export const getSessionMessages = (sessionId, token) => api.get(`/chat/sessions/${sessionId}?token=${token}`)
export const deleteSession = (sessionId, token) => api.delete(`/chat/sessions/${sessionId}?token=${token}`)
export const sendMessage = (data) => api.post('/chat', data)