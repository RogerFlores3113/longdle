/**
 * PracticeBanner — full-width bar always visible during practice sessions.
 * Rendered between the app header and the game board in PracticeGame.tsx.
 *
 * D-09: block element in document flow (no absolute/fixed positioning — Pitfall 5)
 * D-10: "Practice Mode" text + "→ Play today's puzzle" link to /
 * D-11: CSS tokens from :root — no hardcoded hex values
 */
export function PracticeBanner() {
  return (
    <div className="practice-banner">
      Practice Mode
      {' '}
      <a href="/" className="practice-banner__link">&rarr; Play today&apos;s puzzle</a>
    </div>
  )
}
