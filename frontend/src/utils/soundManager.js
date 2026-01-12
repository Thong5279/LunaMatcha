// Quản lý sound effects với settings
class SoundManager {
  constructor() {
    this.enabled = localStorage.getItem('soundEnabled') !== 'false';
    // Preload sounds để tránh delay
    this.sounds = {};
    this.loadSounds();
  }
  
  loadSounds() {
    // Sử dụng base64 encoded sounds hoặc public folder
    // Nếu không có file, sẽ không bị lỗi
    try {
      this.sounds.addProduct = new Audio('/sounds/add-product.mp3');
      this.sounds.addProduct.volume = 0.3;
      this.sounds.addProduct.preload = 'auto';
    } catch (e) {
      console.warn('Could not load add-product sound:', e);
    }
    
    try {
      this.sounds.milestone = new Audio('/sounds/milestone.mp3');
      this.sounds.milestone.volume = 0.5;
      this.sounds.milestone.preload = 'auto';
    } catch (e) {
      console.warn('Could not load milestone sound:', e);
    }
  }
  
  play(soundName) {
    if (this.enabled && this.sounds[soundName]) {
      // Reset sound để có thể play lại ngay
      this.sounds[soundName].currentTime = 0;
      this.sounds[soundName].play().catch((err) => {
        // Ignore errors (user might not have interacted yet)
        console.debug('Sound play error (expected on first interaction):', err);
      });
    }
  }
  
  setEnabled(enabled) {
    this.enabled = enabled;
    localStorage.setItem('soundEnabled', enabled);
  }
  
  isEnabled() {
    return this.enabled;
  }
}

export default new SoundManager();

