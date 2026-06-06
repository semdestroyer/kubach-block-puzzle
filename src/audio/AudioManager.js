import { BLOCK_TYPES } from '../core/Constants.js';
import { Storage } from '../storage/Storage.js';

const MUSIC_PATH = 'assets/music/heavenly-loop.ogg';

const SFX = {
  pickup: [
    'assets/sfx/dig/cloth1.ogg',
    'assets/sfx/dig/cloth2.ogg'
  ],
  invalid: [
    'assets/sfx/dig/gravel1.ogg',
    'assets/sfx/dig/sand1.ogg'
  ],
  stone: [
    'assets/sfx/dig/stone1.ogg',
    'assets/sfx/dig/stone2.ogg',
    'assets/sfx/dig/stone3.ogg',
    'assets/sfx/dig/stone4.ogg'
  ],
  wood: [
    'assets/sfx/dig/wood1.ogg',
    'assets/sfx/dig/wood2.ogg',
    'assets/sfx/dig/wood3.ogg',
    'assets/sfx/dig/wood4.ogg'
  ],
  grass: [
    'assets/sfx/dig/grass1.ogg',
    'assets/sfx/dig/grass2.ogg',
    'assets/sfx/dig/grass3.ogg',
    'assets/sfx/dig/grass4.ogg'
  ],
  sand: [
    'assets/sfx/dig/sand1.ogg',
    'assets/sfx/dig/sand2.ogg',
    'assets/sfx/dig/sand3.ogg',
    'assets/sfx/dig/sand4.ogg'
  ],
  redstone: [
    'assets/sfx/dig/gravel2.ogg',
    'assets/sfx/dig/gravel3.ogg',
    'assets/sfx/dig/stone4.ogg'
  ],
  lineClear: [
    'assets/sfx/dig/stone1.ogg',
    'assets/sfx/dig/stone2.ogg',
    'assets/sfx/dig/wood3.ogg'
  ],
  gameOver: [
    'assets/sfx/dig/snow1.ogg',
    'assets/sfx/dig/snow2.ogg'
  ],
  newBest: [
    'assets/sfx/fireworks/twinkle1.ogg'
  ],
  fireworkLaunch: [
    'assets/sfx/fireworks/launch1.ogg'
  ],
  fireworkBlast: [
    'assets/sfx/fireworks/blast1.ogg',
    'assets/sfx/fireworks/largeBlast1.ogg'
  ],
  fireworkTwinkle: [
    'assets/sfx/fireworks/twinkle1.ogg',
    'assets/sfx/fireworks/twinkle_far1.ogg'
  ]
};

export class AudioManager {
  constructor(storage = new Storage()) {
    this.storage = storage;
    this.buffers = new Map();
    this.music = new Audio(MUSIC_PATH);
    this.music.loop = true;
    this.music.preload = 'auto';
    this.music.volume = 0.28;
    this.userInteracted = false;
    this.platformPaused = false;
  }

  preload() {
    Object.values(SFX).flat().forEach(path => {
      if (!this.buffers.has(path)) {
        const audio = new Audio(path);
        audio.preload = 'auto';
        this.buffers.set(path, audio);
      }
    });
    this.music.load();
  }

  unlock() {
    if (this.userInteracted) return;
    this.userInteracted = true;
    this.startMusic();
  }

  isMasterEnabled() {
    return this.storage.isSoundEnabled();
  }

  canPlaySfx() {
    return this.isMasterEnabled() && this.storage.isSfxEnabled() && !this.platformPaused;
  }

  canPlayMusic() {
    return this.isMasterEnabled() && this.storage.isMusicEnabled() && !this.platformPaused;
  }

  playSfx(name, options = {}) {
    if (!this.canPlaySfx()) return;

    const paths = SFX[name];
    if (!paths || paths.length === 0) return;

    const path = paths[Math.floor(Math.random() * paths.length)];
    const source = this.buffers.get(path) || new Audio(path);
    const sound = source.cloneNode();
    sound.volume = Math.max(0, Math.min(1, options.volume ?? 0.55));
    sound.playbackRate = options.rate ?? (0.92 + Math.random() * 0.18);
    sound.play().catch(() => {});
  }

  playBlockPlace(blockType) {
    const sound = this.getBlockSound(blockType);
    this.playSfx(sound, { volume: blockType === BLOCK_TYPES.REDSTONE ? 0.62 : 0.5 });
  }

  playLineClear(lineCount, points) {
    const volume = Math.min(0.85, 0.45 + lineCount * 0.12);
    this.playSfx('lineClear', { volume, rate: 1 + lineCount * 0.04 });

    if (lineCount >= 3 || points >= 600) {
      this.playFirework();
    }
  }

  playFirework() {
    this.playSfx('fireworkLaunch', { volume: 0.45, rate: 1 });
    window.setTimeout(() => this.playSfx('fireworkBlast', { volume: 0.78, rate: 0.96 }), 180);
    window.setTimeout(() => this.playSfx('fireworkTwinkle', { volume: 0.48, rate: 1.05 }), 340);
  }

  getBlockSound(blockType) {
    if (blockType === BLOCK_TYPES.WOOD_PLANKS) return 'wood';
    if (blockType === BLOCK_TYPES.DIRT) return 'grass';
    if (blockType === BLOCK_TYPES.GOLD || blockType === BLOCK_TYPES.EMERALD) return 'stone';
    if (blockType === BLOCK_TYPES.REDSTONE) return 'redstone';
    if (blockType === BLOCK_TYPES.LAPIS) return 'sand';
    return 'stone';
  }

  startMusic() {
    if (!this.userInteracted || !this.canPlayMusic()) {
      this.stopMusic();
      return;
    }

    this.music.volume = 0.28;
    this.music.play().catch(() => {});
  }

  stopMusic() {
    this.music.pause();
  }

  setMasterEnabled(enabled) {
    this.storage.setSoundEnabled(enabled);
    if (enabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  setMusicEnabled(enabled) {
    this.storage.setMusicEnabled(enabled);
    if (enabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  setSfxEnabled(enabled) {
    this.storage.setSfxEnabled(enabled);
  }

  handlePlatformPause() {
    this.platformPaused = true;
    this.stopMusic();
  }

  handlePlatformResume() {
    this.platformPaused = false;
    this.startMusic();
  }

  getSettings() {
    return {
      soundEnabled: this.storage.isSoundEnabled(),
      musicEnabled: this.storage.isMusicEnabled(),
      sfxEnabled: this.storage.isSfxEnabled()
    };
  }
}
