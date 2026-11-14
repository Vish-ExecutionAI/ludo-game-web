import PlayerToken from "./PlayerToken.jsx";
import { BOARD_SETUP } from "../lib/ludoLogic.js";

const playerBaseCoords = {
  red: { top: '0', left: '0' },
  blue: { top: '0', right: '0' },
  yellow: { bottom: '0', right: '0' },
  green: { bottom: '0', left: '0' }
};

const getSquareClass = (squareId, playerColor) => {
  let classes = ['ludo-square'];
  if (BOARD_SETUP.startPositions[playerColor] === squareId) classes.push('start-square');
  if (BOARD_SETUP.safeSquares.includes(squareId)) classes.push('safe-square');
  if (BOARD_SETUP.homeEntries[playerColor] === squareId) classes.push('home-entry-square');
  if (squareId.startsWith('home_')) classes.push('home-path-square');
  if (squareId.startsWith('finish_')) classes.push('finish-square');
  if (squareId.includes(playerColor)) classes.push(`square-${playerColor}`);
  return classes.join(' ');
};

export default function LudoBoard({
  players,
  currentPlayerColor,
  highlightedMoves,
  selectedTokenIndex,
  onTokenClick,
  onBoardSquareClick,
}) {
  const allSquares = [
    ...BOARD_SETUP.mainPath,
    ...Object.values(BOARD_SETUP.homePaths).flat(),
    ...Object.values(BOARD_SETUP.finishPositions)
  ];

  const getTokenPositionStyle = (token) => {
    if (token.position === 'base') {
      const baseOffset = token.id % 4; // 0, 1, 2, 3
      const baseCoord = playerBaseCoords[token.color];
      const topOffset = 20 + (baseOffset < 2 ? 0 : 40);
      const leftOffset = 20 + (baseOffset % 2 === 0 ? 0 : 40);
      return { ...baseCoord, top: `calc(${baseCoord.top} + ${topOffset}px)`, left: `calc(${baseCoord.left} + ${leftOffset}px)` };
    } else {
      const square = allSquares.find(s => s.id === token.position);
      if (square) {
        return { gridArea: square.id };
      }
    }
    return {};
  };

  return (
    <div className="ludo-board-container">
      <div className="ludo-board">
        {allSquares.map(square => (
          <div
            key={square.id}
            id={square.id}
            className={getSquareClass(square.id, square.id.includes('_') ? square.id.split('_')[1] : null)}
            onClick={() => onBoardSquareClick(square.id)}
          >
            {highlightedMoves.some(m => m.targetPosition === square.id) && (
              <div className="highlighted-target"></div>
            )}
            {players.map(player =>
              player.tokens.map(token => {
                if (token.position === square.id) {
                  const isCurrentPlayer = player.color === currentPlayerColor;
                  const isSelected = isCurrentPlayer && token.id === selectedTokenIndex;
                  const isMovable = highlightedMoves.some(m => m.tokenIndex === token.id);

                  return (
                    <PlayerToken
                      key={token.color + token.id}
                      color={player.color}
                      onClick={() => isCurrentPlayer && isMovable && onTokenClick(token.id)}
                      isHighlighted={isSelected || (isCurrentPlayer && isMovable)}
                    />
                  );
                }
                return null;
              })
            )}
          </div>
        ))}

        {/* Render tokens that are in 'base' */} 
        {players.map(player =>
          player.tokens.map(token => {
            if (token.position === 'base') {
              const isCurrentPlayer = player.color === currentPlayerColor;
              const isSelected = isCurrentPlayer && token.id === selectedTokenIndex;
              const isMovable = highlightedMoves.some(m => m.tokenIndex === token.id && token.position === 'base');

              return (
                <div key={token.color + token.id + '_base'} className={`base-token-area base-${player.color}`}
                  style={getTokenPositionStyle(token)}
                  onClick={() => isCurrentPlayer && isMovable && onTokenClick(token.id)}
                >
                  <PlayerToken
                    color={player.color}
                    isHighlighted={isSelected || (isCurrentPlayer && isMovable)}
                  />
                </div>
              );
            }
            return null;
          })
        )}
      </div>
    </div>
  );
}