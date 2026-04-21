import { Game, GameState } from './core/Game.js';
import { Renderer } from './rendering/Renderer.js';
import { InputHandler } from './input/InputHandler.js';
import { UIManager } from './ui/UIManager.js';
import { YandexSDK } from './storage/YandexSDK.js';

class BlockPuzzleApp {
  constructor() {
    this.game = new Game();
    this.renderer = null;
    this.inputHandler = null;
    this.uiManager = null;
    this.yandexSDK = new YandexSDK();
    this.isRunning = false;
  }

  async init() {
    const loadingScreen = document.getElementById('loading-screen');
    const container = document.getElementById('game-container');
    const canvas = document.getElementById('game-canvas');
    
    await this.yandexSDK.init();
    
    this.renderer = new Renderer(canvas);
    await this.renderer.init();
    
    this.uiManager = new UIManager(this.game, this.yandexSDK);
    this.uiManager.init(container);
    
    this.inputHandler = new InputHandler(canvas, this.game, this.renderer);
    
    this.setupGameCallbacks();
    this.game.start();
    
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
    }
    
    this.gameLoop();
  }

  setupGameCallbacks() {
    this.game.on('stateChange', ({ state }) => {
      if (state === GameState.PLAYING) {
        this.uiManager.hideAllScreens();
        const board = this.game.getBoard();
        this.renderer.setGridSize(board.size);
      }
    });
    
    this.game.on('gameOver', ({ score, linesCleared, boardSize }) => {
      const bonusMultiplier = boardSize / 10;
      const finalScore = Math.floor(score * bonusMultiplier);
      
      this.uiManager.showGameOver(finalScore, linesCleared, boardSize);
      
      if (this.yandexSDK.isAvailable()) {
        this.yandexSDK.setLeaderboardScore(finalScore);
        this.showAdAfterGameOver();
      }
    });
    
    this.game.on('gameStart', ({ pieces, boardSize }) => {
      this.renderer.setGridSize(boardSize);
      this.renderer.setPieces(pieces);
    });
    
    this.game.on('piecePlaced', ({ pieces }) => {
      this.renderer.setPieces(pieces);
    });
  }

  async showAdAfterGameOver() {
    try {
      const canShow = await this.yandexSDK.canShowInterstitial();
      if (canShow) {
        await this.yandexSDK.showInterstitial();
      }
    } catch (e) {
      console.warn('Could not show interstitial:', e);
    }
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