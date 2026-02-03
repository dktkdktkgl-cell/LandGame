import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import GameLobby from './components/Lobby/GameLobby';
import Game from './components/Game/Game';
import { GAME_CONSTANTS } from './utils/constants';
import './App.css';

function AppContent() {
  const { gameState, connected, error } = useGame();

  if (!connected) {
    return (
      <div className="loading">
        <h2>🔄 서버에 연결 중...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h2>❌오류: {error}</h2>
      </div>
    );
  }

  if (!gameState || gameState.game.status === GAME_CONSTANTS.GAME_STATUS.WAITING) {
    return <GameLobby />;
  }

  return <Game />;
}

function App() {
  return (
    <GameProvider>
      <div className="App">
        <AppContent />
      </div>
    </GameProvider>
  );
}

export default App;
