/**
 * 信用卡处理模块
 * 提供卡号格式化、验证等功能
 */

class CreditCardHandler {
  constructor() {
    this.cardNumberInput = null;
    this.expiryInput = null;
    this.cvvInput = null;
    this.nameInput = null;
  }

  /**
   * 初始化信用卡表单
   */
  init() {
    this.cardNumberInput = document.getElementById('cardNumber');
    this.expiryInput = document.getElementById('cardExpiry');
    this.cvvInput = document.getElementById('cardCvv');
    this.nameInput = document.getElementById('cardName');

    if (this.cardNumberInput) {
      this.setupCardNumberInput();
    }

    if (this.expiryInput) {
      this.setupExpiryInput();
    }

    if (this.cvvInput) {
      this.setupCvvInput();
    }

    console.log('Credit card handler initialized');
  }

  /**
   * 设置卡号输入框
   */
  setupCardNumberInput() {
    this.cardNumberInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      
      // 限制为16位数字
      value = value.substring(0, 16);
      
      // 每4位添加空格
      const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
      e.target.value = formatted;

      // 实时验证
      this.validateCardNumber(value);
    });

    this.cardNumberInput.addEventListener('blur', (e) => {
      const value = e.target.value.replace(/\s/g, '');
      this.validateCardNumber(value);
    });
  }

  /**
   * 设置有效期输入框
   */
  setupExpiryInput() {
    this.expiryInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      
      // 限制为4位数字 (MMYY)
      value = value.substring(0, 4);
      
      // 添加斜杠
      if (value.length >= 2) {
        value = value.substring(0, 2) + ' / ' + value.substring(2);
      }
      
      e.target.value = value;

      // 实时验证
      this.validateExpiry(value.replace(/\s/g, '').replace('/', ''));
    });
  }

  /**
   * 设置CVV输入框
   */
  setupCvvInput() {
    this.cvvInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      
      // 限制为3-4位数字
      value = value.substring(0, 4);
      
      e.target.value = value;
    });
  }

  /**
   * 验证卡号（Luhn算法）
   */
  validateCardNumber(cardNumber) {
    if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
      this.setFieldError(this.cardNumberInput, i18n.t('errors.cardNumberInvalid'));
      return false;
    }

    // Luhn算法验证
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    const isValid = sum % 10 === 0;

    if (!isValid) {
      this.setFieldError(this.cardNumberInput, i18n.t('errors.cardNumberInvalid'));
    } else {
      this.clearFieldError(this.cardNumberInput);
    }

    return isValid;
  }

  /**
   * 验证有效期
   */
  validateExpiry(expiry) {
    if (!expiry || expiry.length !== 4) {
      this.setFieldError(this.expiryInput, i18n.t('errors.expirationInvalid'));
      return false;
    }

    const month = parseInt(expiry.substring(0, 2), 10);
    const year = parseInt('20' + expiry.substring(2, 4), 10);

    if (month < 1 || month > 12) {
      this.setFieldError(this.expiryInput, i18n.t('errors.expirationInvalid'));
      return false;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      this.setFieldError(this.expiryInput, i18n.t('errors.expirationInvalid'));
      return false;
    }

    this.clearFieldError(this.expiryInput);
    return true;
  }

  /**
   * 设置字段错误
   */
  setFieldError(input, message) {
    input.classList.add('error');
    
    // 查找或创建错误提示元素
    let errorElement = input.nextElementSibling;
    if (!errorElement || !errorElement.classList.contains('field-error')) {
      errorElement = document.createElement('div');
      errorElement.classList.add('field-error');
      input.parentNode.insertBefore(errorElement, input.nextSibling);
    }
    
    errorElement.textContent = message;
    errorElement.style.color = '#e10600';
    errorElement.style.fontSize = '12px';
    errorElement.style.marginTop = '4px';
  }

  /**
   * 清除字段错误
   */
  clearFieldError(input) {
    input.classList.remove('error');
    
    const errorElement = input.nextElementSibling;
    if (errorElement && errorElement.classList.contains('field-error')) {
      errorElement.remove();
    }
  }

  /**
   * 获取卡类型
   */
  getCardType(cardNumber) {
    const number = cardNumber.replace(/\s/g, '');
    
    // Visa
    if (/^4/.test(number)) {
      return 'visa';
    }
    
    // MasterCard
    if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) {
      return 'mastercard';
    }
    
    // American Express
    if (/^3[47]/.test(number)) {
      return 'amex';
    }
    
    // Discover
    if (/^6(?:011|5)/.test(number)) {
      return 'discover';
    }
    
    return 'unknown';
  }

  /**
   * 验证所有字段
   */
  validateAll() {
    const cardNumber = this.cardNumberInput.value.replace(/\s/g, '');
    const expiry = this.expiryInput.value.replace(/\s/g, '').replace('/', '');
    const cvv = this.cvvInput.value;
    const name = this.nameInput.value.trim();

    let isValid = true;

    if (!this.validateCardNumber(cardNumber)) {
      isValid = false;
    }

    if (!this.validateExpiry(expiry)) {
      isValid = false;
    }

    if (!cvv || cvv.length < 3) {
      this.setFieldError(this.cvvInput, i18n.t('errors.securityCodeRequired'));
      isValid = false;
    } else {
      this.clearFieldError(this.cvvInput);
    }

    if (!name) {
      this.setFieldError(this.nameInput, i18n.t('errors.nameOnCardRequired'));
      isValid = false;
    } else {
      this.clearFieldError(this.nameInput);
    }

    return isValid;
  }
}

// 创建全局实例
const creditCard = new CreditCardHandler();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  creditCard.init();
});

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CreditCardHandler;
}
