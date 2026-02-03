import { GAME_CONSTANTS, CANVAS_CONSTANTS } from '../utils/constants';

class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileSize = CANVAS_CONSTANTS.TILE_SIZE;
    this.gridSize = GAME_CONSTANTS.GRID_SIZE;
    this.selectedTile = null;

    // Canvas 크기 설정
    const canvasSize = this.tileSize * this.gridSize + CANVAS_CONSTANTS.GRID_PADDING * 2;
    this.canvas.width = canvasSize;
    this.canvas.height = canvasSize;
  }

  // 전체 게임 렌더링
  render(tiles, players, selectedTile) {
    this.selectedTile = selectedTile;
    this.clear();
    this.drawGrid();
    this.drawTiles(tiles, players);
    this.drawSelectedTile();
  }

  // Canvas 초기화
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // 그리드 라인 그리기
  drawGrid() {
    const padding = CANVAS_CONSTANTS.GRID_PADDING;
    this.ctx.strokeStyle = '#444';
    this.ctx.lineWidth = 1;

    for (let i = 0; i <= this.gridSize; i++) {
      // 세로선
      this.ctx.beginPath();
      this.ctx.moveTo(padding + i * this.tileSize, padding);
      this.ctx.lineTo(padding + i * this.tileSize, padding + this.gridSize * this.tileSize);
      this.ctx.stroke();

      // 가로선
      this.ctx.beginPath();
      this.ctx.moveTo(padding, padding + i * this.tileSize);
      this.ctx.lineTo(padding + this.gridSize * this.tileSize, padding + i * this.tileSize);
      this.ctx.stroke();
    }
  }

  // 타일 그리기
  drawTiles(tiles, players) {
    const padding = CANVAS_CONSTANTS.GRID_PADDING;

    // 먼저 빈 타일 그리기
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const tile = tiles.find(t => t.x === x && t.y === y);
        if (!tile || !tile.owner_id) {
          this.ctx.fillStyle = '#2a2a3e';
          this.ctx.fillRect(
            padding + x * this.tileSize + 1,
            padding + y * this.tileSize + 1,
            this.tileSize - 2,
            this.tileSize - 2
          );
        }
      }
    }

    // 소유된 타일 그리기
    tiles.forEach(tile => {
      if (tile.owner_id) {
        const player = players.find(p => p.id === tile.owner_id);
        if (player) {
          // 타일 색상
          this.ctx.fillStyle = player.color;
          this.ctx.fillRect(
            padding + tile.x * this.tileSize + 1,
            padding + tile.y * this.tileSize + 1,
            this.tileSize - 2,
            this.tileSize - 2
          );
        }
      }

      // 건물 그리기
      if (tile.building_type) {
        const centerX = padding + tile.x * this.tileSize + this.tileSize / 2;
        const centerY = padding + tile.y * this.tileSize + this.tileSize / 2;

        if (tile.building_type === GAME_CONSTANTS.BUILDING_TYPES.CAMP) {
          // 군인캠프 (삼각형)
          this.ctx.fillStyle = '#ff6b6b';
          this.ctx.beginPath();
          this.ctx.moveTo(centerX, centerY - 8);
          this.ctx.lineTo(centerX - 8, centerY + 8);
          this.ctx.lineTo(centerX + 8, centerY + 8);
          this.ctx.closePath();
          this.ctx.fill();
        } else if (tile.building_type === GAME_CONSTANTS.BUILDING_TYPES.MINE) {
          // 광산 (사각형)
          this.ctx.fillStyle = '#ffd700';
          this.ctx.fillRect(centerX - 8, centerY - 8, 16, 16);
        }
      }

      // 군인 수 표시
      if (tile.troop_count > 0) {
        const centerX = padding + tile.x * this.tileSize + this.tileSize / 2;
        const centerY = padding + tile.y * this.tileSize + this.tileSize / 2;

        this.ctx.fillStyle = '#fff';
        this.ctx.font = `bold ${CANVAS_CONSTANTS.FONT_SIZE}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(tile.troop_count, centerX, centerY + (tile.building_type ? 12 : 0));
      }
    });
  }

  // 선택된 타일 하이라이트
  drawSelectedTile() {
    if (!this.selectedTile) return;

    const padding = CANVAS_CONSTANTS.GRID_PADDING;
    this.ctx.strokeStyle = '#4ecdc4';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(
      padding + this.selectedTile.x * this.tileSize,
      padding + this.selectedTile.y * this.tileSize,
      this.tileSize,
      this.tileSize
    );
  }

  // 픽셀 좌표를 타일 좌표로 변환
  pixelToTile(pixelX, pixelY) {
    const padding = CANVAS_CONSTANTS.GRID_PADDING;
    const x = Math.floor((pixelX - padding) / this.tileSize);
    const y = Math.floor((pixelY - padding) / this.tileSize);

    if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
      return { x, y };
    }

    return null;
  }
}

export default GameRenderer;
