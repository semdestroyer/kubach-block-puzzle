import { Game, GameState } from './core/Game.js';
import { Renderer } from './rendering/Renderer.js';
import { InputHandler } from './input/InputHandler.js';
import { UIManager } from './ui/UIManager.js';

class BlockPuzzleApp {
  constructor() {
    this.game = new Game();
    this.renderer = null;
    this.inputHandler = null;
    this.uiManager = null;
    this.isRunning = false;
  }

  async init() {
    const container = document.getElementById('game-container');
    const canvas = document.getElementById('game-canvas');
    
    this.renderer = new Renderer(canvas);
    await this.renderer.init();
    
    this.uiManager = new UIManager(this.game);
    this.uiManager.init(container);
    
    this.inputHandler = new InputHandler(canvas, this.game, this.renderer);
    
    this.setupGameCallbacks();
    this.game.start();
    
    this.gameLoop();
  }

  setupGameCallbacks() {
    this.game.on('stateChange', ({ state }) => {
      if (state === GameState.PLAYING) {
        this.uiManager.hideAllScreens();
      }
    });
    
    this.game.on('gameOver', ({ score, linesCleared, boardSize }) => {
      this.uiManager.showGameOver(score, linesCleared, boardSize);
    });
    
    this.game.on('gameStart', ({ pieces }) => {
      this.renderer.setPieces(pieces);
    });
    
    this.game.on('piecePlaced', ({ pieces }) => {
      this.renderer.setPieces(pieces);
    });
  }

  gameLoop() {
    if (this.game.getState() === GameState.PLAYING) {
      this.renderer.render(this.game);
    }
    
    requestAnimationFrame(() => this.gameLoop());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new BlockPuzzleApp();
  app.init();
  
  window.addEventListener('resize', () => {
    if (app.renderer) {
      app.renderer.resize();
    }
  });
});