const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://darukaa-earth-backend.vercel.app'

export const API_BASE_URL = backendUrl.replace(/\/$/, '')
