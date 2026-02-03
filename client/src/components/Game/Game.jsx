import React from 'react';
import { useGame } from '../../context/GameContext';
import GameBoard from './GameBoard';
import PlayerInfo from './PlayerInfo';
import GameControls from './GameControls';
import GameStatus from './GameStatus';
import { GAME_CONSTANTS } from '../../utils/constants';

function Game() {
  const { gameState, currentPlayer } = useGame();

  if (!gameState || !currentPlayer) {
    return <div>Loading...</div>;
  }

  const isGameFinished = gameState.game.status === GAME_CONSTANTS.GAME_STATUS.FINISHED;

  return (
    <div className="game-container">
      <div className="sidebar">
        <PlayerInfo />
      </div>

      <div className="game-board-container">
        <GameStatus />
        <GameBoard />
      </div>

      <div className="sidebar">
        <GameControls />
      </div>

      {isGameFinished && (
        <div className="victory-screen">
          <div className="victory-content">
            <h1>🎉 게임 종료!</h1>
            {gameState.game.winner_id === currentPlayer.id ? (
              <h2>🏆 승리!</h2>
            ) : (
              <h2>패배...</h2>
            )}

            <div className="player-ranking">
              <h3>최종 순위</h3>
              {gameState.players
                .sort((a, b) => b.land_count - a.land_count)
                .map((player, index) => (
                  <div key={player.id} className="ranking-item">
                    <span>#{index + 1}</span>
                    <div
                      className="player-color"
                      style={{ backgroundColor: player.color }}
                    ></div>
                    <span>{player.player_name}</span>
                    <span>{player.land_count} 칸</span>
                  </div>
                ))}
            </div>

            <button onClick={() => window.location.reload()}>
              새 게임 시작
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game;
