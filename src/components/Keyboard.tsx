import { useGameContext } from '../contexts/GameContext'
import { Key } from './Key'

const ROW_1 = 'qwertyuiop'.split('')
const ROW_2 = 'asdfghjkl'.split('')
const ROW_3 = 'zxcvbnm'.split('')

export function Keyboard() {
  const { keyStatuses, onKey } = useGameContext()
  return (
    <div className="keyboard">
      <div className="keyboard__row">
        {ROW_1.map((c) => (
          <Key key={c} label={c} value={c} status={keyStatuses[c]} onKey={onKey} />
        ))}
      </div>
      <div className="keyboard__row">
        {ROW_2.map((c) => (
          <Key key={c} label={c} value={c} status={keyStatuses[c]} onKey={onKey} />
        ))}
      </div>
      <div className="keyboard__row">
        <Key label="ENTER" value="Enter" wide onKey={onKey} />
        {ROW_3.map((c) => (
          <Key key={c} label={c} value={c} status={keyStatuses[c]} onKey={onKey} />
        ))}
        <Key label="⌫" value="Backspace" wide onKey={onKey} />
      </div>
    </div>
  )
}
