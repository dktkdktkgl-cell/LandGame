import React from 'react';

function PlayerList({ players, currentPlayer }) {
  return (
    <div className="player-list">
      <h3>참여 중인 플레이어</h3>
      {players.map((player) => (
        <div key={player.id} className="player-item">
          <div
            className="player-color"
            style={{ backgroundColor: player.color }}
          ></div>
          <span>{player.player_name}</span>
          {player.id === currentPlayer.id && <strong>(나)</strong>}
        </div>
      ))}
    </div>
  );
}

export default PlayerList;
