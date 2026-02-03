import pool from '../config/database.js';
import { GAME_CONSTANTS } from '../utils/gameConstants.js';

class BuildingService {
  // 건물 건설
  async buildBuilding(gameId, playerId, x, y, buildingType) {
    // 타일 조회
    const tileResult = await pool.query(
      'SELECT * FROM tiles WHERE game_id = $1 AND x = $2 AND y = $3',
      [gameId, x, y]
    );

    if (tileResult.rows.length === 0) {
      throw new Error('Tile not found');
    }

    const tile = tileResult.rows[0];

    // 소유권 확인
    if (tile.owner_id !== playerId) {
      throw new Error('You do not own this tile');
    }

    // 건물 타입 검증
    if (!Object.values(GAME_CONSTANTS.BUILDING_TYPES).includes(buildingType)) {
      throw new Error('Invalid building type');
    }

    // 해당 건물이 이미 있는지 확인
    if (buildingType === GAME_CONSTANTS.BUILDING_TYPES.CAMP && tile.has_camp) {
      throw new Error('Camp already exists on this tile');
    }
    if (buildingType === GAME_CONSTANTS.BUILDING_TYPES.MINE && tile.has_mine) {
      throw new Error('Mine already exists on this tile');
    }

    // 건물 건설
    const columnName = buildingType === GAME_CONSTANTS.BUILDING_TYPES.CAMP ? 'has_camp' : 'has_mine';
    await pool.query(
      `UPDATE tiles SET ${columnName} = TRUE WHERE id = $1`,
      [tile.id]
    );

    const updatedTile = { ...tile };
    updatedTile[columnName] = true;

    return { success: true, tile: updatedTile };
  }

  // 금 생산 (모든 광산)
  async produceGold(gameId) {
    const minesResult = await pool.query(
      `SELECT t.*, p.id as player_id
       FROM tiles t
       JOIN players p ON t.owner_id = p.id
       WHERE t.game_id = $1 AND t.has_mine = TRUE`,
      [gameId]
    );

    const updates = [];
    for (const mine of minesResult.rows) {
      await pool.query(
        'UPDATE players SET gold = gold + $1 WHERE id = $2',
        [GAME_CONSTANTS.GOLD_PER_MINE, mine.player_id]
      );

      updates.push({
        playerId: mine.player_id,
        goldAdded: GAME_CONSTANTS.GOLD_PER_MINE
      });
    }

    return updates;
  }

  // 군인 생산 (모든 캠프)
  async produceTroops(gameId) {
    const campsResult = await pool.query(
      `SELECT * FROM tiles
       WHERE game_id = $1 AND has_camp = TRUE`,
      [gameId]
    );

    const updates = [];
    for (const camp of campsResult.rows) {
      await pool.query(
        'UPDATE tiles SET troop_count = troop_count + $1 WHERE id = $2',
        [GAME_CONSTANTS.TROOPS_PER_CAMP, camp.id]
      );

      updates.push({
        tileId: camp.id,
        x: camp.x,
        y: camp.y,
        troopsAdded: GAME_CONSTANTS.TROOPS_PER_CAMP
      });
    }

    return updates;
  }
}

export default new BuildingService();
