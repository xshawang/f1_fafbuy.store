# F1 结算页面多语言合并方案

## 任务目标
1. 分析 `F1 Experiences.html` (英文) 和 `F1 Experiences_zh-CN.html` (中文) 两个页面
2. 提取共用页面元素到 JSON 文件
3. 合并为一个支持多语言的页面
4. 将 `id=checkoutAddress` 区域改为用户输入信用卡信息的文本框
5. 国家选择以下拉形式展示，参考 `3015-2ed879c3c218aaeea695.js` 中的 `rwcCountryNamesAndCodes`

## 实现步骤

### 第一步：分析页面差异
- 对比两个HTML文件，找出所有文本差异
- 提取需要国际化的文本内容

### 第二步：创建多语言 JSON 文件
- `locales/en.json` - 英文语言包
- `locales/zh-CN.json` - 中文语言包

### 第三步：修改页面结构
- 将硬编码文本替换为数据绑定
- 添加语言切换功能
- 修改 checkoutAddress 区域为信用卡输入框
- 添加国家下拉选择

### 第四步：实现语言切换逻辑
- 使用 JavaScript 实现动态语言切换
- 根据浏览器语言或用户选择加载对应语言包

## 文件结构
```
html/
├── checkout.html              # 合并后的多语言结算页
├── locales/
│   ├── en.json               # 英文语言包
│   └── zh-CN.json            # 中文语言包
├── js/
│   └── i18n.js               # 国际化逻辑
└── F1 Experiences_files/     # 原有资源文件（保留）
```

## 注意事项
1. 保持原有样式和功能不变
2. 确保信用卡输入框符合PCI DSS安全标准
3. 国家列表需要包含完整的国家代码和名称
4. 页面加载时自动检测浏览器语言
