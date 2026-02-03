import React, { createContext, useContext, useState, useEffect } from 'react';
import socketService from '../services/socketService';
import { GAME_CONSTANTS } from '../utils/constants';

const GameContext = createContext();

export function GameProvider({ children }) {
  const [gameState, setGameState] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [connected, setConnected] = useState(false);
  const [selectedTile, setSelectedTile] = useState(null);
  const [actionMode, setActionMode] = useState(null); // 'build', 'moveTroops'
  const [error, setError] = useState(null);
  const [pendingMovement, setPendingMovement] = useState(null); // 애니메이션을 위한 이동 정보

  useEffect(() => {
    const socket = socketService.connect();

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('error', (err) => {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    });

    // 게임 참여 완료
    socket.on('joinedGame', ({ player, gameState: state }) => {
      setCurrentPlayer(player);
      setGameState(state);
    });

    // 게임 시작
    socket.on('gameStarted', ({ players, gameState: state }) => {
      setGameState(state);
    });

    // 플레이어 참여
    socket.on('playerJoined', ({ player }) => {
      setGameState(prev => ({
        ...prev,
        players: [...prev.players, player]
      }));
    });

    // 건물 건설
    socket.on('buildingBuilt', ({ x, y, buildingType, playerId }) => {
      setGameState(prev => {
        const newTiles = prev.tiles.map(tile => {
          if (tile.x === x && tile.y === y) {
            return { ...tile, building_type: buildingType };
          }
          return tile;
        });

        return { ...prev, tiles: newTiles };
      });
    });

    // 군인 이동
    socket.on('troopsMoved', ({ fromX, fromY, toX, toY, troopCount, playerId }) => {
      // 애니메이션을 위한 이동 정보 설정
      setPendingMovement({ fromX, fromY, toX, toY, troopCount, playerId, timestamp: Date.now() });

      setGameState(prev => {
        const newTiles = prev.tiles.map(tile => {
          if (tile.x === fromX && tile.y === fromY) {
            return { ...tile, troop_count: tile.troop_count - troopCount };
          }
          return tile;
        });

        return { ...prev, tiles: newTiles };
      });
    });

    // 금 생산
    socket.on('goldProduced', ({ updates }) => {
      setGameState(prev => {
        const newPlayers = prev.players.map(player => {
          const update = updates.find(u => u.playerId === player.id);
          if (update) {
            return { ...player, gold: player.gold + update.goldAdded };
          }
          return player;
        });

        return { ...prev, players: newPlayers };
      });
    });

    // 군인 생산
    socket.on('troopsProduced', ({ updates }) => {
      setGameState(prev => {
        const newTiles = prev.tiles.map(tile => {
          const update = updates.find(u => u.x === tile.x && u.y === tile.y);
          if (update) {
            return { ...tile, troop_count: tile.troop_count + update.troopsAdded };
          }
          return tile;
        });

        return { ...prev, tiles: newTiles };
      });
    });

    // 군인 도착
    socket.on('troopsArrived', ({ arrivals }) => {
      // 게임 상태 갱신 요청
      if (gameState) {
        socketService.getGameState(gameState.game.id);
      }
    });

    // 땅 점령
    socket.on('landOccupied', ({ occupations }) => {
      // 게임 상태 갱신 요청
      if (gameState) {
        socketService.getGameState(gameState.game.id);
      }
    });

    // 게임 상태 갱신
    socket.on('gameState', ({ gameState: state }) => {
      setGameState(state);
    });

    // 게임 종료
    socket.on('gameEnded', ({ winner, players }) => {
      setGameState(prev => ({
        ...prev,
        game: { ...prev.game, status: GAME_CONSTANTS.GAME_STATUS.FINISHED, winner_id: winner.id },
        players
      }));
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const value = {
    gameState,
    currentPlayer,
    connected,
    selectedTile,
    setSelectedTile,
    actionMode,
    setActionMode,
    error,
    pendingMovement,
    setPendingMovement
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
