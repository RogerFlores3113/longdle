import { useEffect } from 'react'

/**
 * Attaches a document-level keydown listener that routes keyboard events to the
 * provided onKey callback. Modifier keys (meta/ctrl/alt) are ignored.
 *
 * @param onKey - Called with normalized key: single lowercase letter, 'Enter',
 *                'Backspace', or 'Delete'. Delete is passed as-is; callers may
 *                normalize to 'Backspace' if desired.
 *
 * Callers:
 *   App.tsx:          useKeyboardListener(useGame.getState().onKey)
 *   PracticeGame.tsx: useKeyboardListener(usePracticeGame.getState().onKey)
 */
export function useKeyboardListener(onKey: (key: string) => void): void {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key
      if (k === 'Enter' || k === 'Backspace' || k === 'Delete') {
        e.preventDefault()
        onKey(k)
        return
      }
      if (/^[a-zA-Z]$/.test(k)) {
        e.preventDefault()
        onKey(k.toLowerCase())
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onKey])
}
