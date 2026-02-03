import pool from '../config/database.js';
import { GAME_CONSTANTS } from '../utils/gameConstants.js';
import CombatService from './CombatService.js';

class TroopService {
  // 군인 이동 명령
  async moveTroops(gameId, playerId, fromX, fromY, toX, toY, troopCount) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 출발지 타일 조회
      const fromTileResult = await client.query(
        'SELECT * FROM tiles WHERE game_id = $1 AND x = $2 AND y = $3',
        [gameId, fromX, fromY]
      );

      if (fromTileResult.rows.length === 0) {
        throw new Error('Source tile not found');
      }

      const fromTile = fromTileResult.rows[0];

      // 소유권 확인
      if (fromTile.owner_id !== playerId) {
        throw new Error('You do not own this tile');
      }

      // 군인 수 확인
      if (fromTile.troop_count < troopCount) {
        throw new Error('Not enough troops');
      }

      // 같은 타일로 이동 불가
      if (fromX === toX && fromY === toY) {
        throw new Error('Cannot move to the same tile');
      }

      // 도착지가 맵 범위 내인지 확인
      if (toX < 0 || toX >= GAME_CONSTANTS.GRID_SIZE || toY < 0 || toY >= GAME_CONSTANTS.GRID_SIZE) {
        throw new Error('Destination out of bounds');
      }

      // 출발지 군인 감소
      await client.query(
        'UPDATE tiles SET troop_count = troop_count - $1 WHERE id = $2',
        [troopCount, fromTile.id]
      );

      // 이동 명령 생성
      const arriveAt = new Date(Date.now() + GAME_CONSTANTS.TROOP_MOVEMENT_TIME);
      const movementResult = await client.query(
        `INSERT INTO troop_movements (game_id, player_id, from_x, from_y, to_x, to_y, troop_count, arrive_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [gameId, playerId, fromX, fromY, toX, toY, troopCount, arriveAt]
      );

      await client.query('COMMIT');

      return { success: true, movement: movementResult.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 도착한 군인 처리
  async processTroopArrivals(gameId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 도착한 이동 명령 조회
      const arrivalsResult = await client.query(
        `SELECT * FROM troop_movements
         WHERE game_id = $1 AND status = 'moving' AND arrive_at <= NOW()`,
        [gameId]
      );

      const results = [];

      for (const movement of arrivalsResult.rows) {
        // 도착지 타일 조회 또는 생성
        let toTileResult = await client.query(
          'SELECT * FROM tiles WHERE game_id = $1 AND x = $2 AND y = $3',
          [gameId, movement.to_x, movement.to_y]
        );

        let toTile;
        if (toTileResult.rows.length === 0) {
          // 빈 땅인 경우 타일 생성
          const newTileResult = await client.query(
            'INSERT INTO tiles (game_id, x, y, troop_count) VALUES ($1, $2, $3, $4) RETURNING *',
            [gameId, movement.to_x, movement.to_y, 0]
          );
          toTile = newTileResult.rows[0];
        } else {
          toTile = toTileResult.rows[0];
        }

        // 전투 또는 합류 처리
        if (toTile.owner_id && toTile.owner_id !== movement.player_id) {
          // 적 땅 - 전투 발생
          const combatResult = await CombatService.resolveCombat(
            client,
            gameId,
            toTile,
            movement.player_id,
            movement.troop_count
          );

          results.push({
            type: 'combat',
            x: movement.to_x,
            y: movement.to_y,
            ...combatResult
          });
        } else if (toTile.owner_id === movement.player_id) {
          // 자신의 땅 - 군인 합류
          await client.query(
            'UPDATE tiles SET troop_count = troop_count + $1 WHERE id = $2',
            [movement.troop_count, toTile.id]
          );

          results.push({
            type: 'merge',
            x: movement.to_x,
            y: movement.to_y,
            playerId: movement.player_id,
            troopCount: movement.troop_count
          });
        } else {
          // 빈 땅 - 즉시 점령 시도
          // 플레이어의 금 확인
          const playerResult = await client.query(
            'SELECT * FROM players WHERE id = $1',
            [movement.player_id]
          );

          const player = playerResult.rows[0];

          if (player.gold >= GAME_CONSTANTS.LAND_CLAIM_COST) {
            // 금 차감 및 땅 즉시 점령
            await client.query(
              'UPDATE players SET gold = gold - $1 WHERE id = $2',
              [GAME_CONSTANTS.LAND_CLAIM_COST, movement.player_id]
            );

            await client.query(
              'UPDATE tiles SET owner_id = $1, troop_count = $2 WHERE id = $3',
              [movement.player_id, movement.troop_count, toTile.id]
            );

            // 플레이어 땅 개수 업데이트
            await client.query(
              `UPDATE players SET land_count = (
                SELECT COUNT(*) FROM tiles WHERE owner_id = $1
              ) WHERE id = $1`,
              [movement.player_id]
            );

            results.push({
              type: 'occupation_success',
              x: movement.to_x,
              y: movement.to_y,
              playerId: movement.player_id,
              troopCount: movement.troop_count,
              goldCost: GAME_CONSTANTS.LAND_CLAIM_COST
            });
          } else {
            // 금이 부족한 경우 - 군인만 배치 (점령 안 됨)
            await client.query(
              'UPDATE tiles SET troop_count = $1, occupation_started_at = NOW() WHERE id = $2',
              [movement.troop_count, toTile.id]
            );

            results.push({
              type: 'occupation_pending',
              x: movement.to_x,
              y: movement.to_y,
              playerId: movement.player_id,
              troopCount: movement.troop_count,
              reason: 'insufficient_gold'
            });
          }
        }

        // 이동 상태 업데이트
        await client.query(
          'UPDATE troop_movements SET status = $1 WHERE id = $2',
          ['arrived', movement.id]
        );
      }

      await client.query('COMMIT');

      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 땅 점령 체크
  async checkOccupations(gameId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 점령 조건을 만족하는 타일 조회
      const occupationTime = GAME_CONSTANTS.LAND_OCCUPATION_TIME / 1000; // 초 단위
      const tilesResult = await client.query(
        `SELECT t.*, p.gold
         FROM tiles t
         LEFT JOIN players p ON p.game_id = t.game_id
         WHERE t.game_id = $1
           AND t.owner_id IS NULL
           AND t.occupation_started_at IS NOT NULL
           AND t.troop_count > 0
           AND EXTRACT(EPOCH FROM (NOW() - t.occupation_started_at)) >= $2`,
        [gameId, occupationTime]
      );

      const results = [];

      for (const tile of tilesResult.rows) {
        // 해당 타일에 군인을 배치한 플레이어 찾기
        // (troop_movements에서 해당 타일로 이동한 플레이어)
        const movementResult = await client.query(
          `SELECT player_id FROM troop_movements
           WHERE game_id = $1 AND to_x = $2 AND to_y = $3 AND status = 'arrived'
           ORDER BY arrive_at DESC LIMIT 1`,
          [gameId, tile.x, tile.y]
        );

        if (movementResult.rows.length === 0) continue;

        const playerId = movementResult.rows[0].player_id;

        // 플레이어의 금 확인
        const playerResult = await client.query(
          'SELECT * FROM players WHERE id = $1',
          [playerId]
        );

        const player = playerResult.rows[0];

        if (player.gold >= GAME_CONSTANTS.LAND_CLAIM_COST) {
          // 금 차감 및 땅 점령
          await client.query(
            'UPDATE players SET gold = gold - $1 WHERE id = $2',
            [GAME_CONSTANTS.LAND_CLAIM_COST, playerId]
          );

          await client.query(
            'UPDATE tiles SET owner_id = $1, occupation_started_at = NULL WHERE id = $2',
            [playerId, tile.id]
          );

          // 플레이어 땅 개수 업데이트
          await client.query(
            `UPDATE players SET land_count = (
              SELECT COUNT(*) FROM tiles WHERE owner_id = $1
            ) WHERE id = $1`,
            [playerId]
          );

          results.push({
            type: 'occupation_success',
            x: tile.x,
            y: tile.y,
            playerId,
            goldCost: GAME_CONSTANTS.LAND_CLAIM_COST
          });
        } else {
          // 금이 부족한 경우 점령 실패
          await client.query(
            'UPDATE tiles SET occupation_started_at = NULL, troop_count = 0 WHERE id = $1',
            [tile.id]
          );

          results.push({
            type: 'occupation_failed',
            x: tile.x,
            y: tile.y,
            playerId,
            reason: 'insufficient_gold'
          });
        }
      }

      await client.query('COMMIT');

      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new TroopService();
