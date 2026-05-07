import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PracticeGame } from './components/PracticeGame.tsx'

// D-01: pathname-based routing — no React Router dependency needed for 2 routes
// D-02: two fully separate component trees — PracticeGame and App never share state
const isPractice = window.location.pathname === '/random'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPractice ? <PracticeGame /> : <App />}
  </StrictMode>,
)
