import React, { useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import GameRenderer from '../../services/gameRenderer';

function GameBoard() {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const { gameState, selectedTile, setSelectedTile } = useGame();

  // Canvas 초기화
  useEffect(() => {
    if (canvasRef.current) {
      rendererRef.current = new GameRenderer(canvasRef.current);
    }
  }, []);

  // 게임 상태 변경 시 렌더링
  useEffect(() => {
    if (rendererRef.current && gameState) {
      rendererRef.current.render(gameState.tiles, gameState.players, selectedTile);
    }
  }, [gameState, selectedTile]);

  // Canvas 클릭 이벤트
  const handleCanvasClick = (event) => {
    if (!rendererRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const pixelX = event.clientX - rect.left;
    const pixelY = event.clientY - rect.top;

    const tile = rendererRef.current.pixelToTile(pixelX, pixelY);
    if (tile) {
      setSelectedTile(tile);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
    />
  );
}

export default GameBoard;
