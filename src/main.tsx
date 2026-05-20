import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PracticeGame } from './components/PracticeGame.tsx'
import { FiveGame } from './components/FiveGame.tsx'

// D-01: pathname-based routing — no React Router dependency needed for 3 routes
// D-02: fully separate component trees — FiveGame, PracticeGame, and App never share state
const isPractice = window.location.pathname === '/random'
const isFive = window.location.pathname === '/five'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isFive ? <FiveGame /> : isPractice ? <PracticeGame /> : <App />}
  </StrictMode>,
)
