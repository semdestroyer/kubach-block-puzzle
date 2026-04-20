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
    this.dragOffset = { x: 0, y: 0 };
    this.previewPieces = [];
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
    
    this.ctx.imageSmoothingEnabled = false;
  }

  setCellSize(size) {
    this.cellSize = size;
  }

  clear() {
    this.ctx.fillStyle = '#1a1a1a';
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
    const totalSize = gridSize * (this.cellSize + UI_CONFIG.GRID_GAP) - UI_CONFIG.GRID_GAP;
    
    this.gridOffsetX = (this.canvas.width - totalSize) / 2;
    this.gridOffsetY = (this.canvas.height - totalSize) / 2;
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cellType = board.getCell(x, y);
        const posX = this.gridOffsetX + x * (this.cellSize + UI_CONFIG.GRID_GAP);
        const posY = this.gridOffsetY + y * (this.cellSize + UI_CONFIG.GRID_GAP);
        
        if (cellType === BLOCK_TYPES.EMPTY) {
          this.ctx.fillStyle = '#2a2a2a';
          this.ctx.fillRect(posX, posY, this.cellSize, this.cellSize);
          this.ctx.strokeStyle = '#333333';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(posX, posY, this.cellSize, this.cellSize);
        } else {
          this.drawBlock(posX, posY, this.cellSize, cellType);
        }
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
    
    const previewSize = UI_CONFIG.PIECE_PREVIEW_SIZE;
    const spacing = this.canvas.width / 3;
    const y = this.canvas.height - 120;
    
    pieces.forEach((piece, index) => {
      const x = spacing * (index + 1) - previewSize * piece.getWidth() / 2;
      const blockType = blockTypes ? blockTypes[index] : BLOCK_TYPES.STONE;
      
      this.drawPiece(piece, x, y, previewSize, blockType);
    });
  }

  setDragPiece(piece, blockType, offsetX, offsetY) {
    this.dragPiece = { piece, blockType, offsetX, offsetY };
  }

  clearDragPiece() {
    this.dragPiece = null;
  }

  drawDragPiece() {
    if (!this.dragPiece) return;
    
    const { piece, blockType, offsetX, offsetY } = this.dragPiece;
    this.drawPiece(piece, offsetX, offsetY, this.cellSize, blockType);
  }

  getGridPosition(screenX, screenY, gridSize) {
    const total = gridSize * (this.cellSize + UI_CONFIG.GRID_GAP) - UI_CONFIG.GRID_GAP;
    const offsetX = (this.canvas.width - total) / 2;
    const offsetY = (this.canvas.height - total) / 2;
    
    if (screenX >= offsetX && screenX < offsetX + total &&
        screenY >= offsetY && screenY < offsetY + total) {
      
      const x = Math.floor((screenX - offsetX) / (this.cellSize + UI_CONFIG.GRID_GAP));
      const y = Math.floor((screenY - offsetY) / (this.cellSize + UI_CONFIG.GRID_GAP));
      
      if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
        return { x, y, size: gridSize };
      }
    }
    return null;
  }

  drawScore(score) {
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 24px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Score: ${score}`, this.canvas.width / 2, 40);
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