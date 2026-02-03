import pool from '../config/database.js';
import { GAME_CONSTANTS } from '../utils/gameConstants.js';
import { v4 as uuidv4 } from 'uuid';

class GameService {
  // 새 게임 생성
  async createGame() {
    const result = await pool.query(
      `INSERT INTO games (status, grid_size, max_players)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [GAME_CONSTANTS.GAME_STATUS.WAITING, GAME_CONSTANTS.GRID_SIZE, GAME_CONSTANTS.MAX_PLAYERS]
    );

    return result.rows[0];
  }

  // 게임 참여
  async joinGame(sessionId, gameId = null) {
    // 이미 게임에 참여 중인지 확인
    const existingPlayer = await pool.query(
      'SELECT * FROM players WHERE session_id = $1 AND is_active = true',
      [sessionId]
    );

    if (existingPlayer.rows.length > 0) {
      return { player: existingPlayer.rows[0], isNew: false };
    }

    // 게임 ID가 없으면 새 게임 생성
    let game;
    if (!gameId) {
      game = await this.createGame();
      gameId = game.id;
    } else {
      const gameResult = await pool.query('SELECT * FROM games WHERE id = $1', [gameId]);
      if (gameResult.rows.length === 0) {
        throw new Error('Game not found');
      }
      game = gameResult.rows[0];
    }

    // 게임이 대기 중인지 확인
    if (game.status !== GAME_CONSTANTS.GAME_STATUS.WAITING) {
      throw new Error('Game already started');
    }

    // 게임의 현재 플레이어 수 확인
    const playerCount = await pool.query(
      'SELECT COUNT(*) FROM players WHERE game_id = $1 AND is_active = true',
      [gameId]
    );

    if (parseInt(playerCount.rows[0].count) >= GAME_CONSTANTS.MAX_PLAYERS) {
      throw new Error('Game is full');
    }

    // 플레이어 색상 할당
    const existingColors = await pool.query(
      'SELECT color FROM players WHERE game_id = $1',
      [gameId]
    );
    const usedColors = existingColors.rows.map(row => row.color);
    const availableColor = GAME_CONSTANTS.PLAYER_COLORS.find(c => !usedColors.includes(c));

    // 플레이어 생성
    const playerResult = await pool.query(
      `INSERT INTO players (game_id, session_id, player_name, color, gold)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [gameId, sessionId, `Player ${playerCount.rows[0].count + 1}`, availableColor, GAME_CONSTANTS.INITIAL_GOLD]
    );

    return { player: playerResult.rows[0], isNew: true };
  }

  // 게임 시작
  async startGame(gameId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 게임 상태 확인
      const gameResult = await client.query('SELECT * FROM games WHERE id = $1', [gameId]);
      if (gameResult.rows.length === 0) {
        throw new Error('Game not found');
      }

      const game = gameResult.rows[0];
      if (game.status !== GAME_CONSTANTS.GAME_STATUS.WAITING) {
        throw new Error('Game already started');
      }

      // 플레이어 수 확인
      const playerResult = await client.query(
        'SELECT * FROM players WHERE game_id = $1 AND is_active = true',
        [gameId]
      );

      const playerCount = playerResult.rows.length;
      if (playerCount < GAME_CONSTANTS.MIN_PLAYERS || playerCount > GAME_CONSTANTS.MAX_PLAYERS) {
        throw new Error(`Need ${GAME_CONSTANTS.MIN_PLAYERS}-${GAME_CONSTANTS.MAX_PLAYERS} players to start`);
      }

      // 게임 상태를 'playing'으로 변경
      await client.query(
        'UPDATE games SET status = $1, started_at = NOW() WHERE id = $2',
        [GAME_CONSTANTS.GAME_STATUS.PLAYING, gameId]
      );

      // 각 플레이어에게 랜덤 시작 위치 할당
      const gridSize = GAME_CONSTANTS.GRID_SIZE;
      const players = playerResult.rows;

      for (const player of players) {
        // 랜덤 위치 생성 (겹치지 않도록)
        let x, y, isOccupied;
        do {
          x = Math.floor(Math.random() * gridSize);
          y = Math.floor(Math.random() * gridSize);

          const check = await client.query(
            'SELECT * FROM tiles WHERE game_id = $1 AND x = $2 AND y = $3',
            [gameId, x, y]
          );
          isOccupied = check.rows.length > 0;
        } while (isOccupied);

        // 시작 타일 생성
        await client.query(
          'INSERT INTO tiles (game_id, x, y, owner_id) VALUES ($1, $2, $3, $4)',
          [gameId, x, y, player.id]
        );
      }

      await client.query('COMMIT');

      return { success: true, players: playerResult.rows };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 게임 상태 조회
  async getGameState(gameId) {
    const gameResult = await pool.query('SELECT * FROM games WHERE id = $1', [gameId]);
    if (gameResult.rows.length === 0) {
      throw new Error('Game not found');
    }

    const playersResult = await pool.query(
      'SELECT id, player_name, color, gold, land_count, is_active FROM players WHERE game_id = $1',
      [gameId]
    );

    const tilesResult = await pool.query(
      'SELECT * FROM tiles WHERE game_id = $1',
      [gameId]
    );

    return {
      game: gameResult.rows[0],
      players: playersResult.rows,
      tiles: tilesResult.rows
    };
  }

  // 승리 조건 체크
  async checkVictoryCondition(gameId) {
    const playersResult = await pool.query(
      `SELECT p.id, p.player_name, p.color, COUNT(t.id) as land_count
       FROM players p
       LEFT JOIN tiles t ON t.owner_id = p.id
       WHERE p.game_id = $1 AND p.is_active = true
       GROUP BY p.id
       ORDER BY land_count DESC`,
      [gameId]
    );

    const players = playersResult.rows;
    const winner = players.find(p => parseInt(p.land_count) >= GAME_CONSTANTS.VICTORY_LAND_COUNT);

    if (winner) {
      // 게임 종료
      await pool.query(
        'UPDATE games SET status = $1, ended_at = NOW(), winner_id = $2 WHERE id = $3',
        [GAME_CONSTANTS.GAME_STATUS.FINISHED, winner.id, gameId]
      );

      return { hasWinner: true, winner, players };
    }

    return { hasWinner: false, players };
  }

  // 플레이어 정보 업데이트
  async updatePlayerGold(playerId, goldAmount) {
    await pool.query(
      'UPDATE players SET gold = gold + $1 WHERE id = $2',
      [goldAmount, playerId]
    );
  }

  async updatePlayerLandCount(playerId) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM tiles WHERE owner_id = $1',
      [playerId]
    );

    await pool.query(
      'UPDATE players SET land_count = $1 WHERE id = $2',
      [result.rows[0].count, playerId]
    );
  }
}

export default new GameService();
