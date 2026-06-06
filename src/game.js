import { Game, GameState } from './core/Game.js';
import { Renderer } from './rendering/Renderer.js';
import { InputHandler } from './input/InputHandler.js';
import { UIManager } from './ui/UIManager.js';
import { YandexSDK } from './storage/YandexSDK.js';
import { AudioManager } from './audio/AudioManager.js';

class BlockPuzzleApp {
  constructor() {
    this.game = new Game();
    this.renderer = null;
    this.inputHandler = null;
    this.uiManager = null;
    this.yandexSDK = new YandexSDK();
    this.audioManager = new AudioManager();
    this.isRunning = false;
    this.lastFrameTime = performance.now();
  }

  async init() {
    const loadingScreen = document.getElementById('loading-screen');
    const container = document.getElementById('game-container');
    const canvas = document.getElementById('game-canvas');
    
    await this.yandexSDK.init();
    this.audioManager.preload();
    
    this.renderer = new Renderer(canvas);
    await this.renderer.init();
    
    this.uiManager = new UIManager(this.game, this.yandexSDK, this.audioManager);
    this.uiManager.init(container);
    this.uiManager.updateAllTranslations();
    
    this.inputHandler = new InputHandler(canvas, this.game, this.renderer, this.audioManager);
    
    this.setupGameCallbacks();
    this.setupPlatformCallbacks();
    this.game.start();
    
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
    }
    
    this.yandexSDK.gameReady();
    
    this.gameLoop();
  }

  setupGameCallbacks() {
    this.game.on('stateChange', ({ state }) => {
      if (state === GameState.PLAYING) {
        this.uiManager.hideAllScreens();
        const board = this.game.getBoard();
        this.renderer.setGridSize(board.size);
        this.yandexSDK.gameplayStart();
      } else {
        this.yandexSDK.gameplayStop();
      }
    });
    
    this.game.on('gameOver', ({ score, linesCleared, boardSize }) => {
      const multipliers = { 8: 1.2, 10: 1.0, 12: 0.8 };
      const bonusMultiplier = multipliers[boardSize] || 1.0;
      const finalScore = Math.floor(score * bonusMultiplier);
      
      const isNewBest = this.uiManager.showGameOver(finalScore, linesCleared, boardSize);
      this.audioManager.playSfx('gameOver', { volume: 0.35, rate: 0.85 });
      if (isNewBest) {
        this.audioManager.playSfx('newBest', { volume: 0.45, rate: 1.08 });
        this.renderer.spawnFirework();
      }
      
      if (this.yandexSDK.isAvailable()) {
        this.yandexSDK.setLeaderboardScore(finalScore);
        this.showAdAfterGameOver();
      }
    });
    
    this.game.on('gameStart', ({ pieces, boardSize }) => {
      this.renderer.setGridSize(boardSize);
      this.renderer.setPieces(pieces);
      this.audioManager.startMusic();
    });
    
    this.game.on('piecePlaced', ({ pieces, cells, blockType }) => {
      this.renderer.setPieces(pieces);
      this.audioManager.playBlockPlace(blockType);
      this.renderer.spawnPlacementParticles(cells, blockType);
    });

    this.game.on('piecesGenerated', ({ pieces }) => {
      this.renderer.setPieces(pieces);
    });

    this.game.on('linesCleared', ({ rows, cols, points }) => {
      const lineCount = rows.length + cols.length;
      this.audioManager.playLineClear(lineCount, points);
      this.renderer.spawnLineClearParticles(rows, cols);
      if (lineCount >= 3 || points >= 600) {
        this.renderer.spawnFirework();
      }
    });
  }

  setupPlatformCallbacks() {
    this.yandexSDK.onPause(() => {
      this.audioManager.handlePlatformPause();
      this.yandexSDK.gameplayStop();
    });

    this.yandexSDK.onResume(() => {
      this.audioManager.handlePlatformResume();
      if (this.game.getState() === GameState.PLAYING) {
        this.yandexSDK.gameplayStart();
      }
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

  gameLoop(now = performance.now()) {
    const deltaTime = Math.min(0.05, (now - this.lastFrameTime) / 1000);
    this.lastFrameTime = now;
    this.renderer.updateEffects(deltaTime);

    if (this.game.getState() === GameState.PLAYING) {
      this.renderer.render(this.game);
    }
    
    requestAnimationFrame(this.gameLoop.bind(this));
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
