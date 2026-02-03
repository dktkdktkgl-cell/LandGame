import GameService from '../services/GameService.js';
import BuildingService from '../services/BuildingService.js';
import TroopService from '../services/TroopService.js';
import TimerService from '../services/TimerService.js';

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);
    const sessionId = socket.request.session.id;

    // 게임 참여
    socket.on('joinGame', async ({ gameId }) => {
      try {
        const { player, isNew } = await GameService.joinGame(sessionId, gameId);
        const actualGameId = player.game_id;

        // Socket을 게임 룸에 참여
        socket.join(actualGameId);

        // 게임 상태 전송
        const gameState = await GameService.getGameState(actualGameId);

        socket.emit('joinedGame', {
          player,
          gameState,
          isNew
        });

        // 다른 플레이어들에게 알림
        if (isNew) {
          socket.to(actualGameId).emit('playerJoined', { player });
        }
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // 게임 시작
    socket.on('startGame', async ({ gameId }) => {
      try {
        const result = await GameService.startGame(gameId);

        // 게임 상태 전송
        const gameState = await GameService.getGameState(gameId);

        io.to(gameId).emit('gameStarted', {
          players: result.players,
          gameState
        });

        // 타이머 시작
        TimerService.startGameTimers(gameId, io);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // 건물 건설
    socket.on('buildBuilding', async ({ gameId, x, y, buildingType }) => {
      try {
        // 플레이어 ID 조회
        const playerResult = await GameService.joinGame(sessionId, gameId);
        const playerId = playerResult.player.id;

        const result = await BuildingService.buildBuilding(gameId, playerId, x, y, buildingType);

        // 모든 플레이어에게 알림
        io.to(gameId).emit('buildingBuilt', {
          x,
          y,
          buildingType,
          playerId
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // 군인 이동
    socket.on('moveTroops', async ({ gameId, fromX, fromY, toX, toY, troopCount }) => {
      try {
        // 플레이어 ID 조회
        const playerResult = await GameService.joinGame(sessionId, gameId);
        const playerId = playerResult.player.id;

        const result = await TroopService.moveTroops(gameId, playerId, fromX, fromY, toX, toY, troopCount);

        // 모든 플레이어에게 알림
        io.to(gameId).emit('troopsMoved', {
          fromX,
          fromY,
          toX,
          toY,
          troopCount,
          playerId,
          arriveAt: result.movement.arrive_at
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // 게임 상태 조회
    socket.on('getGameState', async ({ gameId }) => {
      try {
        const gameState = await GameService.getGameState(gameId);
        socket.emit('gameState', { gameState });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // 연결 해제
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
}
