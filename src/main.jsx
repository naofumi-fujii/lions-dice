// エントリポイント (src/main.jsx)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    {/* Vercel Analytics: 本番 (Vercel) 上でのみ計測用スクリプトを読み込む */}
    <Analytics />
  </StrictMode>,
)
