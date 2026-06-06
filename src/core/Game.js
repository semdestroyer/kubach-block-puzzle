import { GRID_SIZES } from './Constants.js';
import { Board } from './Board.js';
import { PieceGenerator } from './Piece.js';

export const GameState = {
  MENU: 'menu',
  SELECT_SIZE: 'select_size',
  PLAYING: 'playing',
  GAME_OVER: 'game_over'
};

export class Game {
  constructor() {
    this.state = GameState.MENU;
    this.board = new Board(10);
    this.pieceGenerator = new PieceGenerator();
    this.currentPieces = [];
    this.score = 0;
    this.linesCleared = 0;
    this.selectedGridSize = 10;
    this.callbacks = {};
  }

  on(event, callback) {
    this.callbacks[event] = callback;
  }

  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event](data);
    }
  }

  start() {
    this.setState(GameState.MENU);
  }

  setState(newState) {
    this.state = newState;
    this.emit('stateChange', { state: newState });
  }

  selectGridSize(size) {
    if (!GRID_SIZES.includes(size)) return;
    this.selectedGridSize = size;
  }

  startGame(size = this.selectedGridSize) {
    this.board.setSize(size);
    this.currentPieces = this.pieceGenerator.generatePieces(3);
    this.score = 0;
    this.linesCleared = 0;
    this.setState(GameState.PLAYING);
    this.emit('gameStart', { 
      boardSize: size,
      pieces: this.currentPieces 
    });
  }

  canPlacePiece(piece, x, y) {
    return this.board.canPlacePiece(piece, x, y);
  }

  placePiece(piece, x, y, blockType) {
    if (!this.board.placePiece(piece, x, y, blockType)) {
      return false;
    }

    const placedIndex = this.currentPieces.indexOf(piece);
    if (placedIndex !== -1) {
      this.currentPieces.splice(placedIndex, 1);
    }

    this.score += piece.getCells().length;
    const placedCells = piece.getCells().map(cell => ({
      x: x + cell.x,
      y: y + cell.y
    }));

    this.emit('piecePlaced', {
      score: this.score,
      pieces: this.currentPieces,
      cells: placedCells,
      blockType
    });

    this.checkAndClearLines();
    
    if (this.currentPieces.length === 0) {
      this.currentPieces = this.pieceGenerator.generatePieces(3);
      this.emit('piecesGenerated', {
        pieces: this.currentPieces
      });
    }

    if (!this.board.hasPossibleMoves(this.currentPieces)) {
      this.gameOver();
      return true;
    }

    return true;
  }

  checkAndClearLines() {
    const fullRows = this.board.findFullRows();
    const fullCols = this.board.findFullCols();
    
    if (fullRows.length > 0 || fullCols.length > 0) {
      const clearedCells = this.getClearedCells(fullRows, fullCols);
      this.board.clearLines(fullRows, fullCols);
      this.linesCleared += fullRows.length + fullCols.length;
      
      const points = this.calculateScore(fullRows.length, fullCols.length);
      this.score += points;
      
      this.emit('linesCleared', {
        rows: fullRows,
        cols: fullCols,
        clearedCells,
        points,
        totalScore: this.score
      });
    }
  }

  getClearedCells(rows, cols) {
    const cells = [];
    const seen = new Set();

    rows.forEach(y => {
      for (let x = 0; x < this.board.size; x++) {
        const key = `${x}:${y}`;
        seen.add(key);
        cells.push({ x, y, blockType: this.board.getCell(x, y) });
      }
    });

    cols.forEach(x => {
      for (let y = 0; y < this.board.size; y++) {
        const key = `${x}:${y}`;
        if (!seen.has(key)) {
          seen.add(key);
          cells.push({ x, y, blockType: this.board.getCell(x, y) });
        }
      }
    });

    return cells;
  }

  calculateScore(rows, cols) {
    const lines = rows + cols;
    if (lines === 0) return 0;
    if (lines === 1) return 100;
    if (lines === 2) return 300;
    if (lines === 3) return 600;
    return 1000;
  }

  gameOver() {
    this.setState(GameState.GAME_OVER);
    this.emit('gameOver', { 
      score: this.score,
      linesCleared: this.linesCleared,
      boardSize: this.board.size
    });
  }

  returnToMenu() {
    this.setState(GameState.MENU);
  }

  getState() {
    return this.state;
  }

  getScore() {
    return this.score;
  }

  getBoard() {
    return this.board;
  }

  getCurrentPieces() {
    return this.currentPieces;
  }

  getGridSize() {
    return this.selectedGridSize;
  }
}
