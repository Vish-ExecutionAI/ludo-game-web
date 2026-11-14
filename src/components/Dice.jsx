export default function Dice({ value, onRoll, canRoll }) {
  return (
    <div className="dice-container">
      <div className={`dice dice-${value || '0'}`}>
        {value || '?'}
      </div>
      <button onClick={onRoll} disabled={!canRoll || value === 6}>
        {value === 6 ? 'Rolled 6, move!' : 'Roll Dice'}
      </button>
    </div>
  );
}