-- 복수 건물 지원: building_type을 has_camp, has_mine으로 변경

-- 기존 building_type 데이터 백업 및 변환
ALTER TABLE tiles ADD COLUMN has_camp BOOLEAN DEFAULT FALSE;
ALTER TABLE tiles ADD COLUMN has_mine BOOLEAN DEFAULT FALSE;

-- 기존 데이터 마이그레이션
UPDATE tiles SET has_camp = TRUE WHERE building_type = 'camp';
UPDATE tiles SET has_mine = TRUE WHERE building_type = 'mine';

-- 기존 컬럼 삭제
ALTER TABLE tiles DROP COLUMN building_type;
