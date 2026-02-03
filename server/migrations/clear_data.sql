-- 기존 데이터 초기화
TRUNCATE TABLE game_events, troop_movements, tiles, players, games CASCADE;

-- 게임 ID 시퀀스 초기화 (있다면)
-- TRUNCATE는 자동으로 SERIAL 타입의 시퀀스를 초기화하지 않음
ALTER SEQUENCE IF EXISTS tiles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS troop_movements_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS game_events_id_seq RESTART WITH 1;
