export default function PlayerToken({ color, onClick, isHighlighted }) {
  return (
    <div
      className={`player-token token-${color} ${isHighlighted ? 'highlighted' : ''}`}
      style={{ backgroundColor: color }}
      onClick={onClick}
    ></div>
  );
}