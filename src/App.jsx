import { useState, useEffect } from "react";
import { createInitialGameState, rollDice, getPossibleMoves, applyMove } from "./lib/ludoLogic.js";
import LudoBoard from "./components/LudoBoard.jsx";
import Dice from "./components/Dice.jsx";
import "./styles.css";

const PLAYER_COLORS = ["red", "blue", "yellow", "green"];

export default function App() {
  const [game, setGame] = useState(() => createInitialGameState(2)); // Start with 2 players by default
  const [highlightedMoves, setHighlightedMoves] = useState([]);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState(null);
  const [playerCount, setPlayerCount] = useState(2);

  const currentPlayer = game.players[game.currentPlayerIndex];

  useEffect(() => {
    if (game.diceRoll === 6) {
      setGame(prevGame => ({
        ...prevGame,
        message: `${currentPlayer.color} rolled a 6! Roll again after your move.`,
      }));
    } else if (game.diceRoll > 0 && highlightedMoves.length === 0 && selectedTokenIndex === null) {
      // No possible moves, so pass turn
      const hasValidMoves = currentPlayer.tokens.some((_, tokenIdx) => {
        const moves = getPossibleMoves(currentPlayer, tokenIdx, game.diceRoll, game.players);
        return moves.length > 0;
      });

      if (!hasValidMoves && game.diceRoll > 0) {
        setGame(prevGame => ({
          ...prevGame,
          message: `${currentPlayer.color} has no valid moves. Passing turn.`, 
          currentPlayerIndex: (prevGame.currentPlayerIndex + 1) % prevGame.players.length,
          diceRoll: 0,
        }));
      }
    }
  }, [game.diceRoll, highlightedMoves, selectedTokenIndex, currentPlayer.color, game.players.length, game.players, currentPlayer.tokens]);

  const handleStartGame = () => {
    setGame(createInitialGameState(playerCount));
  };

  const handleRollDice = () => {
    if (game.gamePhase !== 'rollingDice') return;

    const roll = rollDice();
    setGame(prevGame => ({
      ...prevGame,
      diceRoll: roll,
      message: `${currentPlayer.color} rolled a ${roll}!`, 
      gamePhase: 'movingToken',
    }));

    // Calculate possible moves after rolling
    const moves = [];
    if (roll > 0) {
      currentPlayer.tokens.forEach((_, tokenIdx) => {
        const possiblePositions = getPossibleMoves(currentPlayer, tokenIdx, roll, game.players);
        if (possiblePositions.length > 0) {
          possiblePositions.forEach(pos => moves.push({ tokenIndex: tokenIdx, targetPosition: pos }));
        }
      });
    }
    setHighlightedMoves(moves);
  };

  const handleTokenClick = (tokenIdx) => {
    if (game.gamePhase !== 'movingToken' || !currentPlayer || !game.diceRoll) return;

    const possibleMovesForToken = highlightedMoves.filter(move => move.tokenIndex === tokenIdx);

    if (possibleMovesForToken.length > 0) {
      setSelectedTokenIndex(tokenIdx);
      // If only one move is possible, auto-select it. Otherwise, wait for target click.
      if (possibleMovesForToken.length === 1 && game.diceRoll !== 6) {
        handleMoveToken(tokenIdx, possibleMovesForToken[0].targetPosition);
      }
    } else {
      // If clicking an unmovable token, clear selection
      setSelectedTokenIndex(null);
      setHighlightedMoves([]);
      setGame(prevGame => ({ ...prevGame, message: `${currentPlayer.color}, select a movable token or roll the dice.` }));
    }
  };

  const handleBoardSquareClick = (targetPosition) => {
    if (game.gamePhase !== 'movingToken' || selectedTokenIndex === null) return;

    const validTarget = highlightedMoves.find(
      move => move.tokenIndex === selectedTokenIndex && move.targetPosition === targetPosition
    );

    if (validTarget) {
      handleMoveToken(selectedTokenIndex, targetPosition);
    } else {
      setGame(prevGame => ({ ...prevGame, message: `Invalid move. ${currentPlayer.color}, choose a highlighted target or another token.` }));
    }
  };

  const handleMoveToken = (tokenIdx, targetPosition) => {
    const { updatedPlayers, nextPlayerIndex, message, isWinner } = applyMove(
      game.players, 
      game.currentPlayerIndex, 
      tokenIdx, 
      game.diceRoll, 
      targetPosition
    );

    if (isWinner) {
      setGame(prevGame => ({
        ...prevGame,
        players: updatedPlayers,
        message: `${currentPlayer.color} WINS THE GAME!`, 
        gamePhase: 'gameOver',
        diceRoll: 0,
        currentPlayerIndex: -1 // No current player
      }));
    } else {
      setGame(prevGame => ({
        ...prevGame,
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
        diceRoll: 0, // Reset dice after move
        gamePhase: 'rollingDice', // Next player rolls dice
        message: message || `${updatedPlayers[prevGame.currentPlayerIndex].color} moved. It's ${updatedPlayers[nextPlayerIndex].color}'s turn.`
      }));
    }
    setSelectedTokenIndex(null);
    setHighlightedMoves([]);
  };

  return (
    <div className="shell">
      <aside>
        <h1>Ludo Game</h1>
        <p>Offline Multiplayer</p>
        {!game.gameStarted && (
          <div className="game-setup">
            <label htmlFor="player-count">Number of Players:</label>
            <select
              id="player-count"
              value={playerCount}
              onChange={(e) => setPlayerCount(Number(e.target.value))}
            >
              <option value={2}>2 Players</option>
              <option value={3}>3 Players</option>
              <option value={4}>4 Players</option>
            </select>
            <button onClick={handleStartGame}>Start New Game</button>
          </div>
        )}
        {game.gameStarted && (
          <div className="game-info">
            <h2>Current Player: <span style={{ color: currentPlayer.color }}>{currentPlayer.color}</span></h2>
            <p className="game-message">{game.message}</p>
            <Dice value={game.diceRoll} onRoll={handleRollDice} canRoll={game.gamePhase === 'rollingDice' && game.currentPlayerIndex !== -1} />
            <button className="new-game-button" onClick={() => setGame(createInitialGameState(playerCount))}>Reset Game</button>
          </div>
        )}
      </aside>
      <main>
        <h2>Ludo Board</h2>
        {game.gameStarted ? (
          <LudoBoard
            players={game.players}
            currentPlayerColor={currentPlayer?.color}
            highlightedMoves={highlightedMoves}
            selectedTokenIndex={selectedTokenIndex}
            onTokenClick={handleTokenClick}
            onBoardSquareClick={handleBoardSquareClick}
          />
        ) : (
          <div className="welcome-screen">
            <p>Welcome to Ludo! Select the number of players and click 'Start New Game' to begin.</p>
            <p><strong>How to Play:</strong></p>
            <ul>
                <li>Each player takes turns rolling the dice.</li>
                <li>Roll a 6 to move a token out of your base onto the starting square.</li>
                <li>Move your tokens around the board, following the path to your home column.</li>
                <li>Land on an opponent's token (not a star square) to send them back to their base.</li>
                <li>The first player to get all four tokens into their home finish area wins!</li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
