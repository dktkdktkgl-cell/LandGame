// 게임 상수 (서버와 동일하게 유지)
export const GAME_CONSTANTS = {
  GRID_SIZE: 20,
  MIN_PLAYERS: 1,
  MAX_PLAYERS: 4,

  // 타이머 (밀리초)
  GOLD_PRODUCTION_INTERVAL: 1000,
  TROOP_PRODUCTION_INTERVAL: 2000,
  TROOP_MOVEMENT_TIME: 10000,
  LAND_OCCUPATION_TIME: 30000,

  // 비용
  LAND_CLAIM_COST: 10,

  // 생산량
  TROOPS_PER_CAMP: 1,
  GOLD_PER_MINE: 1,

  // 승리 조건
  VICTORY_LAND_COUNT: 200,

  // 건물 타입
  BUILDING_TYPES: {
    CAMP: 'camp',
    MINE: 'mine'
  },

  // 게임 상태
  GAME_STATUS: {
    WAITING: 'waiting',
    PLAYING: 'playing',
    FINISHED: 'finished'
  }
};

// Canvas 렌더링 상수
export const CANVAS_CONSTANTS = {
  TILE_SIZE: 30,
  GRID_PADDING: 10,
  FONT_SIZE: 12
};
