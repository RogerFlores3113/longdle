import { useEffect } from 'react'
import { useGame } from './useGame'

/**
 * Wires document-level keydown to useGame.onKey.
 *
 * Single source of physical input per D-10. The store action is the single seam
 * (ARCHITECTURE) — both this hook and on-screen Key clicks call useGame.onKey.
 */
export function useKeyboardListener(): void {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Don't intercept browser shortcuts.
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const k = e.key
      if (k === 'Enter' || k === 'Backspace' || k === 'Delete') {
        e.preventDefault()
        useGame.getState().onKey(k)
        return
      }
      if (/^[a-zA-Z]$/.test(k)) {
        e.preventDefault()
        useGame.getState().onKey(k.toLowerCase())
      }
      // All other keys: ignore (no preventDefault per UI-SPEC).
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])
}
