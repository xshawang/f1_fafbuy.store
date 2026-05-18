/**
 * 国家选择器组件
 * 支持多语言显示国家列表
 */

class CountrySelector {
  constructor() {
    this.countries = [];
    this.selectElement = null;
  }

  /**
   * 初始化国家选择器
   */
  async init() {
    try {
      // 加载国家数据
      const response = await fetch('./js/countries.json');
      this.countries = await response.json();

      // 查找国家选择框
      this.selectElement = document.getElementById('countrySelect');

      if (this.selectElement) {
        this.populateCountries();
        
        // 监听语言切换事件
        window.addEventListener('localeChanged', () => {
          this.populateCountries();
        });
      }

      console.log('Country selector initialized');
    } catch (error) {
      console.error('Failed to initialize country selector:', error);
    }
  }

  /**
   * 填充国家列表
   */
  populateCountries() {
    if (!this.selectElement) return;

    // 清空现有选项
    this.selectElement.innerHTML = '';

    // 添加默认选项
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = i18n.t('checkout.country');
    defaultOption.disabled = true;
    defaultOption.selected = true;
    this.selectElement.appendChild(defaultOption);

    // 根据国家代码排序
    const sortedCountries = [...this.countries].sort((a, b) => {
      const nameA = i18n.getCurrentLocale() === 'zh-CN' ? a.nameZh : a.name;
      const nameB = i18n.getCurrentLocale() === 'zh-CN' ? b.nameZh : b.name;
      return nameA.localeCompare(nameB);
    });

    // 添加国家选项
    sortedCountries.forEach(country => {
      const option = document.createElement('option');
      option.value = country.code;
      option.textContent = i18n.getCurrentLocale() === 'zh-CN' ? country.nameZh : country.name;
      this.selectElement.appendChild(option);
    });
  }

  /**
   * 获取选中的国家代码
   */
  getSelectedCountryCode() {
    return this.selectElement ? this.selectElement.value : '';
  }

  /**
   * 获取选中的国家信息
   */
  getSelectedCountry() {
    const code = this.getSelectedCountryCode();
    return this.countries.find(c => c.code === code);
  }

  /**
   * 设置选中的国家
   */
  setCountry(code) {
    if (this.selectElement && code) {
      this.selectElement.value = code;
    }
  }
}

// 创建全局实例
const countrySelector = new CountrySelector();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  countrySelector.init();
});

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CountrySelector;
}
