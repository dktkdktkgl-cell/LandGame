import React, { useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import socketService from '../../services/socketService';
import PlayerList from './PlayerList';
import { GAME_CONSTANTS } from '../../utils/constants';

function GameLobby() {
  const { gameState, currentPlayer } = useGame();

  useEffect(() => {
    // 컴포넌트 마운트 시 게임 참여
    if (!currentPlayer) {
      socketService.joinGame(null);
    }
  }, [currentPlayer]);

  const handleStartGame = () => {
    if (gameState && gameState.game) {
      socketService.startGame(gameState.game.id);
    }
  };

  if (!gameState || !currentPlayer) {
    return (
      <div className="lobby-container">
        <h1>🎮 LandGame</h1>
        <p>게임에 참여 중...</p>
      </div>
    );
  }

  const playerCount = gameState.players.length;
  const canStart = playerCount >= GAME_CONSTANTS.MIN_PLAYERS && playerCount <= GAME_CONSTANTS.MAX_PLAYERS;

  return (
    <div className="lobby-container">
      <h1>🎮 LandGame</h1>

      <div className="game-info">
        <p>게임 ID: <strong>{gameState.game.id}</strong></p>
        <p>플레이어: <strong>{playerCount}/{GAME_CONSTANTS.MAX_PLAYERS}</strong></p>
      </div>

      <PlayerList players={gameState.players} currentPlayer={currentPlayer} />

      <div className="lobby-buttons">
        <button
          onClick={handleStartGame}
          disabled={!canStart}
        >
          {canStart
            ? '게임 시작'
            : `플레이어 ${GAME_CONSTANTS.MIN_PLAYERS}-${GAME_CONSTANTS.MAX_PLAYERS}명 필요`
          }
        </button>
      </div>

      <div className="game-rules">
        <h3>📋 게임 규칙</h3>
        <ul>
          <li>🌍 서버: 중간세계 1</li>
          <li>20x20 그리드에서 땅을 차지하세요</li>
          <li>군인캠프: 2초마다 군인 1명 생산</li>
          <li>광산: 1초마다 금 1개 생산</li>
          <li>군인 이동: 10초 소요</li>
          <li>땅 점령: 빈 땅 도착 즉시 (금 10개 필요)</li>
          <li>승리 조건: 200칸 이상 점령</li>
        </ul>
      </div>
    </div>
  );
}

export default GameLobby;
