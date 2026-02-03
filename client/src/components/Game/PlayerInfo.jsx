import React from 'react';
import { useGame } from '../../context/GameContext';

function PlayerInfo() {
  const { gameState, currentPlayer } = useGame();

  if (!gameState || !currentPlayer) return null;

  const player = gameState.players.find(p => p.id === currentPlayer.id);
  if (!player) return null;

  return (
    <div className="player-info">
      <h3>내 정보</h3>

      <div className="player-info-item">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            className="player-color"
            style={{ backgroundColor: player.color }}
          ></div>
          <span>{player.player_name}</span>
        </div>
      </div>

      <div className="player-info-item">
        <span>💰 금:</span>
        <strong>{player.gold}</strong>
      </div>

      <div className="player-info-item">
        <span>🏠 땅:</span>
        <strong>{player.land_count}</strong>
      </div>

      <h3 style={{ marginTop: '1.5rem' }}>모든 플레이어</h3>
      {gameState.players
        .sort((a, b) => b.land_count - a.land_count)
        .map((p) => (
          <div key={p.id} className="player-info-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                className="player-color"
                style={{ backgroundColor: p.color }}
              ></div>
              <span>{p.player_name}</span>
            </div>
            <span>{p.land_count} 칸</span>
          </div>
        ))}
    </div>
  );
}

export default PlayerInfo;
