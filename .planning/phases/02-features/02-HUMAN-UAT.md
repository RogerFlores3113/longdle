---
status: partial
phase: 02-features
source: [02-VERIFICATION.md]
started: 2026-05-05T16:25:00Z
updated: 2026-05-05T16:25:00Z
---

## Current Test

[awaiting human browser testing]

## Tests

### 1. First-visit onboarding
expected: HowToPlay modal opens automatically on first visit (localStorage cleared); closes on click/Escape; does not reopen on subsequent visits
result: [pending]

### 2. EndGame modal auto-open
expected: EndGame modal appears automatically when game ends (won or lost); "Brilliant!" on win, answer revealed on loss
result: [pending]

### 3. Clipboard share — success path
expected: Share button in EndGame modal copies emoji grid; "Copied to clipboard!" toast appears via existing Toast component
result: [pending]

### 4. Clipboard share — fallback path
expected: When clipboard API rejects, CopyFallbackModal appears with pre-selected readOnly textarea
result: [pending]

### 5. Colorblind mode CSS cascade
expected: Toggling colorblind mode in Settings immediately changes tile/key colors to orange/blue; toggling back restores green/yellow
result: [pending]

### 6. Stats accuracy after game completion
expected: StatsModal shows correct guess distribution with current game's bar highlighted; win % and streak update correctly
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
