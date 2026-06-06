import { GRID_SIZES } from '../core/Constants.js';
import { Storage } from '../storage/Storage.js';

export class UIManager {
  constructor(game, yandexSDK = null) {
    this.game = game;
    this.storage = new Storage();
    this.yandexSDK = yandexSDK;
    this.container = null;
    this.screens = {};
    this.lang = 'en';
  }

  t(key) {
    if (this.yandexSDK && this.yandexSDK.t && typeof this.yandexSDK.t === 'function') {
      return this.yandexSDK.t(key);
    }
    const fallback = {
      title: 'BLOCK PUZZLE',
      subtitle: 'Minecraft Edition',
      start: 'PLAY',
      selectGrid: 'SELECT GRID',
      back: 'BACK',
      score: 'SCORE',
      lines: 'LINES',
      gameOver: 'GAME OVER',
      playAgain: 'PLAY AGAIN',
      mainMenu: 'MAIN MENU',
      newBest: 'NEW HIGH SCORE!',
      bestScore: 'BEST',
      grid8: '8×8',
      grid10: '10×10',
      grid12: '12×12'
    };
    return fallback[key] || key;
  }

  setLang(lang) {
    this.lang = lang;
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
      <h1 class="title" data-i18n="title">BLOCK PUZZLE</h1>
      <h2 class="subtitle" data-i18n="subtitle">Minecraft Edition</h2>
      <button class="btn btn-primary" id="startBtn" data-i18n="start">START GAME</button>
      <div class="best-scores">
        <h3 data-i18n="bestScore">Best Score</h3>
        <div class="score-value" id="bestScoreValue">0</div>
      </div>
    `;
    
    const startBtn = screen.querySelector('#startBtn');
    startBtn.addEventListener('click', () => {
      this.showScreen('selectSize');
    });
    
    this.updateBestScore('bestScoreValue');
    this.applyTranslations(screen);
    
    return screen;
  }

  createSelectSizeScreen() {
    const screen = document.createElement('div');
    screen.className = 'screen select-size-screen';
    
    let buttonsHtml = GRID_SIZES.map(size => {
      const key = `grid${size}`;
      return `
        <button class="btn btn-size" data-size="${size}">
          <span data-i18n="${key}">${size}×${size}</span>
        </button>
      `;
    }).join('');
    
    screen.innerHTML = `
      <h2 data-i18n="selectGrid">SELECT GRID SIZE</h2>
      <div class="size-buttons">
        ${buttonsHtml}
      </div>
      <button class="btn btn-back" id="backToMenu" data-i18n="back">← BACK</button>
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
    
    this.applyTranslations(screen);
    
    return screen;
  }

  createGameOverScreen() {
    const screen = document.createElement('div');
    screen.className = 'screen gameover-screen';
    
    screen.innerHTML = `
      <h2 data-i18n="gameOver">GAME OVER</h2>
      <div class="final-score">
        <span class="label" data-i18n="score">SCORE</span>
        <span class="value" id="finalScore">0</span>
      </div>
      <div class="lines-cleared">
        <span class="label" data-i18n="lines">LINES</span>
        <span class="value" id="linesCleared">0</span>
      </div>
      <div class="new-best" id="newBest" data-i18n="newBest" style="display: none;">NEW HIGH SCORE!</div>
      <button class="btn btn-primary" id="playAgainBtn" data-i18n="playAgain">PLAY AGAIN</button>
      <button class="btn btn-back" id="toMenuBtn" data-i18n="mainMenu">MAIN MENU</button>
    `;
    
    screen.querySelector('#playAgainBtn').addEventListener('click', () => {
      const size = this.game.getGridSize();
      this.game.startGame(size);
      this.hideAllScreens();
    });
    
    screen.querySelector('#toMenuBtn').addEventListener('click', () => {
      this.showScreen('menu');
    });
    
    this.applyTranslations(screen);
    
    return screen;
  }

  applyTranslations(screen) {
    screen.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
  }

  updateAllTranslations() {
    Object.values(this.screens).forEach(screen => {
      this.applyTranslations(screen);
    });
  }

  async updateBestScore(elementId) {
    const bestScore = this.storage.getGlobalBest();
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
    
    this.applyTranslations(screen);
    this.updateBestScore('bestScoreValue');
    this.showScreen('gameOver');
  }

  isAnyScreenVisible() {
    return Object.values(this.screens).some(screen => 
      screen.style.display !== 'none'
    );
  }
}