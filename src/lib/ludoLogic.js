export const PLAYER_COLORS = {
  red: {
    id: 'red', name: 'Red Player',
    startPosition: 'path_1',
    homeEntry: 'path_51',
    finishPosition: 'finish_red',
    homePath: ['home_red_1', 'home_red_2', 'home_red_3', 'home_red_4', 'home_red_5']
  },
  blue: {
    id: 'blue', name: 'Blue Player',
    startPosition: 'path_14',
    homeEntry: 'path_13',
    finishPosition: 'finish_blue',
    homePath: ['home_blue_1', 'home_blue_2', 'home_blue_3', 'home_blue_4', 'home_blue_5']
  },
  yellow: {
    id: 'yellow', name: 'Yellow Player',
    startPosition: 'path_27',
    homeEntry: 'path_26',
    finishPosition: 'finish_yellow',
    homePath: ['home_yellow_1', 'home_yellow_2', 'home_yellow_3', 'home_yellow_4', 'home_yellow_5']
  },
  green: {
    id: 'green', name: 'Green Player',
    startPosition: 'path_40',
    homeEntry: 'path_39',
    finishPosition: 'finish_green',
    homePath: ['home_green_1', 'home_green_2', 'home_green_3', 'home_green_4', 'home_green_5']
  }
};

const ALL_PLAYER_COLOR_IDS = Object.keys(PLAYER_COLORS);

const generateMainPath = () => {
  const path = [];
  for (let i = 1; i <= 52; i++) {
    path.push({ id: `path_${i}`, type: 'main' });
  }
  return path;
};

export const BOARD_SETUP = {
  mainPath: generateMainPath(), // 52 squares
  safeSquares: ['path_1', 'path_9', 'path_14', 'path_22', 'path_27', 'path_35', 'path_40', 'path_48'],
  startPositions: {
    red: 'path_1',
    blue: 'path_14',
    yellow: 'path_27',
    green: 'path_40'
  },
  homeEntries: {
    red: 'path_51',
    blue: 'path_13',
    yellow: 'path_26',
    green: 'path_39'
  },
  homePaths: {
    red: ['home_red_1', 'home_red_2', 'home_red_3', 'home_red_4', 'home_red_5'],
    blue: ['home_blue_1', 'home_blue_2', 'home_blue_3', 'home_blue_4', 'home_blue_5'],
    yellow: ['home_yellow_1', 'home_yellow_2', 'home_yellow_3', 'home_yellow_4', 'home_yellow_5'],
    green: ['home_green_1', 'home_green_2', 'home_green_3', 'home_green_4', 'home_green_5']
  },
  finishPositions: {
    red: 'finish_red',
    blue: 'finish_blue',
    yellow: 'finish_yellow',
    green: 'finish_green'
  }
};

export function createInitialGameState(playerCount) {
  const players = [];
  for (let i = 0; i < playerCount; i++) {
    const colorId = ALL_PLAYER_COLOR_IDS[i];
    players.push({
      id: i,
      color: colorId,
      info: PLAYER_COLORS[colorId],
      tokens: [
        { id: 0, position: 'base' },
        { id: 1, position: 'base' },
        { id: 2, position: 'base' },
        { id: 3, position: 'base' }
      ],
      finishedTokens: 0
    });
  }

  return {
    players,
    currentPlayerIndex: 0,
    diceRoll: 0,
    message: 'Roll the dice to start!',
    gamePhase: 'rollingDice',
    gameStarted: false
  };
}

export function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

export function getPossibleMoves(player, tokenIndex, diceRoll, allPlayers) {
  const token = player.tokens[tokenIndex];
  const possibleMoves = [];
  const playerInfo = PLAYER_COLORS[player.color];

  // Check if token can exit base (needs a 6)
  if (token.position === 'base') {
    if (diceRoll === 6) {
      // Check if start position is blocked by own token
      const startIsBlocked = player.tokens.some(t => t.position === playerInfo.startPosition);
      if (!startIsBlocked) {
        possibleMoves.push(playerInfo.startPosition);
      }
    }
    return possibleMoves;
  }

  let currentPathIndex;
  if (token.position.startsWith('path_')) {
    currentPathIndex = parseInt(token.position.split('_')[1]);
  } else if (token.position.startsWith('home_')) {
    const homePathIdx = playerInfo.homePath.indexOf(token.position);
    currentPathIndex = 51 + homePathIdx + 1; // Map home path to an extension of main path for calculation
  } else {
    // Token is already finished or invalid position
    return possibleMoves;
  }

  let targetPathIndex = currentPathIndex + diceRoll;
  let targetPositionId = null;

  // Handle moving on main path or entering home path
  if (currentPathIndex <= 51) { // On main path
    const mainPathLength = 52;
    const homePathStartIndex = BOARD_SETUP.mainPath.findIndex(s => s.id === playerInfo.homeEntry);

    // Calculate absolute position on a 0-indexed track for relative movement
    let absoluteCurrentPos = BOARD_SETUP.mainPath.findIndex(s => s.id === token.position);
    if (absoluteCurrentPos < 0) {
        // This means token.position is likely a start position like path_1, path_14 etc.
        // We need to find the correct index based on the player's start
        absoluteCurrentPos = BOARD_SETUP.mainPath.findIndex(s => s.id === token.position);
    }
    
    const playerPathOffset = BOARD_SETUP.mainPath.findIndex(s => s.id === playerInfo.startPosition);

    // Normalize current position to be relative to player's own starting point, accounting for wrap-around
    let relativeCurrentPos = (absoluteCurrentPos - playerPathOffset + mainPathLength) % mainPathLength;
    let relativeTargetPos = relativeCurrentPos + diceRoll;

    // If target position is beyond main path (i.e., entering home path)
    if (relativeTargetPos >= mainPathLength) {
      const homePathStep = relativeTargetPos - mainPathLength;
      if (homePathStep < playerInfo.homePath.length) {
        targetPositionId = playerInfo.homePath[homePathStep];
      } else if (homePathStep === playerInfo.homePath.length) {
        targetPositionId = playerInfo.finishPosition;
      }
    } else {
      // Still on main path, calculate actual path_X ID
      const actualTargetPathIndex = (playerPathOffset + relativeTargetPos) % mainPathLength;
      targetPositionId = BOARD_SETUP.mainPath[actualTargetPathIndex].id;
    }

  } else { // On home path or going to finish
    const homePathIdx = playerInfo.homePath.indexOf(token.position);
    const targetHomePathIdx = homePathIdx + diceRoll;

    if (targetHomePathIdx < playerInfo.homePath.length) {
      targetPositionId = playerInfo.homePath[targetHomePathIdx];
    } else if (targetHomePathIdx === playerInfo.homePath.length) {
      targetPositionId = playerInfo.finishPosition;
    }
  }

  if (targetPositionId) {
    // Check if target position is blocked by own token (unless it's a finish position)
    const isTargetBlockedByOwnToken = player.tokens.some(
      t => t.position === targetPositionId && t.id !== token.id && t.position !== playerInfo.finishPosition
    );
    if (!isTargetBlockedByOwnToken) {
      possibleMoves.push(targetPositionId);
    }
  }

  return possibleMoves;
}

export function applyMove(allPlayers, currentPlayerIndex, tokenIndex, diceRoll, targetPosition) {
  const updatedPlayers = JSON.parse(JSON.stringify(allPlayers)); // Deep copy
  const currentPlayer = updatedPlayers[currentPlayerIndex];
  const playerInfo = PLAYER_COLORS[currentPlayer.color];
  let message = '';

  // Move the token
  const tokenToMove = currentPlayer.tokens[tokenIndex];
  tokenToMove.position = targetPosition;

  // Check for eating (only if on main path and not a safe square)
  if (targetPosition.startsWith('path_') && !BOARD_SETUP.safeSquares.includes(targetPosition)) {
    for (const opponentPlayer of updatedPlayers) {
      if (opponentPlayer.id === currentPlayer.id) continue;
      const eatenTokenIndex = opponentPlayer.tokens.findIndex(t => t.position === targetPosition);
      if (eatenTokenIndex !== -1) {
        opponentPlayer.tokens[eatenTokenIndex].position = 'base';
        message = `${currentPlayer.color} ate ${opponentPlayer.color}'s token!`;
        break;
      }
    }
  }

  // Check for finishing
  if (targetPosition === playerInfo.finishPosition) {
    currentPlayer.finishedTokens++;
    message = `${currentPlayer.color} token finished!`;
  }

  // Determine next player
  let nextPlayerIndex = currentPlayerIndex;
  if (diceRoll !== 6) {
    nextPlayerIndex = (currentPlayerIndex + 1) % updatedPlayers.length;
  }

  // Check win condition
  const isWinner = currentPlayer.finishedTokens === 4;
  if (isWinner) {
    message = `${currentPlayer.color} WINS!`;
  }

  return { updatedPlayers, nextPlayerIndex, message, isWinner };
}