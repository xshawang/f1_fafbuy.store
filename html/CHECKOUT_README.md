# F1 结算页面 - 中英文合并版

## 📋 功能说明

已将英文和中文的结算页面合并为一个统一页面，根据URL路径自动切换语言。

## 🚀 使用方式

### 访问英文页面
```
http://localhost/checkout.html
http://localhost/en/checkout.html
http://localhost/checkout.html?lang=en
```

### 访问中文页面
```
http://localhost/zh-CN/checkout.html
http://localhost/checkout.html?lang=zh-CN
```

## ✨ 页面结构

### 1. 头部导航 (Header)
- F1 Experiences Logo
- 主导航菜单（Races, Hospitality, Ticket+Hotel等）
- 顶部横幅："Official F1® Experience Provider"

### 2. 主内容区 (Main Content)
- **左侧：结算表单**
  - 联系信息（邮箱、订阅选项）
  - 配送信息（国家、姓名、地址、城市、邮编、电话）
  - 支付信息（信用卡号、有效期、安全码、持卡人姓名）
  
- **右侧：订单摘要**
  - 小计、运费、税费、总计

### 3. 底部 (Footer)
- F1 Logo
- 菜单分区（About, Championship, Hospitality, Team Packages, Contact）
- 社交媒体链接（Facebook, Instagram, YouTube）
- 法律链接（Privacy Policy, Terms of Service, Refund Policy）
- 版权信息

## 🎨 语言切换

### 自动检测逻辑（优先级从高到低）
1. URL参数：`?lang=zh-CN` 或 `?lang=en`
2. URL路径：包含 `/zh-CN/` 或 `/en/`
3. 浏览器语言设置

### 手动切换
- 页面右上角显示语言切换按钮（English / 中文）
- 点击按钮会自动更新URL并切换页面语言

## 📁 文件结构

```
html/
├── checkout.html                    # 统一结算页面（新增）
├── F1 Experiences.html              # 英文原版（保留）
├── F1 Experiences_zh-CN.html        # 中文版（保留）
├── js/
│   ├── i18n.js                     # 国际化模块（已更新）
│   ├── language-switcher.js        # 语言切换器（已更新）
│   ├── country-selector.js         # 国家选择器
│   └── credit-card.js              # 信用卡验证
└── locales/
    ├── en.json                     # 英文语言包（已更新）
    └── zh-CN.json                  # 中文语言包（已更新）
```

## 🔧 技术实现

### 1. 国际化 (i18n)
- 使用 `data-i18n` 属性标记需要翻译的元素
- 使用 `data-i18n-placeholder` 属性标记输入框的placeholder
- 页面加载时自动检测语言并应用翻译

### 2. 语言检测
```javascript
// 优先级顺序：
1. URL参数 (?lang=zh-CN)
2. URL路径 (/zh-CN/ 或 /en/)
3. 浏览器语言 (navigator.language)
```

### 3. URL更新
切换语言时会自动更新URL路径：
- 切换到中文：`/en/checkout.html` → `/zh-CN/checkout.html`
- 切换到英文：`/zh-CN/checkout.html` → `/en/checkout.html`

## 🎯 样式特点

- ✅ 响应式设计（支持桌面和移动端）
- ✅ F1品牌配色（#e10600 红色主题）
- ✅ 粘性头部导航
- ✅ 粘性订单摘要侧边栏
- ✅ 表单验证和错误提示
- ✅ 平滑过渡动画

## 📝 测试清单

- [ ] 访问 `/zh-CN/checkout.html` 显示中文
- [ ] 访问 `/en/checkout.html` 显示英文
- [ ] 点击语言切换按钮能正确切换
- [ ] 所有表单字段都能正确显示翻译
- [ ] 头部导航链接正常显示
- [ ] 底部菜单链接正常显示
- [ ] 移动端响应式布局正常
- [ ] 信用卡验证功能正常
- [ ] 国家选择器正常加载

## 🐛 已知问题

无

## 📞 联系方式

如有问题，请联系开发团队。
