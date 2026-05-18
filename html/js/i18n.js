/**
 * F1 结算页面国际化模块
 * 支持中英文切换
 */

class I18nManager {
  constructor() {
    this.currentLocale = 'en';
    this.locales = {};
    this.isInitialized = false;
  }

  /**
   * 初始化国际化模块
   */
  async init() {
    try {
      // 加载语言包
      const [enResponse, zhResponse] = await Promise.all([
        fetch('./locales/en.json'),
        fetch('./locales/zh-CN.json')
      ]);

      this.locales['en'] = await enResponse.json();
      this.locales['zh-CN'] = await zhResponse.json();

      // 检测浏览器语言
      this.detectBrowserLanguage();

      // 应用翻译
      this.applyTranslations();

      this.isInitialized = true;
      console.log('I18n initialized with locale:', this.currentLocale);
    } catch (error) {
      console.error('Failed to initialize i18n:', error);
    }
  }

  /**
   * 检测浏览器语言
   */
  detectBrowserLanguage() {
    // 优先检查 URL 是否包含 zh-CN
    const currentUrl = window.location.href;
    if (currentUrl.includes('zh-CN')) {
      this.currentLocale = 'zh-CN';
    } else if (currentUrl.includes('en')) {
      this.currentLocale = 'en';
    } else {
      // 如果没有明确的语言标识，检测浏览器语言
      const browserLang = navigator.language || navigator.userLanguage;
      
      if (browserLang.startsWith('zh')) {
        this.currentLocale = 'zh-CN';
      } else {
        this.currentLocale = 'en';
      }
    }

    // 检查 URL 参数（优先级最高）
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && this.locales[langParam]) {
      this.currentLocale = langParam;
    }
  }

  /**
   * 切换语言
   */
  async setLocale(locale) {
    if (this.locales[locale]) {
      this.currentLocale = locale;
      this.applyTranslations();
      console.log('Language switched to:', locale);
    }
  }

  /**
   * 获取翻译文本
   */
  t(key) {
    const keys = key.split('.');
    let value = this.locales[this.currentLocale];

    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    return value;
  }

  /**
   * 应用翻译到页面
   */
  applyTranslations() {
    // 更新所有带有 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        if (element.getAttribute('placeholder')) {
          element.setAttribute('placeholder', translation);
        } else {
          element.value = translation;
        }
      } else if (element.tagName === 'IMG') {
        element.setAttribute('alt', translation);
      } else {
        element.textContent = translation;
      }
    });

    // 更新带有 data-i18n-placeholder 属性的输入框
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.setAttribute('placeholder', this.t(key));
    });

    // 更新 HTML lang 属性
    document.documentElement.lang = this.currentLocale;

    // 更新页面标题
    document.title = this.t('site.title');

    // 触发语言切换事件
    window.dispatchEvent(new CustomEvent('localeChanged', {
      detail: { locale: this.currentLocale }
    }));
  }

  /**
   * 获取当前语言
   */
  getCurrentLocale() {
    return this.currentLocale;
  }

  /**
   * 获取所有支持的语言
   */
  getSupportedLocales() {
    return Object.keys(this.locales);
  }
}

// 创建全局实例
const i18n = new I18nManager();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  i18n.init();
});

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18nManager;
}
