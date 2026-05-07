/**
 * gameCore.ts — pure game-logic helpers shared by useGame and usePracticeGame.
 *
 * Rules:
 *  - NO imports from storage.ts (recordGameEnd must never appear here — Pitfall 3)
 *  - NO persist() configuration (daily-store-specific)
 *  - Timer refs are passed IN from the calling store (each store owns its own refs — Pitfall 4)
 */
import type { TileStatus } from './scoring'
import type { KeyStatus } from '../types/game'

const KEY_RANK: Record<KeyStatus, number> = { correct: 3, present: 2, absent: 1 }

/**
 * Returns the higher-ranked key status between prev and the new tile result.
 * Ranking: correct(3) > present(2) > absent(1). Never downgrades.
 * 'empty' and 'active' tile statuses leave the key color unchanged.
 */
export function upgradeKeyStatus(
  prev: KeyStatus | undefined,
  next: TileStatus
): KeyStatus | undefined {
  if (next === 'empty' || next === 'active') return prev
  const prevRank = prev ? KEY_RANK[prev] : 0
  const nextRank = KEY_RANK[next as KeyStatus]
  return nextRank > prevRank ? (next as KeyStatus) : prev
}

/**
 * Show a toast message and auto-dismiss after toastMs.
 * Each store passes its own timerRef — prevents cross-store timer interference (Pitfall 4).
 */
export function showToast(
  msg: string,
  set: (partial: { toastMessage: string | null }) => void,
  timerRef: { current: ReturnType<typeof setTimeout> | null },
  toastMs = 1500
): void {
  if (timerRef.current) clearTimeout(timerRef.current)
  set({ toastMessage: msg })
  timerRef.current = setTimeout(() => {
    set({ toastMessage: null })
    timerRef.current = null
  }, toastMs)
}

/**
 * Increment rowShakeKey to trigger the CSS shake animation via React key prop.
 * Each store passes its own timerRef — prevents cross-store timer interference (Pitfall 4).
 */
export function triggerShake(
  set: (partial: { rowShakeKey: number }) => void,
  get: () => { rowShakeKey: number },
  timerRef: { current: ReturnType<typeof setTimeout> | null },
  shakeMs = 350
): void {
  if (timerRef.current) clearTimeout(timerRef.current)
  set({ rowShakeKey: get().rowShakeKey + 1 })
  timerRef.current = setTimeout(() => {
    timerRef.current = null
  }, shakeMs)
}
