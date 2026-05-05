import { Modal } from './Modal'
import { useGame, useSettings } from '../hooks/useGame'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { hardMode, colorblindMode, setHardMode, setColorblindMode } = useSettings()
  const guesses = useGame((s) => s.guesses)
  const hardModeDisabled = guesses.length > 0

  return (
    <Modal onClose={onClose}>
      <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
      <h2 style={{ textAlign: 'center', fontSize: 24, fontWeight: 600, margin: '0 0 8px' }}>
        Settings
      </h2>
      <div>
        <div className="settings-row" style={hardModeDisabled ? { opacity: 0.5 } : undefined}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Hard Mode</div>
            {hardModeDisabled && (
              <div style={{ fontSize: 12, color: 'var(--color-absent)', marginTop: 2 }}>
                Can only be changed before a game starts.
              </div>
            )}
          </div>
          <button
            role="switch"
            aria-checked={hardMode}
            className={`settings-toggle${hardModeDisabled ? ' settings-toggle--disabled' : ''}`}
            onClick={() => !hardModeDisabled && setHardMode(!hardMode)}
            aria-label="Hard mode"
          />
        </div>
        <div className="settings-row">
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Colorblind Mode</div>
            <div style={{ fontSize: 12, color: 'var(--color-absent)', marginTop: 2 }}>
              For improved color vision
            </div>
          </div>
          <button
            role="switch"
            aria-checked={colorblindMode}
            className="settings-toggle"
            onClick={() => setColorblindMode(!colorblindMode)}
            aria-label="Colorblind mode"
          />
        </div>
      </div>
    </Modal>
  )
}
