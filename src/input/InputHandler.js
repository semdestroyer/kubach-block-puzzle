import { UI_CONFIG, BLOCK_TYPES } from '../core/Constants.js';

export class InputHandler {
  constructor(canvas, game, renderer) {
    this.canvas = canvas;
    this.game = game;
    this.renderer = renderer;
    this.isDragging = false;
    this.dragPiece = null;
    this.dragPieceIndex = -1;
    this.dragStartPos = { x: 0, y: 0 };
    this.previewPositions = [];
    this.blockTypes = [BLOCK_TYPES.STONE, BLOCK_TYPES.GOLD, BLOCK_TYPES.REDSTONE];
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
    this.canvas.addEventListener('pointercancel', this.onPointerUp.bind(this));
  }

  updatePreviewPositions() {
    const pieces = this.game.getCurrentPieces();
    if (!pieces) return;
    
    this.previewPositions = [];
    const spacing = this.canvas.width / 3;
    const y = this.canvas.height - 120;
    
    pieces.forEach((piece, index) => {
      const x = spacing * (index + 1) - UI_CONFIG.PIECE_PREVIEW_SIZE * piece.getWidth() / 2;
      this.previewPositions.push({ x, y, width: piece.getWidth(), height: piece.getHeight() });
    });
  }

  getPieceAtPosition(x, y) {
    const pieces = this.game.getCurrentPieces();
    
    for (let i = 0; i < this.previewPositions.length; i++) {
      const pos = this.previewPositions[i];
      const cellSize = UI_CONFIG.PIECE_PREVIEW_SIZE;
      const width = pos.width * cellSize;
      const height = pos.height * cellSize;
      
      if (x >= pos.x && x <= pos.x + width &&
          y >= pos.y && y <= pos.y + height) {
        return { piece: pieces[i], index: i };
      }
    }
    return null;
  }

  onPointerDown(e) {
    if (this.game.getState() !== 'playing') return;
    
    this.updatePreviewPositions();
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hit = this.getPieceAtPosition(x, y);
    if (hit) {
      this.isDragging = true;
      this.dragPiece = hit.piece;
      this.dragPieceIndex = hit.index;
      this.dragStartPos = { x, y };
      
      this.canvas.setPointerCapture(e.pointerId);
    }
  }

  onPointerMove(e) {
    if (!this.isDragging || !this.dragPiece) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cellSize = UI_CONFIG.GRID_CELL_SIZE;
    this.renderer.setDragPiece(
      this.dragPiece, 
      this.blockTypes[this.dragPieceIndex], 
      x - cellSize, 
      y - cellSize
    );
  }

  onPointerUp(e) {
    if (!this.isDragging || !this.dragPiece) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const gridPos = this.renderer.getGridPosition(x, y, this.game.getBoard().size);
    
    if (gridPos && this.game.canPlacePiece(this.dragPiece, gridPos.x, gridPos.y)) {
      this.game.placePiece(
        this.dragPiece, 
        gridPos.x, 
        gridPos.y, 
        this.blockTypes[this.dragPieceIndex]
      );
    }
    
    this.isDragging = false;
    this.dragPiece = null;
    this.dragPieceIndex = -1;
    this.renderer.clearDragPiece();
    
    this.canvas.releasePointerCapture(e.pointerId);
  }
}