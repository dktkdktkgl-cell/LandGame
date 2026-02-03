import React from 'react';
import { useGame } from '../../context/GameContext';
import { GAME_CONSTANTS } from '../../utils/constants';

function GameStatus() {
  const { gameState } = useGame();

  if (!gameState) return null;

  const totalTiles = GAME_CONSTANTS.GRID_SIZE * GAME_CONSTANTS.GRID_SIZE;
  const occupiedTiles = gameState.tiles.filter(t => t.owner_id).length;
  const progressPercentage = (occupiedTiles / totalTiles) * 100;

  return (
    <div className="game-status">
      <h2>🎮 LandGame</h2>
      <p>
        점령된 땅: {occupiedTiles} / {totalTiles} ({progressPercentage.toFixed(1)}%)
      </p>
      <p>
        승리 조건: {GAME_CONSTANTS.VICTORY_LAND_COUNT}칸 점령
      </p>
    </div>
  );
}

export default GameStatus;
