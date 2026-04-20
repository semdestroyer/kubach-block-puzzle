export const GRID_SIZES = [8, 10, 12];

export const BLOCK_TYPES = {
  EMPTY: 0,
  DIRT: 1,
  STONE: 2,
  COBBLESTONE: 3,
  WOOD_PLANKS: 4,
  GOLD: 5,
  LAPIS: 6,
  EMERALD: 7,
  REDSTONE: 8
};

export const BLOCK_ASSETS = {
  [BLOCK_TYPES.DIRT]: 'dirt.png',
  [BLOCK_TYPES.STONE]: 'stone.png',
  [BLOCK_TYPES.COBBLESTONE]: 'coal_block.png',
  [BLOCK_TYPES.WOOD_PLANKS]: 'planks_oak.png',
  [BLOCK_TYPES.GOLD]: 'gold_block.png',
  [BLOCK_TYPES.LAPIS]: 'lapis_block.png',
  [BLOCK_TYPES.EMERALD]: 'emerald_block.png',
  [BLOCK_TYPES.REDSTONE]: 'redstone_block.png'
};

export const STORAGE_KEYS = {
  BEST_SCORES: 'blockpuzzle_best_scores',
  SETTINGS: 'blockpuzzle_settings'
};

export const UI_CONFIG = {
  PIECE_PREVIEW_SIZE: 50,
  GRID_CELL_SIZE: 40,
  GRID_GAP: 2,
  ANIMATION_SPEED: 150,
  TOUCH_DEADZONE: 10
};