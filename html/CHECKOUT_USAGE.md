# F1 结算页面 - 使用说明

## 📋 页面说明

已将 `F1 Experiences.html` 的完整头部和底部照搬到结算页面，中间只保留信用卡支付信息。

## 🎯 页面结构

```
┌─────────────────────────────────────┐
│   F1 Experiences.html 的完整 Header  │
│   (导航栏、Logo、菜单等)              │
├─────────────────────────────────────┤
│                                     │
│   信用卡支付表单                     │
│   - 卡号                            │
│   - 有效期 + 安全码                  │
│   - 持卡人姓名                       │
│   - 提交按钮                         │
│                                     │
├─────────────────────────────────────┤
│   F1 Experiences.html 的完整 Footer  │
│   (下载APP、菜单、社交、版权)         │
└─────────────────────────────────────┘
```

## 🌐 语言切换

### 访问方式

**英文页面：**
```
http://localhost/checkout.html
http://localhost/en/checkout.html
http://localhost/checkout.html?lang=en
```

**中文页面：**
```
http://localhost/zh-CN/checkout.html
http://localhost/checkout.html?lang=zh-CN
```

### 自动检测逻辑
1. URL参数 `?lang=zh-CN` (最高优先级)
2. URL路径包含 `/zh-CN/` 或 `/en/`
3. 浏览器语言设置

## 📁 修改的文件

- ✅ `checkout.html` - 重新创建，照搬F1头部和底部
- ✅ `js/i18n.js` - 支持URL路径检测
- ✅ `js/language-switcher.js` - 切换时更新URL路径
- ✅ `locales/en.json` - 英文语言包
- ✅ `locales/zh-CN.json` - 中文语言包

## 🎨 样式特点

- 完全使用F1官方的CSS样式
- 响应式设计
- F1品牌配色 (#e10600)
- 表单验证和错误提示

## ✨ 功能

- ✅ 完整的F1头部导航
- ✅ 完整的F1底部菜单
- ✅ 信用卡信息输入
- ✅ 信用卡格式验证
- ✅ 中英文自动切换
- ✅ 语言切换按钮
- ✅ 表单提交处理

## 📝 测试

1. 在浏览器中打开 `checkout.html`
2. 通过修改URL测试中英文切换
3. 点击右上角的语言切换按钮
4. 填写信用卡信息并测试提交

## 💡 注意事项

- 寄送地址表单已移除，只保留信用卡支付
- 所有文本都支持国际化翻译
- 页面右上角显示当前语言状态
