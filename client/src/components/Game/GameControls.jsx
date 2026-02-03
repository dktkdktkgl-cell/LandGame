import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import socketService from '../../services/socketService';
import { GAME_CONSTANTS } from '../../utils/constants';

function GameControls() {
  const { gameState, currentPlayer, selectedTile, setSelectedTile } = useGame();
  const [movementSource, setMovementSource] = useState(null);
  const [movementSourceData, setMovementSourceData] = useState(null);
  const [troopCount, setTroopCount] = useState(1);

  if (!gameState || !currentPlayer) return null;

  const selectedTileData = selectedTile
    ? gameState.tiles.find(t => t.x === selectedTile.x && t.y === selectedTile.y)
    : null;

  const isMyTile = selectedTileData?.owner_id === currentPlayer.id;

  // 이동 가능 여부 (같은 타일이 아니면 이동 가능)
  const canMove = movementSource && selectedTile &&
                  (movementSource.x !== selectedTile.x || movementSource.y !== selectedTile.y);

  // 건물 건설
  const handleBuildBuilding = (buildingType) => {
    if (!selectedTile || !isMyTile) return;

    socketService.buildBuilding(
      gameState.game.id,
      selectedTile.x,
      selectedTile.y,
      buildingType
    );
  };

  // 군인 이동 시작
  const handleStartMovement = () => {
    if (!selectedTile || !isMyTile || !selectedTileData) return;
    setMovementSource(selectedTile);
    setMovementSourceData(selectedTileData);
    setTroopCount(Math.min(selectedTileData.troop_count, 1));
  };

  // 군인 이동 실행
  const handleExecuteMovement = () => {
    if (!canMove) return;

    socketService.moveTroops(
      gameState.game.id,
      movementSource.x,
      movementSource.y,
      selectedTile.x,
      selectedTile.y,
      parseInt(troopCount)
    );

    setMovementSource(null);
    setMovementSourceData(null);
    setTroopCount(1);
  };

  // 군인 이동 취소
  const handleCancelMovement = () => {
    setMovementSource(null);
    setMovementSourceData(null);
    setTroopCount(1);
  };

  return (
    <div className="game-controls">
      <h3>🎮 게임 제어</h3>

      {selectedTile && (
        <div className="building-menu">
          <h4>선택된 타일: ({selectedTile.x}, {selectedTile.y})</h4>

          {selectedTileData && (
            <>
              <p>소유자: {isMyTile ? '나' : '다른 플레이어'}</p>
              {selectedTileData.building_type && (
                <p>
                  건물: {selectedTileData.building_type === GAME_CONSTANTS.BUILDING_TYPES.CAMP ? '군인캠프' : '광산'}
                </p>
              )}
              {selectedTileData.troop_count > 0 && (
                <p>군인: {selectedTileData.troop_count}명</p>
              )}
            </>
          )}

          {!selectedTileData && <p>빈 땅</p>}

          {isMyTile && !selectedTileData?.building_type && (
            <>
              <h4 style={{ marginTop: '1rem' }}>건물 건설</h4>
              <button onClick={() => handleBuildBuilding(GAME_CONSTANTS.BUILDING_TYPES.CAMP)}>
                🏕️ 군인캠프
              </button>
              <button onClick={() => handleBuildBuilding(GAME_CONSTANTS.BUILDING_TYPES.MINE)}>
                ⛏️ 광산
              </button>
            </>
          )}

          {isMyTile && selectedTileData?.troop_count > 0 && !movementSource && (
            <>
              <h4 style={{ marginTop: '1rem' }}>군인 이동</h4>
              <button onClick={handleStartMovement}>
                ➡️ 이동 시작
              </button>
            </>
          )}
        </div>
      )}

      {movementSource && (
        <div className="troop-panel">
          <h4>군인 이동 중</h4>
          <p><strong>출발지:</strong> ({movementSource.x}, {movementSource.y})</p>
          <p><strong>군인:</strong> {movementSourceData?.troop_count || 0}명</p>

          <label>
            이동할 군인 수:
            <input
              type="number"
              min="1"
              max={movementSourceData?.troop_count || 1}
              value={troopCount}
              onChange={(e) => setTroopCount(e.target.value)}
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}
            />
          </label>

          {selectedTile && (
            <>
              <p style={{ marginTop: '0.5rem' }}>
                <strong>도착지:</strong> ({selectedTile.x}, {selectedTile.y})
              </p>
              {!canMove && (
                <p style={{ color: '#ff6b6b', fontSize: '0.9rem' }}>
                  ⚠️ 다른 타일을 선택하세요
                </p>
              )}
            </>
          )}

          <button
            onClick={handleExecuteMovement}
            disabled={!canMove}
            style={{ marginTop: '0.5rem' }}
          >
            ✅ 이동 실행
          </button>
          <button onClick={handleCancelMovement} style={{ background: '#666' }}>
            ❌ 취소
          </button>

          <p style={{ color: '#4ecdc4', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            💡 이동할 타일을 클릭하세요
          </p>
        </div>
      )}
    </div>
  );
}

export default GameControls;
