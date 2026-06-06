import { BLOCK_TYPES } from '../core/Constants.js';
import { Storage } from '../storage/Storage.js';

const MUSIC_TRACKS = [
  'assets/music/minecraft-style/Gentle Breeze.ogg',
  'assets/music/minecraft-style/Cuddle Clouds.ogg',
  "assets/music/minecraft-style/Wanderer's Tale.ogg",
  'assets/music/minecraft-style/Sunlight Through Leaves.ogg',
  'assets/music/minecraft-style/What Clouds Are Made Of.ogg'
];
const MUSIC_FADE_MS = 3000;
const MUSIC_GAP_MS = [30000, 90000];

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
    'assets/sfx/break.ogg'
  ],
  lineClearGem: [
    'assets/sfx/glass1.ogg',
    'assets/sfx/glass2.ogg',
    'assets/sfx/glass3.ogg'
  ],
  lineClearCombo: [
    'assets/sfx/successful_hit.ogg'
  ],
  lineClearBig: [
    'assets/sfx/levelup.ogg'
  ],
  anvilGameOver: [
    'assets/sfx/anvil_land.ogg'
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
    this.music = null;
    this.musicTimer = null;
    this.fadeTimer = null;
    this.currentTrack = null;
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
    MUSIC_TRACKS.forEach(path => {
      const audio = new Audio(path);
      audio.preload = 'auto';
    });
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

  playLineClear(lineCount, points, clearedCells = []) {
    const volume = Math.min(0.85, 0.45 + lineCount * 0.12);
    this.playSfx('lineClear', { volume, rate: 0.96 + lineCount * 0.035 });

    if (this.hasGemBlocks(clearedCells)) {
      window.setTimeout(() => this.playSfx('lineClearGem', { volume: 0.28, rate: 1.04 }), 45);
    }

    if (lineCount >= 2 && !this.isBigClear(lineCount, points)) {
      window.setTimeout(() => this.playSfx('lineClearCombo', { volume: 0.36, rate: 1 + lineCount * 0.04 }), 90);
    }

    if (this.isBigClear(lineCount, points)) {
      window.setTimeout(() => this.playSfx('lineClearBig', { volume: 0.5, rate: 1 }), 90);
      this.playFirework();
    }
  }

  hasGemBlocks(clearedCells) {
    return clearedCells.some(cell =>
      cell.blockType === BLOCK_TYPES.GOLD ||
      cell.blockType === BLOCK_TYPES.LAPIS ||
      cell.blockType === BLOCK_TYPES.EMERALD
    );
  }

  isBigClear(lineCount, points) {
    return lineCount >= 4 || points >= 1000;
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
    if (!this.userInteracted || !this.canPlayMusic() || MUSIC_TRACKS.length === 0) {
      this.stopMusic();
      return;
    }

    if (this.music && !this.music.paused) return;
    this.playNextTrack();
  }

  stopMusic() {
    window.clearTimeout(this.musicTimer);
    window.clearInterval(this.fadeTimer);
    this.musicTimer = null;
    this.fadeTimer = null;

    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
    }
  }

  playNextTrack() {
    if (!this.canPlayMusic() || MUSIC_TRACKS.length === 0) return;

    const track = MUSIC_TRACKS[Math.floor(Math.random() * MUSIC_TRACKS.length)];
    this.currentTrack = track;
    this.music = new Audio(track);
    this.music.preload = 'auto';
    this.music.volume = 0;
    this.music.addEventListener('ended', () => this.scheduleNextTrack());
    this.music.play().then(() => {
      this.fadeMusicTo(0.28, MUSIC_FADE_MS);
    }).catch(() => {});
  }

  scheduleNextTrack() {
    this.stopMusic();
    if (!this.canPlayMusic() || MUSIC_TRACKS.length === 0) return;

    const [min, max] = MUSIC_GAP_MS;
    const delay = min + Math.random() * (max - min);
    this.musicTimer = window.setTimeout(() => this.playNextTrack(), delay);
  }

  fadeMusicTo(volume, duration) {
    if (!this.music) return;

    window.clearInterval(this.fadeTimer);
    const startVolume = this.music.volume;
    const startedAt = performance.now();

    this.fadeTimer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - startedAt) / duration);
      this.music.volume = startVolume + (volume - startVolume) * progress;

      if (progress >= 1) {
        window.clearInterval(this.fadeTimer);
        this.fadeTimer = null;
      }
    }, 50);
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
