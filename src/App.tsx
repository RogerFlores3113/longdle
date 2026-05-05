import { Board } from './components/Board'
import { Keyboard } from './components/Keyboard'
import { Toast } from './components/Toast'
import { EndGameBanner } from './components/EndGameBanner'
import { useKeyboardListener } from './hooks/useKeyboardListener'

function App() {
  useKeyboardListener()
  return (
    <div className="app">
      <header className="app__header">Longdle</header>
      <main className="app__main">
        <Board />
        <EndGameBanner />
        <Keyboard />
      </main>
      <Toast />
    </div>
  )
}

export default App
