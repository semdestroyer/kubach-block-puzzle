import { GRID_SIZES } from '../core/Constants.js';
import { Storage } from '../storage/Storage.js';

export class UIManager {
  constructor(game, yandexSDK = null) {
    this.game = game;
    this.storage = new Storage();
    this.yandexSDK = yandexSDK;
    this.container = null;
    this.screens = {};
  }

  init(container) {
    this.container = container;
    this.createScreens();
    this.showScreen('menu');
  }

  createScreens() {
    this.screens.menu = this.createMenuScreen();
    this.screens.selectSize = this.createSelectSizeScreen();
    this.screens.gameOver = this.createGameOverScreen();
    
    Object.values(this.screens).forEach(screen => {
      screen.style.display = 'none';
      this.container.appendChild(screen);
    });
  }

  createMenuScreen() {
    const screen = document.createElement('div');
    screen.className = 'screen menu-screen';
    
    screen.innerHTML = `
      <h1 class="title">BLOCK PUZZLE</h1>
      <h2 class="subtitle">Minecraft Edition</h2>
      <button class="btn btn-primary" id="startBtn">START GAME</button>
      <div class="best-scores">
        <h3>Best Score</h3>
        <div class="score-value" id="bestScoreValue">0</div>
      </div>
    `;
    
    const startBtn = screen.querySelector('#startBtn');
    startBtn.addEventListener('click', () => {
      this.showScreen('selectSize');
    });
    
    this.updateBestScore('bestScoreValue');
    
    return screen;
  }

  createSelectSizeScreen() {
    const screen = document.createElement('div');
    screen.className = 'screen select-size-screen';
    
    let buttonsHtml = GRID_SIZES.map(size => {
      const multiplier = size === 8 ? 'x0.8' : size === 12 ? 'x1.2' : 'x1.0';
      return `
        <button class="btn btn-size" data-size="${size}">
          ${size}×${size}
          <span class="multiplier">(${multiplier})</span>
        </button>
      `;
    }).join('');
    
    screen.innerHTML = `
      <h2>SELECT GRID SIZE</h2>
      <div class="size-buttons">
        ${buttonsHtml}
      </div>
      <button class="btn btn-back" id="backToMenu">← BACK</button>
    `;
    
    screen.querySelectorAll('.btn-size').forEach(btn => {
      btn.addEventListener('click', () => {
        const size = parseInt(btn.dataset.size);
        this.game.startGame(size);
        this.hideAllScreens();
      });
    });
    
    screen.querySelector('#backToMenu').addEventListener('click', () => {
      this.showScreen('menu');
    });
    
    return screen;
  }

  createGameOverScreen() {
    const screen = document.createElement('div');
    screen.className = 'screen gameover-screen';
    
    screen.innerHTML = `
      <h2>GAME OVER</h2>
      <div class="final-score">
        <span class="label">SCORE</span>
        <span class="value" id="finalScore">0</span>
      </div>
      <div class="lines-cleared">
        <span class="label">LINES</span>
        <span class="value" id="linesCleared">0</span>
      </div>
      <div class="new-best" id="newBest" style="display: none;">NEW HIGH SCORE!</div>
      <button class="btn btn-primary" id="playAgainBtn">PLAY AGAIN</button>
      <button class="btn btn-back" id="toMenuBtn">MAIN MENU</button>
    `;
    
    screen.querySelector('#playAgainBtn').addEventListener('click', () => {
      const size = this.game.getGridSize();
      this.game.startGame(size);
      this.hideAllScreens();
    });
    
    screen.querySelector('#toMenuBtn').addEventListener('click', () => {
      this.showScreen('menu');
    });
    
    return screen;
  }

  async updateBestScore(elementId) {
    const bestScore = this.storage.getBestScore(10);
    const elements = document.querySelectorAll(`#${elementId}`);
    elements.forEach(el => {
      if (el) el.textContent = bestScore;
    });
  }

  showScreen(screenName) {
    this.hideAllScreens();
    
    if (screenName === 'menu') {
      this.updateBestScore('bestScoreValue');
    }
    
    if (this.screens[screenName]) {
      this.screens[screenName].style.display = 'flex';
    }
  }

  hideAllScreens() {
    Object.values(this.screens).forEach(screen => {
      screen.style.display = 'none';
    });
  }

  showGameOver(score, linesCleared, gridSize) {
    const screen = this.screens.gameOver;
    screen.querySelector('#finalScore').textContent = score;
    screen.querySelector('#linesCleared').textContent = linesCleared;
    
    const isNewBest = this.storage.updateBestScore(gridSize, score);
    screen.querySelector('#newBest').style.display = isNewBest ? 'block' : 'none';
    
    this.updateBestScore('bestScoreValue');
    this.showScreen('gameOver');
  }

  isAnyScreenVisible() {
    return Object.values(this.screens).some(screen => 
      screen.style.display !== 'none'
    );
  }
}