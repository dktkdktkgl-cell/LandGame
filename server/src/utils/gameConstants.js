// 게임 상수
export const GAME_CONSTANTS = {
  // 맵 크기
  GRID_SIZE: 15,

  // 플레이어 설정
  MIN_PLAYERS: 1,
  MAX_PLAYERS: 4,
  INITIAL_GOLD: 10,

  // 타이머 (밀리초)
  GOLD_PRODUCTION_INTERVAL: 1000,      // 1초
  TROOP_PRODUCTION_INTERVAL: 2000,     // 2초
  TROOP_MOVEMENT_TIME: 10000,          // 10초
  LAND_OCCUPATION_TIME: 30000,         // 30초
  GAME_TICK_INTERVAL: 1000,            // 1초 (게임 상태 업데이트)
  VICTORY_CHECK_INTERVAL: 5000,        // 5초

  // 비용
  LAND_CLAIM_COST: 0,  // 테스트용: 점령 비용 무료
  CAMP_BUILD_COST: 0,
  MINE_BUILD_COST: 0,

  // 생산량
  TROOPS_PER_CAMP: 1,
  GOLD_PER_MINE: 1,

  // 승리 조건
  VICTORY_LAND_PERCENTAGE: 0.5,        // 50%
  VICTORY_LAND_COUNT: 113,             // 15x15의 50% (112.5 반올림)

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
  },

  // 플레이어 색상
  PLAYER_COLORS: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A']
};
