/**
 * 语言切换器组件
 * 提供语言切换UI功能
 */

class LanguageSwitcher {
  constructor() {
    this.switcherElement = null;
    this.supportedLocales = {
      'en': 'English',
      'zh-CN': '中文'
    };
  }

  /**
   * 初始化语言切换器
   */
  init() {
    // 创建语言切换器UI
    this.createSwitcher();
    
    // 设置当前语言
    this.updateActiveLanguage();

    // 监听语言切换事件
    window.addEventListener('localeChanged', () => {
      this.updateActiveLanguage();
    });

    console.log('Language switcher initialized');
  }

  /**
   * 创建语言切换器UI
   */
  createSwitcher() {
    this.switcherElement = document.createElement('div');
    this.switcherElement.className = 'language-switcher';
    this.switcherElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      gap: 10px;
      background: white;
      padding: 10px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;

    // 创建语言按钮
    Object.entries(this.supportedLocales).forEach(([code, name]) => {
      const button = document.createElement('button');
      button.className = 'lang-btn';
      button.textContent = name;
      button.dataset.locale = code;
      button.style.cssText = `
        padding: 8px 16px;
        border: 2px solid #e0e0e0;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s ease;
      `;

      button.addEventListener('click', () => {
        this.switchLanguage(code);
      });

      button.addEventListener('mouseenter', () => {
        button.style.borderColor = '#e10600';
        button.style.color = '#e10600';
      });

      button.addEventListener('mouseleave', () => {
        if (!button.classList.contains('active')) {
          button.style.borderColor = '#e0e0e0';
          button.style.color = 'inherit';
        }
      });

      this.switcherElement.appendChild(button);
    });

    // 添加到页面
    document.body.appendChild(this.switcherElement);
  }

  /**
   * 切换语言
   */
  async switchLanguage(locale) {
    await i18n.setLocale(locale);
    
    // 更新URL参数
    const url = new URL(window.location);
    url.searchParams.set('lang', locale);
    window.history.pushState({}, '', url);
  }

  /**
   * 更新当前激活的语言按钮
   */
  updateActiveLanguage() {
    const buttons = this.switcherElement.querySelectorAll('.lang-btn');
    const currentLocale = i18n.getCurrentLocale();

    buttons.forEach(button => {
      if (button.dataset.locale === currentLocale) {
        button.classList.add('active');
        button.style.cssText = `
          padding: 8px 16px;
          border: 2px solid #e10600;
          background: #e10600;
          color: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
        `;
      } else {
        button.classList.remove('active');
        button.style.cssText = `
          padding: 8px 16px;
          border: 2px solid #e0e0e0;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
        `;
      }
    });
  }
}

// 创建全局实例
const languageSwitcher = new LanguageSwitcher();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  languageSwitcher.init();
});

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LanguageSwitcher;
}
