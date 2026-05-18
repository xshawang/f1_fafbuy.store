# F1 结算页面国际化集成指南

## 文件结构

```
html/
├── F1 Experiences.html              # 原始英文页面
├── F1 Experiences_zh-CN.html        # 原始中文页面
├── checkout.html                    # 合并后的多语言页面（需创建）
├── locales/
│   ├── en.json                     # 英文语言包 ✓
│   └── zh-CN.json                  # 中文语言包 ✓
└── js/
    ├── i18n.js                     # 国际化核心模块 ✓
    ├── credit-card.js              # 信用卡处理模块 ✓
    ├── country-selector.js         # 国家选择器模块 ✓
    ├── language-switcher.js        # 语言切换器模块 ✓
    └── countries.json              # 国家数据 ✓
```

## 集成步骤

### 1. 在 HTML 页面中添加必要的引用

在 `F1 Experiences.html` 或创建新的 `checkout.html` 中，在 `</body>` 标签前添加：

```html
<!-- 国际化模块 -->
<script src="./js/i18n.js"></script>
<script src="./js/credit-card.js"></script>
<script src="./js/country-selector.js"></script>
<script src="./js/language-switcher.js"></script>
```

### 2. 替换 checkoutAddress 区域

找到页面中的 `id="checkoutAddress"` 区域，将其内容全部替换为以下信用卡输入表单：

```html
<div id="checkoutAddress" class="credit-card-section">
  <h3 data-i18n="checkout.creditCard">Credit Card</h3>
  
  <div class="form-group">
    <label data-i18n="checkout.cardNumber">Card number</label>
    <input 
      type="text" 
      id="cardNumber" 
      data-i18n-placeholder="checkout.cardNumberPlaceholder"
      placeholder="Card number"
      maxlength="19"
      required
    >
  </div>

  <div class="form-row">
    <div class="form-group">
      <label data-i18n="checkout.expirationDate">Expiration date</label>
      <input 
        type="text" 
        id="cardExpiry" 
        data-i18n-placeholder="checkout.expirationDate"
        placeholder="MM / YY"
        maxlength="7"
        required
      >
    </div>

    <div class="form-group">
      <label data-i18n="checkout.securityCode">Security code</label>
      <input 
        type="text" 
        id="cardCvv" 
        data-i18n-placeholder="checkout.securityCode"
        placeholder="CVV"
        maxlength="4"
        required
      >
    </div>
  </div>

  <div class="form-group">
    <label data-i18n="checkout.nameOnCard">Name on card</label>
    <input 
      type="text" 
      id="cardName" 
      data-i18n-placeholder="checkout.nameOnCardPlaceholder"
      placeholder="Name on card"
      required
    >
  </div>

  <!-- 国家选择器 -->
  <div class="form-group">
    <label data-i18n="checkout.country">Country/Region</label>
    <select id="countrySelect" required>
      <option value="" disabled selected data-i18n="checkout.country">Country/Region</option>
    </select>
  </div>
</div>
```

### 3. 添加信用卡表单样式

在页面的 `<head>` 中添加信用卡表单样式：

```html
<style>
.credit-card-section {
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  margin: 20px 0;
}

.credit-card-section h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 18px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #555;
  font-size: 14px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #e10600;
  box-shadow: 0 0 0 2px rgba(225, 6, 0, 0.1);
}

.form-group input.error {
  border-color: #e10600;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.field-error {
  color: #e10600;
  font-size: 12px;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
```

### 4. 标记需要国际化的文本

在原始HTML中，将所有需要国际化的文本添加 `data-i18n` 属性。例如：

**英文版本：**
```html
<h1 data-i18n="checkout.title">Checkout</h1>
<label data-i18n="checkout.email">Email</label>
<input data-i18n-placeholder="checkout.emailPlaceholder" placeholder="Email address">
```

**中文版本：**
```html
<h1 data-i18n="checkout.title">结账</h1>
<label data-i18n="checkout.email">电子邮箱</label>
<input data-i18n-placeholder="checkout.emailPlaceholder" placeholder="电子邮箱地址">
```

### 5. 验证集成

打开页面后，应该能够：
1. ✅ 看到右上角的语言切换按钮（English / 中文）
2. ✅ 点击按钮切换语言，页面文本自动更新
3. ✅ checkoutAddress 区域显示信用卡输入框
4. ✅ 卡号输入自动格式化（每4位添加空格）
5. ✅ 有效期输入自动格式化（MM / YY）
6. ✅ 国家下拉列表根据当前语言显示
7. ✅ 输入验证实时提示错误信息

## 使用示例

### 在 JavaScript 中使用国际化

```javascript
// 获取翻译文本
const title = i18n.t('checkout.title');

// 切换语言
await i18n.setLocale('zh-CN');

// 获取当前语言
const currentLang = i18n.getCurrentLocale();
```

### 使用信用卡验证

```javascript
// 验证所有信用卡字段
const isValid = creditCard.validateAll();

if (isValid) {
  // 提交表单
  console.log('信用卡信息验证通过');
}
```

### 使用国家选择器

```javascript
// 获取选中的国家代码
const countryCode = countrySelector.getSelectedCountryCode();

// 设置默认国家
countrySelector.setCountry('US');
```

## 注意事项

1. **安全性**：信用卡信息传输必须使用 HTTPS
2. **PCI DSS 合规**：生产环境建议使用第三方支付SDK（如 Stripe、PayPal）
3. **数据验证**：前后端都需要进行数据验证
4. **错误处理**：所有异步操作都包含错误处理
5. **浏览器兼容**：支持现代浏览器（Chrome、Firefox、Safari、Edge）

## 扩展语言包

如需添加更多语言，只需：

1. 在 `locales/` 目录下创建新的 JSON 文件（如 `ja.json`）
2. 复制 `en.json` 的结构并翻译内容
3. 在 `language-switcher.js` 中添加新语言选项

## 技术支持

如有问题，请检查：
- 浏览器控制台是否有错误
- JSON 文件格式是否正确
- 文件路径是否正确
- 是否在使用 HTTP 服务器运行（不能直接打开 HTML 文件）
