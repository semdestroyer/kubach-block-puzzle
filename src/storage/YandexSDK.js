export class YandexSDK {
  constructor() {
    this.ysdk = null;
    this.player = null;
    this.initialized = false;
  }

  async init() {
    return new Promise((resolve) => {
      if (window.YaGames) {
        window.YaGames.init({})
          .then(ysdk => {
            this.ysdk = ysdk;
            this.initialized = true;
            console.log('Yandex SDK initialized');
            resolve(true);
          })
          .catch(err => {
            console.warn('Yandex SDK init failed:', err);
            resolve(false);
          });
      } else {
        console.warn('YaGames SDK not found');
        resolve(false);
      }
    });
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
      await lb.setLeaderboardScore('blockpuzzle', score);
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
      return await lb.getLeaderboardEntries('blockpuzzle', {
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