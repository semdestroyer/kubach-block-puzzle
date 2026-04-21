export const TRANSLATIONS = {
  ru: {
    title: 'BLOCK PUZZLE',
    subtitle: 'Minecraft Edition',
    start: 'ИГРАТЬ',
    selectGrid: 'ВЫБЕРИ РАЗМЕР',
    back: 'НАЗАД',
    score: 'СЧЁТ',
    lines: 'ЛИНИИ',
    gameOver: 'ИГРА ОКОНЧЕНА',
    playAgain: 'ЕЩЁ РАЗ',
    mainMenu: 'ГЛАВНОЕ МЕНЮ',
    newBest: 'НОВЫЙ РЕКОРД!',
    bestScore: 'ЛУЧШИЙ',
    grid8: '8×8',
    grid10: '10×10',
    grid12: '12×12'
  },
  en: {
    title: 'BLOCK PUZZLE',
    subtitle: 'Minecraft Edition',
    start: 'START',
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
  }
};

export class YandexSDK {
  constructor() {
    this.ysdk = null;
    this.player = null;
    this.initialized = false;
    this.lang = 'en';
    this._t = TRANSLATIONS.en;
  }

  async init() {
    return new Promise((resolve) => {
      if (window.YaGames) {
        window.YaGames.init({})
          .then(ysdk => {
            this.ysdk = ysdk;
            this.initialized = true;
            
            try {
              const envLang = ysdk.environment?.i18n?.lang;
              if (envLang && TRANSLATIONS[envLang]) {
                this.lang = envLang;
                this._t = TRANSLATIONS[envLang];
              }
            } catch (e) {
              console.warn('Could not get lang from environment');
            }
            
            console.log('Yandex SDK initialized, lang:', this.lang);
            resolve(true);
          })
          .catch(err => {
            console.warn('Yandex SDK init failed:', err);
            this._t = TRANSLATIONS.en;
            resolve(false);
          });
      } else {
        console.warn('YaGames SDK not found, using default lang');
        this._t = TRANSLATIONS.en;
        resolve(false);
      }
    });
  }

  t(key) {
    return this._t[key] || TRANSLATIONS.en[key] || key;
  }

  isAvailable() {
    return this.initialized && this.ysdk !== null;
  }

  async getPlayer() {
    if (!this.isAvailable()) return null;
    
    try {
      this.player = await this.ysdk.getPlayer();
      return this.player;
    } catch (e) {
      console.warn('Get player failed:', e);
      return null;
    }
  }

  async getLeaderboards() {
    if (!this.isAvailable()) return null;
    
    try {
      return await this.ysdk.getLeaderboards();
    } catch (e) {
      console.warn('Leaderboards not available:', e);
      return null;
    }
  }

  async setLeaderboardScore(score) {
    const lb = await this.getLeaderboards();
    if (!lb) return false;
    
    try {
      await lb.setLeaderboardScore('scores', score);
      return true;
    } catch (e) {
      console.warn('Set leaderboard score failed:', e);
      return false;
    }
  }

  async getLeaderboardEntries() {
    const lb = await this.getLeaderboards();
    if (!lb) return null;
    
    try {
      return await lb.getLeaderboardEntries('scores', {
        quantityAround: 3,
        quantityTop: 3
      });
    } catch (e) {
      console.warn('Get leaderboard entries failed:', e);
      return null;
    }
  }

  async showInterstitial() {
    if (!this.isAvailable()) return;
    
    try {
      await this.ysdk.interstitial.show();
    } catch (e) {
      console.warn('Interstitial show failed:', e);
    }
  }

  async canShowInterstitial() {
    if (!this.isAvailable()) return false;
    
    try {
      return await this.ysdk.canShowInterstitial();
    } catch (e) {
      return false;
    }
  }

  async showRewardedVideo() {
    if (!this.isAvailable()) return false;
    
    try {
      await this.ysdk.adv.showRewardedVideo({
        callbacks: {
          onOpen: () => {},
          onClose: (wasShown) => {},
          onError: (e) => {},
          onCryptoTickerOk: () => {},
          onCryptoTickerError: () => {}
        }
      });
      return true;
    } catch (e) {
      console.warn('Rewarded video failed:', e);
      return false;
    }
  }
}