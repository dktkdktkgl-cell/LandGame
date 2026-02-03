import { GAME_CONSTANTS } from '../utils/gameConstants.js';
import BuildingService from './BuildingService.js';
import TroopService from './TroopService.js';
import GameService from './GameService.js';

class TimerService {
  constructor() {
    this.activeGames = new Map(); // gameId -> { intervals, io }
  }

  // 게임 타이머 시작
  startGameTimers(gameId, io) {
    if (this.activeGames.has(gameId)) {
      console.log(`⚠️  Timers already running for game ${gameId}`);
      return;
    }

    console.log(`⏰ Starting timers for game ${gameId}`);

    const intervals = {
      goldProduction: null,
      troopProduction: null,
      troopMovement: null,
      occupation: null,
      victory: null
    };

    // 금 생산 타이머 (1초마다)
    intervals.goldProduction = setInterval(async () => {
      try {
        const updates = await BuildingService.produceGold(gameId);
        if (updates.length > 0) {
          io.to(gameId).emit('goldProduced', { updates });
        }
      } catch (error) {
        console.error('Gold production error:', error.message);
      }
    }, GAME_CONSTANTS.GOLD_PRODUCTION_INTERVAL);

    // 군인 생산 타이머 (2초마다)
    intervals.troopProduction = setInterval(async () => {
      try {
        const updates = await BuildingService.produceTroops(gameId);
        if (updates.length > 0) {
          io.to(gameId).emit('troopsProduced', { updates });
        }
      } catch (error) {
        console.error('Troop production error:', error.message);
      }
    }, GAME_CONSTANTS.TROOP_PRODUCTION_INTERVAL);

    // 군인 이동 처리 (1초마다 체크)
    intervals.troopMovement = setInterval(async () => {
      try {
        const arrivals = await TroopService.processTroopArrivals(gameId);
        if (arrivals.length > 0) {
          io.to(gameId).emit('troopsArrived', { arrivals });
        }
      } catch (error) {
        console.error('Troop movement error:', error.message);
      }
    }, GAME_CONSTANTS.GAME_TICK_INTERVAL);

    // 땅 점령 체크 (1초마다)
    intervals.occupation = setInterval(async () => {
      try {
        const occupations = await TroopService.checkOccupations(gameId);
        if (occupations.length > 0) {
          io.to(gameId).emit('landOccupied', { occupations });
        }
      } catch (error) {
        console.error('Occupation check error:', error.message);
      }
    }, GAME_CONSTANTS.GAME_TICK_INTERVAL);

    // 승리 조건 체크 (5초마다)
    intervals.victory = setInterval(async () => {
      try {
        const result = await GameService.checkVictoryCondition(gameId);
        if (result.hasWinner) {
          io.to(gameId).emit('gameEnded', {
            winner: result.winner,
            players: result.players
          });

          // 게임 종료 - 타이머 중지
          this.stopGameTimers(gameId);
        }
      } catch (error) {
        console.error('Victory check error:', error.message);
      }
    }, GAME_CONSTANTS.VICTORY_CHECK_INTERVAL);

    this.activeGames.set(gameId, { intervals, io });
  }

  // 게임 타이머 중지
  stopGameTimers(gameId) {
    const gameData = this.activeGames.get(gameId);
    if (!gameData) {
      console.log(`⚠️  No timers found for game ${gameId}`);
      return;
    }

    console.log(`⏹️  Stopping timers for game ${gameId}`);

    const { intervals } = gameData;
    Object.values(intervals).forEach(interval => {
      if (interval) clearInterval(interval);
    });

    this.activeGames.delete(gameId);
  }

  // 모든 타이머 중지
  stopAllTimers() {
    console.log('⏹️  Stopping all game timers');
    for (const gameId of this.activeGames.keys()) {
      this.stopGameTimers(gameId);
    }
  }
}

export default new TimerService();
