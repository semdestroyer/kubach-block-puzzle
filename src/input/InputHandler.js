import { UI_CONFIG, BLOCK_TYPES } from '../core/Constants.js';

export class InputHandler {
  constructor(canvas, game, renderer, audioManager = null) {
    this.canvas = canvas;
    this.game = game;
    this.renderer = renderer;
    this.audioManager = audioManager;
    this.isDragging = false;
    this.dragPiece = null;
    this.dragPieceIndex = -1;
    this.dragStartPos = { x: 0, y: 0 };
    this.blockTypes = [BLOCK_TYPES.STONE, BLOCK_TYPES.GOLD, BLOCK_TYPES.REDSTONE];
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
    this.canvas.addEventListener('pointercancel', this.onPointerUp.bind(this));
  }

  getClosestPiece(x, y) {
    const pieces = this.game.getCurrentPieces();
    if (!pieces || pieces.length === 0) return null;
    
    const previewSize = this.renderer.cellSize * 0.9;
    const areaY = this.canvas.height - 80;
    const areaHeight = 70;
    const areaWidth = this.canvas.width;
    
    let closest = null;
    let minDist = Infinity;
    
    pieces.forEach((piece, index) => {
      const spacing = areaWidth / 4;
      const centerX = spacing * (index + 1.5);
      const centerY = areaY + areaHeight / 2;
      
      const dist = Math.hypot(x - centerX, y - centerY);
      
      if (dist < minDist) {
        minDist = dist;
        closest = { piece, index, centerX, centerY };
      }
    });
    
    const threshold = 100;
    if (minDist < threshold) {
      return closest;
    }
    
    return null;
  }

  onPointerDown(e) {
    this.audioManager?.unlock();

    if (this.game.getState() !== 'playing') return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hit = this.getClosestPiece(x, y);
    if (hit) {
      this.isDragging = true;
      this.dragPiece = hit.piece;
      this.dragPieceIndex = hit.index;
      this.dragStartPos = { x, y };
      this.audioManager?.playSfx('pickup', { volume: 0.28, rate: 1.15 });
      
      this.canvas.setPointerCapture(e.pointerId);
    }
  }

  onPointerMove(e) {
    if (!this.isDragging || !this.dragPiece) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const board = this.game.getBoard();
    this.renderer.updateSnappedPosition(x, y, board);
    
    this.renderer.setDragPiece(
      this.dragPiece, 
      this.blockTypes[this.dragPieceIndex], 
      x - this.renderer.cellSize / 2, 
      y - this.renderer.cellSize / 2
    );
  }

  onPointerUp(e) {
    if (!this.isDragging || !this.dragPiece) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const board = this.game.getBoard();
    const snappedPos = this.renderer.updateSnappedPosition(x, y, board);
    
    if (snappedPos && this.renderer.isValidPlacement) {
      this.game.placePiece(
        this.dragPiece, 
        snappedPos.x, 
        snappedPos.y, 
        this.blockTypes[this.dragPieceIndex]
      );
    } else {
      this.audioManager?.playSfx('invalid', { volume: 0.25, rate: 0.85 });
    }
    
    this.isDragging = false;
    this.dragPiece = null;
    this.dragPieceIndex = -1;
    this.renderer.clearDragPiece();
    
    this.canvas.releasePointerCapture(e.pointerId);
  }
}
