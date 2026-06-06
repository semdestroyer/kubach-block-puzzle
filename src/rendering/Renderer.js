import { UI_CONFIG, BLOCK_TYPES } from '../core/Constants.js';
import { AssetManager } from './AssetManager.js';
import { ParticleSystem } from './ParticleSystem.js';

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
    this.particleSystem = new ParticleSystem();
    this.screenShakeTime = 0;
    this.screenShakeStrength = 0;
    this.flashTime = 0;
    this.flashColor = 'rgba(255, 255, 255, 0)';
    this.lineFlashes = [];
    this.placementFlashes = [];
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
    this.ctx.fillRect(centerX - 50, 8, 100, 35);
    this.ctx.strokeStyle = '#373737';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(centerX - 50, 8, 100, 35);
    
    this.ctx.shadowColor = '#000000';
    this.ctx.shadowBlur = 4;
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 18px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${score}`, centerX, 32);
    this.ctx.shadowBlur = 0;
  }

  updateEffects(deltaTime) {
    this.particleSystem.update(deltaTime);
    this.screenShakeTime = Math.max(0, this.screenShakeTime - deltaTime);
    this.flashTime = Math.max(0, this.flashTime - deltaTime);

    for (let i = this.lineFlashes.length - 1; i >= 0; i--) {
      this.lineFlashes[i].life -= deltaTime;
      if (this.lineFlashes[i].life <= 0) {
        this.lineFlashes.splice(i, 1);
      }
    }

    for (let i = this.placementFlashes.length - 1; i >= 0; i--) {
      this.placementFlashes[i].life -= deltaTime;
      if (this.placementFlashes[i].life <= 0) {
        this.placementFlashes.splice(i, 1);
      }
    }
  }

  getCellCenter(x, y) {
    return {
      x: this.gridOffsetX + x * (this.cellSize + UI_CONFIG.GRID_GAP) + this.cellSize / 2,
      y: this.gridOffsetY + y * (this.cellSize + UI_CONFIG.GRID_GAP) + this.cellSize / 2
    };
  }

  spawnPlacementParticles(cells, blockType) {
    if (!cells || cells.length === 0) return;

    const isRedstone = blockType === BLOCK_TYPES.REDSTONE;
    const isGem = [BLOCK_TYPES.GOLD, BLOCK_TYPES.EMERALD, BLOCK_TYPES.LAPIS].includes(blockType);
    const color = this.getBlockParticleColor(blockType);

    cells.forEach(cell => {
      const center = this.getCellCenter(cell.x, cell.y);
      this.placementFlashes.push({
        x: cell.x,
        y: cell.y,
        color: isRedstone ? '#ff3030' : color,
        life: isRedstone ? 0.18 : 0.14,
        maxLife: isRedstone ? 0.18 : 0.14
      });

      const edgeY = center.y + this.cellSize * 0.38;
      const particleCount = isRedstone ? 4 : 3;

      for (let i = 0; i < particleCount; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        this.particleSystem.spawn(isRedstone ? 'redstone' : 'dust', center.x + side * this.cellSize * 0.26, edgeY, {
          count: 1,
          angle: Math.PI * (0.25 + Math.random() * 0.5),
          spread: this.cellSize * 0.14,
          speed: 32 + Math.random() * 24,
          size: Math.max(4, this.cellSize * 0.12),
          life: 0.24 + Math.random() * 0.08,
          lift: 0,
          gravity: 95,
          color,
          colorChance: isRedstone ? 0.75 : 0.65,
          alpha: 0.85
        });
      }

      if (isRedstone) {
        for (let i = 0; i < 3; i++) {
          this.particleSystem.spawn('redstone', center.x, center.y, {
            count: 1,
            spread: this.cellSize * 0.28,
            speed: 70 + Math.random() * 35,
            size: Math.max(3, this.cellSize * 0.1),
            life: 0.24,
            lift: 25,
            gravity: 12,
            color: '#ff2525',
            colorChance: 0.95
          });
        }
      } else if (isGem && Math.random() < 0.55) {
        this.particleSystem.spawn('sparkle', center.x, center.y - this.cellSize * 0.22, {
          count: 1,
          spread: this.cellSize * 0.18,
          speed: 55,
          size: Math.max(4, this.cellSize * 0.12),
          life: 0.34,
          lift: 32,
          gravity: 5,
          color,
          colorChance: 0.75
        });
      }
    });
  }

  spawnLineClearParticles(clearedCells, rows = [], cols = [], points = 0) {
    if (!clearedCells || clearedCells.length === 0) return;

    this.addLineFlash(rows, cols, points);
    const lineCount = rows.length + cols.length;
    const isBigClear = lineCount >= 4 || points >= 1000;
    this.screenShakeTime = isBigClear ? 0.22 : 0.11;
    this.screenShakeStrength = isBigClear ? 6 : 3;
    this.flashTime = isBigClear ? 0.24 : 0.14;
    this.flashColor = isBigClear ? 'rgba(255, 230, 130, 0.34)' : 'rgba(255, 255, 255, 0.20)';

    clearedCells.forEach(cell => {
      const center = this.getCellCenter(cell.x, cell.y);
      const color = this.getBlockParticleColor(cell.blockType);
      const isRedstone = cell.blockType === BLOCK_TYPES.REDSTONE;
      const isGem = [BLOCK_TYPES.GOLD, BLOCK_TYPES.EMERALD, BLOCK_TYPES.LAPIS].includes(cell.blockType);

      this.particleSystem.spawn(isRedstone ? 'redstone' : 'shard', center.x, center.y, {
        count: isRedstone ? 15 : 10,
        spread: this.cellSize * 0.58,
        speed: isRedstone ? 155 : 105,
        size: Math.max(5, this.cellSize * (isRedstone ? 0.22 : 0.18)),
        life: isRedstone ? 0.62 : 0.52,
        lift: isRedstone ? 55 : 25,
        gravity: isRedstone ? 18 : 90,
        color,
        colorChance: isRedstone ? 0.8 : 0.65
      });

      if (isRedstone) {
        this.particleSystem.burst('redstone', center.x, center.y, {
          count: 10,
          speed: 185,
          size: Math.max(4, this.cellSize * 0.14),
          life: 0.35,
          gravity: 0,
          color: '#ff2f2f',
          colorChance: 0.9
        });
      } else if (isGem) {
        this.particleSystem.spawn('sparkle', center.x, center.y, {
          count: 5,
          spread: this.cellSize * 0.4,
          speed: 130,
          size: Math.max(5, this.cellSize * 0.16),
          life: 0.7,
          lift: 60,
          gravity: 8,
          color,
          colorChance: 0.45
        });
      }
    });
  }

  addLineFlash(rows, cols, points) {
    const life = points >= 1000 ? 0.35 : 0.24;
    rows.forEach(row => this.lineFlashes.push({ type: 'row', index: row, life, maxLife: life }));
    cols.forEach(col => this.lineFlashes.push({ type: 'col', index: col, life, maxLife: life }));
  }

  getBlockParticleColor(blockType) {
    const colors = {
      [BLOCK_TYPES.DIRT]: '#8f6235',
      [BLOCK_TYPES.STONE]: '#9a9a9a',
      [BLOCK_TYPES.COBBLESTONE]: '#4f4f4f',
      [BLOCK_TYPES.WOOD_PLANKS]: '#9a6a36',
      [BLOCK_TYPES.GOLD]: '#ffd33d',
      [BLOCK_TYPES.LAPIS]: '#2f70ff',
      [BLOCK_TYPES.EMERALD]: '#35e071',
      [BLOCK_TYPES.REDSTONE]: '#ff2020'
    };
    return colors[blockType] || '#bdbdbd';
  }

  spawnFirework(x = this.canvas.width / 2, y = this.canvas.height * 0.28) {
    this.particleSystem.burst('firework', x, y, {
      count: 42,
      speed: 155,
      size: Math.max(9, this.cellSize * 0.32),
      life: 0.9,
      gravity: 20,
      spread: 6
    });
  }

  spawnGameOverImpact() {
    this.screenShakeTime = 0.42;
    this.screenShakeStrength = 10;
    this.flashTime = 0.38;
    this.flashColor = 'rgba(20, 12, 8, 0.46)';

    const impactX = this.canvas.width / 2;
    const impactY = Math.max(80, this.gridOffsetY + this.gridSize * this.cellSize * 0.35);
    this.particleSystem.burst('smoke', impactX, impactY, {
      count: 38,
      speed: 150,
      size: Math.max(8, this.cellSize * 0.28),
      life: 0.8,
      gravity: 110,
      spread: this.cellSize
    });
    this.particleSystem.burst('shard', impactX, impactY, {
      count: 28,
      speed: 190,
      size: Math.max(5, this.cellSize * 0.18),
      life: 0.65,
      gravity: 160,
      color: '#555555',
      colorChance: 0.75
    });
  }

  drawLineFlashes() {
    if (this.lineFlashes.length === 0) return;

    const totalSize = this.gridSize * (this.cellSize + UI_CONFIG.GRID_GAP) - UI_CONFIG.GRID_GAP;
    this.lineFlashes.forEach(flash => {
      const progress = Math.max(0, flash.life / flash.maxLife);
      this.ctx.fillStyle = `rgba(255, 246, 160, ${0.34 * progress})`;

      if (flash.type === 'row') {
        const y = this.gridOffsetY + flash.index * (this.cellSize + UI_CONFIG.GRID_GAP);
        this.ctx.fillRect(this.gridOffsetX, y, totalSize, this.cellSize);
      } else {
        const x = this.gridOffsetX + flash.index * (this.cellSize + UI_CONFIG.GRID_GAP);
        this.ctx.fillRect(x, this.gridOffsetY, this.cellSize, totalSize);
      }
    });
  }

  drawPlacementFlashes() {
    if (this.placementFlashes.length === 0) return;

    this.placementFlashes.forEach(flash => {
      const progress = Math.max(0, flash.life / flash.maxLife);
      const x = this.gridOffsetX + flash.x * (this.cellSize + UI_CONFIG.GRID_GAP);
      const y = this.gridOffsetY + flash.y * (this.cellSize + UI_CONFIG.GRID_GAP);
      const inset = (1 - progress) * this.cellSize * 0.18;

      this.ctx.save();
      this.ctx.globalAlpha = 0.45 * progress;
      this.ctx.strokeStyle = flash.color;
      this.ctx.lineWidth = Math.max(2, this.cellSize * 0.06);
      this.ctx.strokeRect(x + inset, y + inset, this.cellSize - inset * 2, this.cellSize - inset * 2);
      this.ctx.restore();
    });
  }

  drawScreenFlash() {
    if (this.flashTime <= 0) return;

    this.ctx.save();
    this.ctx.globalAlpha = Math.min(1, this.flashTime * 3);
    this.ctx.fillStyle = this.flashColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  drawParticles() {
    this.particleSystem.draw(this.ctx, this.assetManager.getTexture('particles'));
  }

  hasActiveEffects() {
    return this.particleSystem.particles.length > 0 ||
      this.screenShakeTime > 0 ||
      this.flashTime > 0 ||
      this.lineFlashes.length > 0 ||
      this.placementFlashes.length > 0;
  }

  render(game) {
    this.ctx.save();
    if (this.screenShakeTime > 0) {
      const shake = this.screenShakeStrength * (this.screenShakeTime / 0.42);
      this.ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }

    this.clear();
    
    const board = game.getBoard();
    this.drawGrid(board);
    this.drawLineFlashes();
    this.drawPlacementFlashes();
    this.drawScore(game.getScore());
    
    const pieces = game.getCurrentPieces();
    const blockTypes = [
      BLOCK_TYPES.STONE,
      BLOCK_TYPES.GOLD,
      BLOCK_TYPES.REDSTONE
    ];
    this.drawPiecePreview(pieces, blockTypes);
    this.drawParticles();
    
    this.drawDragPiece();
    this.ctx.restore();
    this.drawScreenFlash();
  }
}
