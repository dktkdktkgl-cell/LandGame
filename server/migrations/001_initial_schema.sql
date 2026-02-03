-- LandGame Database Schema

-- 게임 세션 테이블
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- 'waiting', 'playing', 'finished'
    grid_size INTEGER DEFAULT 20,
    max_players INTEGER DEFAULT 4,
    winner_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    ended_at TIMESTAMP
);

-- 플레이어 테이블
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    player_name VARCHAR(50),
    color VARCHAR(20),
    gold INTEGER DEFAULT 0,
    land_count INTEGER DEFAULT 1,
    joined_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(game_id, session_id)
);

-- 타일 (땅) 테이블
CREATE TABLE IF NOT EXISTS tiles (
    id SERIAL PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    owner_id UUID REFERENCES players(id) ON DELETE SET NULL,
    building_type VARCHAR(20), -- NULL, 'camp', 'mine'
    troop_count INTEGER DEFAULT 0,
    occupation_started_at TIMESTAMP, -- 점령 시도 시작 시간
    UNIQUE(game_id, x, y)
);

-- 군인 이동 큐 테이블
CREATE TABLE IF NOT EXISTS troop_movements (
    id SERIAL PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    from_x INTEGER NOT NULL,
    from_y INTEGER NOT NULL,
    to_x INTEGER NOT NULL,
    to_y INTEGER NOT NULL,
    troop_count INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'moving', -- 'moving', 'arrived', 'cancelled'
    started_at TIMESTAMP DEFAULT NOW(),
    arrive_at TIMESTAMP NOT NULL
);

-- 게임 이벤트 로그 (디버깅용)
CREATE TABLE IF NOT EXISTS game_events (
    id SERIAL PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    event_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_tiles_game ON tiles(game_id);
CREATE INDEX IF NOT EXISTS idx_tiles_owner ON tiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_tiles_coords ON tiles(game_id, x, y);
CREATE INDEX IF NOT EXISTS idx_players_game ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_players_session ON players(session_id);
CREATE INDEX IF NOT EXISTS idx_movements_game ON troop_movements(game_id);
CREATE INDEX IF NOT EXISTS idx_movements_arrive ON troop_movements(arrive_at);
CREATE INDEX IF NOT EXISTS idx_movements_status ON troop_movements(status);
