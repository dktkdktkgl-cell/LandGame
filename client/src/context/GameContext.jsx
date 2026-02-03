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
    socket.on('buildingBuilt', ({ x, y, buildingType, playerId, has_camp, has_mine }) => {
      setGameState(prev => {
        const newTiles = prev.tiles.map(tile => {
          if (tile.x === x && tile.y === y) {
            return { ...tile, has_camp, has_mine };
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
      setGameState(prev => {
        if (!prev) return prev;

        const newTiles = [...prev.tiles];
        const newPlayers = [...prev.players];

        arrivals.forEach(arrival => {
          // 타일 찾기 또는 생성
          let tileIndex = newTiles.findIndex(t => t.x === arrival.x && t.y === arrival.y);

          if (arrival.type === 'occupation_success') {
            // 점령 성공
            if (tileIndex === -1) {
              // 새 타일 생성
              newTiles.push({
                x: arrival.x,
                y: arrival.y,
                owner_id: arrival.playerId,
                troop_count: arrival.troopCount,
                has_camp: false,
                has_mine: false
              });
            } else {
              // 기존 타일 업데이트
              newTiles[tileIndex] = {
                ...newTiles[tileIndex],
                owner_id: arrival.playerId,
                troop_count: arrival.troopCount
              };
            }

            // 플레이어 땅 개수 업데이트
            const playerIndex = newPlayers.findIndex(p => p.id === arrival.playerId);
            if (playerIndex !== -1) {
              const landCount = newTiles.filter(t => t.owner_id === arrival.playerId).length;
              newPlayers[playerIndex] = {
                ...newPlayers[playerIndex],
                land_count: landCount
              };
            }
          } else if (arrival.type === 'merge') {
            // 자신의 땅에 합류
            if (tileIndex !== -1) {
              newTiles[tileIndex] = {
                ...newTiles[tileIndex],
                troop_count: newTiles[tileIndex].troop_count + arrival.troopCount
              };
            }
          } else if (arrival.type === 'combat') {
            // 전투 결과 반영
            if (tileIndex !== -1) {
              newTiles[tileIndex] = {
                ...newTiles[tileIndex],
                troop_count: arrival.defenderSurvivors || 0,
                owner_id: arrival.winner === arrival.defenderId ? arrival.defenderId :
                         (arrival.attackerSurvivors > 0 ? arrival.attackerId : newTiles[tileIndex].owner_id)
              };
            }
          }
        });

        return { ...prev, tiles: newTiles, players: newPlayers };
      });
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
