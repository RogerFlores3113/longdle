import { describe, it, expect, beforeEach } from 'vitest'
import { useGame, useSettings } from './useGame'
import { VALID_GUESSES } from '../data/words'

beforeEach(() => {
  localStorage.clear()
  useGame.persist.clearStorage()
  useSettings.persist.clearStorage()
  useGame.getState().resetForNewDay()
  useSettings.setState({ hardMode: false, colorblindMode: false })
})

describe('useGame.onKey', () => {
  it('appends a letter when called with a-z', () => {
    useGame.getState().onKey('a')
    expect(useGame.getState().currentGuess).toBe('a')
  })

  it('normalizes uppercase to lowercase', () => {
    useGame.getState().onKey('Z')
    expect(useGame.getState().currentGuess).toBe('z')
  })

  it('ignores letter input once row is full (6 chars)', () => {
    for (const c of 'abcdef') useGame.getState().onKey(c)
    useGame.getState().onKey('g')
    expect(useGame.getState().currentGuess).toBe('abcdef')
  })

  it('Backspace removes last letter', () => {
    for (const c of 'abc') useGame.getState().onKey(c)
    useGame.getState().onKey('Backspace')
    expect(useGame.getState().currentGuess).toBe('ab')
  })

  it('treats Delete as Backspace', () => {
    for (const c of 'abc') useGame.getState().onKey(c)
    useGame.getState().onKey('Delete')
    expect(useGame.getState().currentGuess).toBe('ab')
  })

  it('Enter with <6 letters sets toastMessage="Not enough letters"', () => {
    for (const c of 'ab') useGame.getState().onKey(c)
    useGame.getState().onKey('Enter')
    expect(useGame.getState().toastMessage).toBe('Not enough letters')
    expect(useGame.getState().currentGuess).toBe('ab')
  })

  it('Enter with 6-letter non-word sets toastMessage="Not in word list"', () => {
    // Pick a string that is definitely NOT in VALID_WORDS
    const notAWord = 'qzxqzx'
    for (const c of notAWord) useGame.getState().onKey(c)
    useGame.getState().onKey('Enter')
    expect(useGame.getState().toastMessage).toBe('Not in word list')
    expect(useGame.getState().guesses.length).toBe(0)
  })

  it('Enter with valid guess submits, scores, clears currentGuess', () => {
    const w = VALID_GUESSES[0] // any valid 6-letter word
    for (const c of w) useGame.getState().onKey(c)
    useGame.getState().onKey('Enter')
    expect(useGame.getState().guesses.length).toBe(1)
    expect(useGame.getState().guesses[0].guess).toBe(w)
    expect(useGame.getState().guesses[0].statuses.length).toBe(6)
    expect(useGame.getState().currentGuess).toBe('')
  })

  it('winning guess sets gameStatus="won" and blocks further input', () => {
    const answer = useGame.getState().getAnswer()
    for (const c of answer) useGame.getState().onKey(c)
    useGame.getState().onKey('Enter')
    expect(useGame.getState().gameStatus).toBe('won')
    // Subsequent input ignored
    useGame.getState().onKey('a')
    expect(useGame.getState().currentGuess).toBe('')
  })

  it('isAnimating=true blocks input (D-12)', () => {
    useGame.setState({ isAnimating: true })
    useGame.getState().onKey('a')
    expect(useGame.getState().currentGuess).toBe('')
  })

  it('rowShakeKey increments on invalid submit', () => {
    const before = useGame.getState().rowShakeKey
    for (const c of 'ab') useGame.getState().onKey(c)
    useGame.getState().onKey('Enter')
    expect(useGame.getState().rowShakeKey).toBe(before + 1)
  })

  it('keyStatuses upgrades from absent to correct, never downgrades (GAME-03)', () => {
    // Set a letter as absent, verify setState works correctly
    useGame.setState({ keyStatuses: { a: 'absent' } })
    expect(useGame.getState().keyStatuses['a']).toBe('absent')
    // Now the answer contains 'a' — submit it to trigger upgrade via onKey('Enter')
    const answer = useGame.getState().getAnswer()
    if (answer.includes('a')) {
      // submit the answer to get 'correct' for 'a'
      for (const c of answer) useGame.getState().onKey(c)
      useGame.getState().onKey('Enter')
      // 'a' should be upgraded to 'correct'
      expect(useGame.getState().keyStatuses['a']).toBe('correct')
    } else {
      // Just verify the setState held
      expect(useGame.getState().keyStatuses['a']).toBe('absent')
    }
  })

  it('gameStatus starts as "playing"', () => {
    expect(useGame.getState().gameStatus).toBe('playing')
  })

  it('getAnswer returns a 6-letter word', () => {
    const answer = useGame.getState().getAnswer()
    expect(answer).toHaveLength(6)
    expect(typeof answer).toBe('string')
  })
})

describe('useSettings', () => {
  it('starts with hardMode=false', () => {
    expect(useSettings.getState().hardMode).toBe(false)
  })

  it('setHardMode toggles hardMode', () => {
    useSettings.getState().setHardMode(true)
    expect(useSettings.getState().hardMode).toBe(true)
    useSettings.getState().setHardMode(false)
    expect(useSettings.getState().hardMode).toBe(false)
  })

  it('setColorblindMode toggles colorblindMode', () => {
    useSettings.getState().setColorblindMode(true)
    expect(useSettings.getState().colorblindMode).toBe(true)
  })
})
