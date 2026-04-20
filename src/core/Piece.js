export class Piece {
  constructor(shape) {
    this.cells = shape.map(([x, y]) => ({ x, y }));
    this.normalize();
  }

  normalize() {
    const minX = Math.min(...this.cells.map(c => c.x));
    const minY = Math.min(...this.cells.map(c => c.y));
    
    this.cells = this.cells.map(({ x, y }) => ({
      x: x - minX,
      y: y - minY
    }));
  }

  getCells() {
    return this.cells;
  }

  getWidth() {
    return Math.max(...this.cells.map(c => c.x)) + 1;
  }

  getHeight() {
    return Math.max(...this.cells.map(c => c.y)) + 1;
  }
}

const TETROMINO_SHAPES = [
  [[0, 0]],
  [[0, 0], [1, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [0, 1]],
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [0, 1], [0, 2], [0, 3]],
  [[0, 0], [1, 0], [2, 0], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [0, 1]],
  [[0, 0], [1, 0], [2, 0], [2, 1]],
  [[0, 0], [0, 1], [1, 1], [2, 1]],
  [[0, 0], [1, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [1, -1]],
  [[0, 0], [1, 0], [1, 1], [2, 1]],
  [[0, 0], [1, 0], [1, 1], [0, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 0]],
  [[0, 0], [1, 0], [-1, 1], [0, 1]],
  [[0, 0], [1, 0], [2, 0], [2, -1]]
];

const L_SHAPES = [
  [[0, 0], [1, 0], [2, 0], [2, 1]],
  [[0, 0], [1, 0], [1, 1], [1, 2]],
  [[0, 0], [0, 1], [1, 1], [2, 1]],
  [[0, 0], [1, 0], [0, 1], [0, 2]]
];

const J_SHAPES = [
  [[0, 0], [1, 0], [2, 0], [0, 1]],
  [[0, 0], [0, 1], [1, 1], [0, 2]],
  [[0, 0], [1, 0], [2, 0], [2, -1]],
  [[0, 0], [1, 0], [1, 1], [1, 2]]
];

const S_SHAPES = [
  [[0, 0], [1, 0], [1, 1], [2, 1]],
  [[0, 0], [0, 1], [1, 0], [1, 1]]
];

const Z_SHAPES = [
  [[0, 0], [1, 0], [0, 1], [1, -1]],
  [[0, 0], [1, 0], [1, 1], [2, 1]]
];

const T_SHAPES = [
  [[0, 0], [1, 0], [2, 0], [1, 1]],
  [[0, 0], [1, 0], [1, 1], [1, 2]],
  [[0, 0], [1, 0], [2, 0], [1, -1]],
  [[0, 0], [1, 0], [1, 1], [2, 0]]
];

const ALL_SHAPES = [
  ...TETROMINO_SHAPES,
  ...L_SHAPES,
  ...J_SHAPES,
  ...S_SHAPES,
  ...Z_SHAPES,
  ...T_SHAPES
];

export class PieceGenerator {
  constructor() {
    this.availablePieces = ALL_SHAPES.map(shape => new Piece(shape));
  }

  generateRandomPiece() {
    const index = Math.floor(Math.random() * this.availablePieces.length);
    return this.availablePieces[index];
  }

  generatePieces(count = 3) {
    const pieces = [];
    for (let i = 0; i < count; i++) {
      pieces.push(this.generateRandomPiece());
    }
    return pieces;
  }
}