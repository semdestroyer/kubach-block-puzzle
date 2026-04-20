import { BLOCK_TYPES } from './Constants.js';

export class Board {
  constructor(size = 10) {
    this.size = size;
    this.grid = this.createEmptyGrid();
  }

  createEmptyGrid() {
    return Array(this.size).fill(null).map(() => 
      Array(this.size).fill(BLOCK_TYPES.EMPTY)
    );
  }

  reset() {
    this.grid = this.createEmptyGrid();
  }

  setSize(size) {
    this.size = size;
    this.reset();
  }

  getCell(x, y) {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
      return null;
    }
    return this.grid[y][x];
  }

  setCell(x, y, type) {
    if (x >= 0 && x < this.size && y >= 0 && y < this.size) {
      this.grid[y][x] = type;
    }
  }

  canPlacePiece(piece, startX, startY) {
    const cells = piece.getCells();
    
    for (const { x, y } of cells) {
      const boardX = startX + x;
      const boardY = startY + y;
      
      if (boardX < 0 || boardX >= this.size || 
          boardY < 0 || boardY >= this.size ||
          this.grid[boardY][boardX] !== BLOCK_TYPES.EMPTY) {
        return false;
      }
    }
    return true;
  }

  placePiece(piece, startX, startY, blockType) {
    if (!this.canPlacePiece(piece, startX, startY)) {
      return false;
    }

    const cells = piece.getCells();
    for (const { x, y } of cells) {
      this.grid[startY + y][startX + x] = blockType;
    }
    return true;
  }

  findFullRows() {
    const rows = [];
    for (let y = 0; y < this.size; y++) {
      if (this.grid[y].every(cell => cell !== BLOCK_TYPES.EMPTY)) {
        rows.push(y);
      }
    }
    return rows;
  }

  findFullCols() {
    const cols = [];
    for (let x = 0; x < this.size; x++) {
      let full = true;
      for (let y = 0; y < this.size; y++) {
        if (this.grid[y][x] === BLOCK_TYPES.EMPTY) {
          full = false;
          break;
        }
      }
      if (full) cols.push(x);
    }
    return cols;
  }

  clearLines(rows, cols) {
    for (const y of rows) {
      for (let x = 0; x < this.size; x++) {
        this.grid[y][x] = BLOCK_TYPES.EMPTY;
      }
    }
    for (const x of cols) {
      for (let y = 0; y < this.size; y++) {
        this.grid[y][x] = BLOCK_TYPES.EMPTY;
      }
    }
    return rows.length + cols.length;
  }

  hasPossibleMoves(pieces) {
    for (const piece of pieces) {
      for (let y = 0; y < this.size; y++) {
        for (let x = 0; x < this.size; x++) {
          if (this.canPlacePiece(piece, x, y)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  getEmptyCount() {
    let count = 0;
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.grid[y][x] === BLOCK_TYPES.EMPTY) {
          count++;
        }
      }
    }
    return count;
  }
}