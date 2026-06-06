import { STORAGE_KEYS, GRID_SIZES } from '../core/Constants.js';

export class Storage {
  constructor() {
    this.bestScores = this.loadBestScores();
    this.settings = this.loadSettings();
  }

  loadBestScores() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BEST_SCORES);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load best scores:', e);
    }
    
    const scores = {};
    GRID_SIZES.forEach(size => {
      scores[size] = 0;
    });
    return scores;
  }

  saveBestScores() {
    try {
      localStorage.setItem(STORAGE_KEYS.BEST_SCORES, JSON.stringify(this.bestScores));
    } catch (e) {
      console.warn('Failed to save best scores:', e);
    }
  }

  getBestScore(gridSize) {
    return this.bestScores[gridSize] || 0;
  }

  getGlobalBest() {
    return Math.max(...Object.values(this.bestScores));
  }

  updateBestScore(gridSize, score) {
    if (score > this.bestScores[gridSize]) {
      this.bestScores[gridSize] = score;
      this.saveBestScores();
      return true;
    }
    return false;
  }

  loadSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return this.normalizeSettings(JSON.parse(data));
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
    return this.normalizeSettings({});
  }

  normalizeSettings(settings) {
    return {
      soundEnabled: true,
      musicEnabled: true,
      sfxEnabled: true,
      vibrationEnabled: true,
      ...settings
    };
  }

  saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  setSoundEnabled(enabled) {
    this.settings.soundEnabled = enabled;
    this.saveSettings();
  }

  isSoundEnabled() {
    return this.settings.soundEnabled;
  }

  setMusicEnabled(enabled) {
    this.settings.musicEnabled = enabled;
    this.saveSettings();
  }

  isMusicEnabled() {
    return this.settings.musicEnabled;
  }

  setSfxEnabled(enabled) {
    this.settings.sfxEnabled = enabled;
    this.saveSettings();
  }

  isSfxEnabled() {
    return this.settings.sfxEnabled;
  }

  setVibrationEnabled(enabled) {
    this.settings.vibrationEnabled = enabled;
    this.saveSettings();
  }

  isVibrationEnabled() {
    return this.settings.vibrationEnabled;
  }
}
