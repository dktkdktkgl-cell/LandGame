import React, { useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import GameRenderer from '../../services/gameRenderer';

function GameBoard() {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const { gameState, selectedTile, setSelectedTile, pendingMovement, setPendingMovement } = useGame();

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

  // 애니메이션을 위한 지속적인 렌더링
  useEffect(() => {
    if (!rendererRef.current || !gameState) return;

    let animationId;
    const renderLoop = () => {
      if (rendererRef.current && gameState) {
        rendererRef.current.render(gameState.tiles, gameState.players, selectedTile);
      }
      animationId = requestAnimationFrame(renderLoop);
    };

    animationId = requestAnimationFrame(renderLoop);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [gameState, selectedTile]);

  // 군인 이동 애니메이션 시작
  useEffect(() => {
    if (!pendingMovement || !rendererRef.current || !gameState) return;

    const player = gameState.players.find(p => p.id === pendingMovement.playerId);
    if (player) {
      rendererRef.current.startTroopMovement(
        pendingMovement.fromX,
        pendingMovement.fromY,
        pendingMovement.toX,
        pendingMovement.toY,
        pendingMovement.troopCount,
        player.color
      );
    }

    // 애니메이션 처리 완료
    setPendingMovement(null);
  }, [pendingMovement, gameState, setPendingMovement]);

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
