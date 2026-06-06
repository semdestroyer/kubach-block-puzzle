export const TRANSLATIONS = {
  ru: {
    title: 'Кубач',
    subtitle: 'БЛОК ПАЗЛ',
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
    grid12: '12×12',
    soundMaster: 'Звук',
    music: 'Музыка',
    sfx: 'Эффекты',
    soundOn: 'вкл',
    soundOff: 'выкл'
  },
  en: {
    title: 'Blockle',
    subtitle: 'BLOCK PUZZLE',
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
    grid12: '12×12',
    soundMaster: 'Sound',
    music: 'Music',
    sfx: 'Effects',
    soundOn: 'on',
    soundOff: 'off'
  }
};

export class YandexSDK {
  constructor() {
    this.ysdk = null;
    this.player = null;
    this.initialized = false;
    this.lang = 'en';
    this._t = TRANSLATIONS.en;
    this.pauseCallbacks = new Set();
    this.resumeCallbacks = new Set();
    this.isPaused = false;
    this.browserEventsBound = false;
  }

  async init() {
    this.setupBrowserPauseEvents();

    return new Promise((resolve) => {
      if (window.YaGames) {
        window.YaGames.init({})
          .then(ysdk => {
            this.ysdk = ysdk;
            this.initialized = true;
            this.setupYandexPauseEvents();

            try {
              const envLang = ysdk.environment.i18n.lang;
              if (envLang && TRANSLATIONS[envLang]) {
                this.lang = envLang;
                this._t = TRANSLATIONS[envLang];
              } else {
                this.detectBrowserLang();
              }
            } catch (e) {
              this.detectBrowserLang();
            }

            console.log('Yandex SDK initialized, lang:', this.lang);
            resolve(true);
          })
          .catch(err => {
            console.warn('Yandex SDK init failed:', err);
            this.detectBrowserLang();
            resolve(false);
          });
      } else {
        console.warn('YaGames SDK not found, using browser lang');
        this.detectBrowserLang();
        resolve(false);
      }
    });
  }

  setupYandexPauseEvents() {
    if (!this.ysdk?.on) return;

    this.ysdk.on('game_api_pause', () => {
      this.handlePlatformPause();
    });
    this.ysdk.on('game_api_resume', () => {
      this.handlePlatformResume();
    });
  }

  setupBrowserPauseEvents() {
    if (this.browserEventsBound) return;
    this.browserEventsBound = true;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handlePlatformPause();
      } else {
        this.handlePlatformResume();
      }
    });

    window.addEventListener('blur', () => this.handlePlatformPause());
    window.addEventListener('focus', () => {
      if (!document.hidden) {
        this.handlePlatformResume();
      }
    });
    window.addEventListener('pagehide', () => this.handlePlatformPause());
  }

  handlePlatformPause() {
    if (this.isPaused) return;
    this.isPaused = true;
    this.pauseCallbacks.forEach(callback => callback());
  }

  handlePlatformResume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.resumeCallbacks.forEach(callback => callback());
  }

  onPause(callback) {
    this.pauseCallbacks.add(callback);
  }

  onResume(callback) {
    this.resumeCallbacks.add(callback);
  }

  detectBrowserLang() {
    const browserLang = navigator.language || navigator.userLanguage || 'en';
    const lang = browserLang.split('-')[0];
    if (TRANSLATIONS[lang]) {
      this.lang = lang;
      this._t = TRANSLATIONS[lang];
    } else {
      this.lang = 'en';
      this._t = TRANSLATIONS.en;
    }
  }

  gameReady() {
    if (this.ysdk && this.ysdk.features && this.ysdk.features.LoadingAPI) {
      this.ysdk.features.LoadingAPI.ready();
      console.log('GameReady API called');
    }
  }

  gameplayStart() {
    try {
      this.ysdk?.features?.GameplayAPI?.start();
    } catch (e) {
      console.warn('GameplayAPI start failed:', e);
    }
  }

  gameplayStop() {
    try {
      this.ysdk?.features?.GameplayAPI?.stop();
    } catch (e) {
      console.warn('GameplayAPI stop failed:', e);
    }
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
      this.gameplayStop();
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
      this.gameplayStop();
      await this.ysdk.adv.showRewardedVideo({
        callbacks: {
          onOpen: () => this.handlePlatformPause(),
          onClose: () => this.handlePlatformResume(),
          onError: () => this.handlePlatformResume(),
          onRewarded: () => {},
          onCryptoTickerOk: () => {},
          onCryptoTickerError: () => {}
        }
      });
      return true;
    } catch (e) {
      console.warn('Rewarded video failed:', e);
      this.handlePlatformResume();
      return false;
    }
  }
}
