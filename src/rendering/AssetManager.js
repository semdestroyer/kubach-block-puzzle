import { BLOCK_ASSETS, BLOCK_TYPES } from '../core/Constants.js';

export class AssetManager {
  constructor() {
    this.textures = new Map();
    this.loadingPromise = null;
  }

  async load() {
    const loadPromises = Object.entries(BLOCK_ASSETS).map(([type, filename]) => {
      return this.loadTexture(parseInt(type), `assets/${filename}`);
    });
    
    loadPromises.push(this.loadTexture('empty', 'assets/tab_items.png'));
    loadPromises.push(this.loadTexture('particles', 'assets/particles.png'));
    
    await Promise.all(loadPromises);
  }

  async loadTexture(key, path) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.textures.set(key, img);
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`Failed to load texture: ${path}`);
        this.textures.set(key, null);
        resolve(null);
      };
      img.src = path;
    });
  }

  getTexture(key) {
    return this.textures.get(key);
  }

  getBlockTexture(blockType) {
    if (blockType === BLOCK_TYPES.EMPTY) {
      return this.getTexture('empty');
    }
    return this.getTexture(blockType);
  }
}
