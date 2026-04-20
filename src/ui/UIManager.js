import { GRID_SIZES } from '../core/Constants.js';
import { Storage } from '../storage/Storage.js';

export class UIManager {
  constructor(game) {
    this.game = game;
    this.storage = new Storage();
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
        <h3>Best Scores</h3>
        <div class="scores-list" id="bestScoresList"></div>
      </div>
    `;
    
    const startBtn = screen.querySelector('#startBtn');
    startBtn.addEventListener('click', () => {
      this.showScreen('selectSize');
    });
    
    return screen;
  }

  createSelectSizeScreen() {
    const screen = document.createElement('div');
    screen.className = 'screen select-size-screen';
    
    let buttonsHtml = GRID_SIZES.map(size => {
      const best = this.storage.getBestScore(size);
      return `
        <button class="btn btn-size" data-size="${size}">
          ${size}×${size}
          <span class="best">Best: ${best}</span>
        </button>
      `;
    }).join('');
    
    screen.innerHTML = `
      <h2>Select Grid Size</h2>
      <div class="size-buttons">
        ${buttonsHtml}
      </div>
      <button class="btn btn-back" id="backToMenu">← Back</button>
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
        <span class="label">Score:</span>
        <span class="value" id="finalScore">0</span>
      </div>
      <div class="lines-cleared">
        <span class="label">Lines:</span>
        <span class="value" id="linesCleared">0</span>
      </div>
      <div class="new-best" id="newBest" style="display: none;">NEW BEST!</div>
      <button class="btn btn-primary" id="playAgainBtn">PLAY AGAIN</button>
      <button class="btn btn-back" id="toMenuBtn">MAIN MENU</button>
    `;
    
    screen.querySelector('#playAgainBtn').addEventListener('click', () => {
      this.hideAllScreens();
    });
    
    screen.querySelector('#toMenuBtn').addEventListener('click', () => {
      this.showScreen('menu');
    });
    
    return screen;
  }

  updateBestScoresList() {
    if (!this.screens.menu) return;
    const list = this.screens.menu.querySelector('#bestScoresList');
    if (!list) return;
    
    list.innerHTML = GRID_SIZES.map(size => 
      `<div class="score-item"><span>${size}×${size}:</span><span>${this.storage.getBestScore(size)}</span></div>`
    ).join('');
  }

  showScreen(screenName) {
    this.hideAllScreens();
    
    if (screenName === 'menu') {
      this.updateBestScoresList();
    }
    
    if (screenName === 'selectSize') {
      const buttons = this.screens.selectSize.querySelectorAll('.btn-size');
      buttons.forEach(btn => {
        const size = parseInt(btn.dataset.size);
        btn.querySelector('.best').textContent = `Best: ${this.storage.getBestScore(size)}`;
      });
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
    
    this.updateBestScoresList();
    this.showScreen('gameOver');
  }

  isAnyScreenVisible() {
    return Object.values(this.screens).some(screen => 
      screen.style.display !== 'none'
    );
  }
}