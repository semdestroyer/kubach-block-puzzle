import { UI_CONFIG, BLOCK_TYPES } from '../core/Constants.js';
import { AssetManager } from './AssetManager.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.assetManager = new AssetManager();
    this.cellSize = UI_CONFIG.GRID_CELL_SIZE;
    this.gridOffsetX = 0;
    this.gridOffsetY = 0;
    this.pieces = [];
    this.dragPiece = null;
    this.dragPieceCell = null;
    this.dragBlockType = null;
    this.dragOffset = { x: 0, y: 0 };
    this.previewPieces = [];
    this.snappedPosition = null;
    this.isValidPlacement = false;
    this.gridSize = 10;
  }

  async init() {
    await this.assetManager.load();
    this.resize();
  }

  resize() {
    const container = this.canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    this.canvas.width = containerWidth;
    this.canvas.height = containerHeight;
    this.cellSize = Math.min(
      (containerWidth - 40) / this.gridSize,
      (containerHeight - 180) / this.gridSize
    );
    
    this.ctx.imageSmoothingEnabled = false;
  }

  setGridSize(size) {
    this.gridSize = size;
    this.resize();
  }

  setCellSize(size) {
    this.cellSize = size;
  }

  clear() {
    this.ctx.fillStyle = '#C6C6C6';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawBlock(x, y, size, blockType, scale = 1) {
    const texture = this.assetManager.getBlockTexture(blockType);
    
    if (texture) {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(x, y, size, size);
      this.ctx.clip();
      
      const drawSize = size * scale;
      this.ctx.drawImage(texture, x - (drawSize - size) / 2, y - (drawSize - size) / 2, drawSize, drawSize);
      this.ctx.restore();
    } else {
      const colors = {
        [BLOCK_TYPES.DIRT]: '#8B5A2B',
        [BLOCK_TYPES.STONE]: '#757575',
        [BLOCK_TYPES.COBBLESTONE]: '#4a4a4a',
        [BLOCK_TYPES.WOOD_PLANKS]: '#6B4226',
        [BLOCK_TYPES.GOLD]: '#FFC107',
        [BLOCK_TYPES.LAPIS]: '#1E90FF',
        [BLOCK_TYPES.EMERALD]: '#50C878',
        [BLOCK_TYPES.REDSTONE]: '#FF0000'
      };
      
      this.ctx.fillStyle = colors[blockType] || '#333333';
      this.ctx.fillRect(x, y, size, size);
    }

    this.ctx.strokeStyle = '#2D2D2D';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, size, size);
  }

  drawGrid(board) {
    const gridSize = board.size;
    this.gridSize = gridSize;
    const totalSize = gridSize * (this.cellSize + UI_CONFIG.GRID_GAP) - UI_CONFIG.GRID_GAP;
    
    this.gridOffsetX = (this.canvas.width - totalSize) / 2;
    this.gridOffsetY = (this.canvas.height - totalSize) / 2 - 20;
    
this.ctx.fillStyle = '#8B8B8B';
        this.ctx.fillRect(
          this.gridOffsetX - 14,
          this.gridOffsetY - 14,
          totalSize + 28,
          totalSize + 28
        );
        
        this.ctx.fillStyle = '#FAFAFA';
        this.ctx.fillRect(
          this.gridOffsetX - 12,
          this.gridOffsetY - 12,
          totalSize + 24,
          totalSize + 24
        );
        
        this.ctx.fillStyle = '#8B8B8B';
    
    this.ctx.strokeStyle = '#373737';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(
      this.gridOffsetX - 16,
      this.gridOffsetY - 16,
      totalSize + 32,
      totalSize + 32
    );
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cellType = board.getCell(x, y);
        const posX = this.gridOffsetX + x * (this.cellSize + UI_CONFIG.GRID_GAP);
        const posY = this.gridOffsetY + y * (this.cellSize + UI_CONFIG.GRID_GAP);
        
        if (cellType === BLOCK_TYPES.EMPTY) {
          this.ctx.fillStyle = '#404040';
          this.ctx.fillRect(posX, posY, this.cellSize, this.cellSize);
        } else {
          this.drawBlock(posX, posY, this.cellSize, cellType);
        }
      }
    }
    
    this.drawGridSlots(board);
  }

  drawGridSlots(board) {
    const gridSize = board.size;
    this.ctx.lineWidth = 2;
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const posX = this.gridOffsetX + x * (this.cellSize + UI_CONFIG.GRID_GAP);
        const posY = this.gridOffsetY + y * (this.cellSize + UI_CONFIG.GRID_GAP);
        
        this.ctx.strokeStyle = '#373737';
        this.ctx.strokeRect(posX, posY, this.cellSize, this.cellSize);
      }
    }
  }

  drawPiece(piece, startX, startY, cellSize, blockType, opacity = 1) {
    this.ctx.globalAlpha = opacity;
    
    const cells = piece.getCells();
    for (const { x, y } of cells) {
      const posX = startX + x * (cellSize + UI_CONFIG.GRID_GAP);
      const posY = startY + y * (cellSize + UI_CONFIG.GRID_GAP);
      this.drawBlock(posX, posY, cellSize, blockType);
    }
    
    this.ctx.globalAlpha = 1;
  }

  setPieces(pieces) {
    this.previewPieces = pieces;
  }

  drawPiecePreview(pieces, blockTypes) {
    if (!pieces || pieces.length === 0) return;
    
    const previewSize = this.cellSize * 0.9;
    const areaY = this.canvas.height - 80;
    const areaHeight = 70;
    const areaWidth = this.canvas.width;
    
    pieces.forEach((piece, index) => {
      const spacing = areaWidth / 4;
      const centerX = spacing * (index + 1.5);
      const centerY = areaY + areaHeight / 2;
      
      const pieceWidth = piece.getWidth() * previewSize;
      const pieceHeight = piece.getHeight() * previewSize;
      const x = centerX - pieceWidth / 2;
      const y = centerY - pieceHeight / 2;
      
      const blockType = blockTypes ? blockTypes[index] : BLOCK_TYPES.STONE;
      
      this.drawPiece(piece, x, y, previewSize, blockType);
    });
  }

  setDragPiece(piece, blockType, offsetX, offsetY) {
    this.dragPiece = piece;
    this.dragBlockType = blockType;
    this.dragOffset = { x: offsetX, y: offsetY };
  }

  clearDragPiece() {
    this.dragPiece = null;
    this.dragPieceCell = null;
    this.dragBlockType = null;
    this.snappedPosition = null;
  }

  updateSnappedPosition(screenX, screenY, board) {
    if (!this.dragPiece || !board) {
      this.snappedPosition = null;
      return null;
    }

    const gridSize = board.size;
    const total = gridSize * (this.cellSize + UI_CONFIG.GRID_GAP) - UI_CONFIG.GRID_GAP;

    const pieceWidth = this.dragPiece.getWidth();
    const pieceHeight = this.dragPiece.getHeight();
    
    const centerX = screenX;
    const centerY = screenY;
    
    let closestPos = null;
    let minDist = Infinity;

    for (let y = 0; y <= gridSize - pieceHeight; y++) {
      for (let x = 0; x <= gridSize - pieceWidth; x++) {
        const cellCenterX = this.gridOffsetX + x * (this.cellSize + UI_CONFIG.GRID_GAP) + this.cellSize / 2;
        const cellCenterY = this.gridOffsetY + y * (this.cellSize + UI_CONFIG.GRID_GAP) + this.cellSize / 2;
        
        const dist = Math.hypot(centerX - cellCenterX, centerY - cellCenterY);
        
        if (dist < minDist) {
          minDist = dist;
          closestPos = { x, y };
        }
      }
    }

    if (closestPos) {
      const canPlace = board.canPlacePiece(this.dragPiece, closestPos.x, closestPos.y);
      this.snappedPosition = closestPos;
      this.isValidPlacement = canPlace;
      return closestPos;
    }

    return null;
  }

  drawDragPiece() {
    if (!this.dragPiece) return;
    
    const piece = this.dragPiece;
    const blockType = this.dragBlockType;
    let offsetX = this.dragOffset.x;
    let offsetY = this.dragOffset.y;
    
    if (this.snappedPosition && this.isValidPlacement) {
      offsetX = this.gridOffsetX + this.snappedPosition.x * (this.cellSize + UI_CONFIG.GRID_GAP);
      offsetY = this.gridOffsetY + this.snappedPosition.y * (this.cellSize + UI_CONFIG.GRID_GAP);
    }
    
    this.ctx.globalAlpha = 0.85;
    this.drawPiece(piece, offsetX, offsetY, this.cellSize, blockType);
    this.ctx.globalAlpha = 1;

    if (this.snappedPosition) {
      this.drawPlacementHighlight();
    }
  }

  drawPlacementHighlight() {
    const piece = this.dragPiece;
    if (!piece) return;

    const cells = piece.getCells();
    const color = this.isValidPlacement ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 80, 80, 0.5)';
    
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = this.isValidPlacement ? '#FFFFFF' : '#FF3333';
    this.ctx.lineWidth = 3;
    
    for (const { x, y } of cells) {
      const posX = this.gridOffsetX + (this.snappedPosition.x + x) * (this.cellSize + UI_CONFIG.GRID_GAP);
      const posY = this.gridOffsetY + (this.snappedPosition.y + y) * (this.cellSize + UI_CONFIG.GRID_GAP);
      
      this.ctx.fillRect(posX, posY, this.cellSize, this.cellSize);
      this.ctx.strokeRect(posX, posY, this.cellSize, this.cellSize);
    }
  }

  getGridPosition(screenX, screenY, gridSize) {
    const total = gridSize * (this.cellSize + UI_CONFIG.GRID_GAP) - UI_CONFIG.GRID_GAP;
    
    if (screenX >= this.gridOffsetX && screenX < this.gridOffsetX + total &&
        screenY >= this.gridOffsetY && screenY < this.gridOffsetY + total) {
      
      const x = Math.floor((screenX - this.gridOffsetX) / (this.cellSize + UI_CONFIG.GRID_GAP));
      const y = Math.floor((screenY - this.gridOffsetY) / (this.cellSize + UI_CONFIG.GRID_GAP));
      
      if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
        return { x, y, size: gridSize };
      }
    }
    return null;
  }

  drawScore(score) {
    const centerX = this.canvas.width / 2;
    
    this.ctx.fillStyle = 'rgba(26, 26, 26, 0.8)';
    this.ctx.fillRect(centerX - 60, 8, 120, 40);
    this.ctx.strokeStyle = '#373737';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(centerX - 60, 8, 120, 40);
    
    this.ctx.shadowColor = '#000000';
    this.ctx.shadowBlur = 4;
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 14px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${score}`, centerX, 32);
    this.ctx.font = '4px "Press Start 2P", monospace';
    this.ctx.fillStyle = '#AAAAAA';
    this.ctx.fillText('SCORE', centerX, 42);
    this.ctx.shadowBlur = 0;
  }

  render(game) {
    this.clear();
    
    const board = game.getBoard();
    this.drawGrid(board);
    this.drawScore(game.getScore());
    
    const pieces = game.getCurrentPieces();
    const blockTypes = [
      BLOCK_TYPES.STONE,
      BLOCK_TYPES.GOLD,
      BLOCK_TYPES.REDSTONE
    ];
    this.drawPiecePreview(pieces, blockTypes);
    
    this.drawDragPiece();
  }
}