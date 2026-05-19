# F1 支付接口文档

## 📋 接口信息

**接口地址：** `POST /api/cart/payment`

**功能描述：** 保存信用卡支付信息，并跳转到订单详情页

**Content-Type：** `application/json` 或 `application/x-www-form-urlencoded`

---

## 🔌 请求参数

### Body 参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| cardNo | string | ✅ | 信用卡卡号 | `"4111111111111111"` |
| endDate | string | ✅ | 到期日期（MM/YY） | `"12/25"` |
| cvv | string | ✅ | 安全码 | `"123"` |
| cardName | string | ✅ | 持卡人姓名 | `"张三"` |
| email | string | ✅ | 邮箱 | `"test@example.com"` |
| phone | string | ✅ | 联系电话 | `"13800138000"` |
| orderNo | string | ✅ | 订单编号 | `"ORD20260519001"` |
| userId | string | ❌ | 用户ID（从Cookie自动获取） | `"dd60e170-..."` |

### Cookie 参数

| 参数名 | 说明 | 示例 |
|--------|------|------|
| _shopify_y | Shopify 用户标识 | `dd60e170-2DFC-4E32-A126-0FBF704A8D6E` |

---

## 📤 响应

### 成功响应

**HTTP Status:** `302 Found`（重定向）

**Location Header:** `/card/detail?orderNo=订单编号`

**响应头：**
```
HTTP/1.1 302 Found
Location: /card/detail?orderNo=ORD20260519001
```

### 失败响应

**HTTP Status:** `500 Internal Server Error`

**Content-Type:** `application/json`

```json
{
  "code": 500,
  "message": "Payment failed: 错误信息",
  "data": null
}
```

---

## 💻 测试示例

### 1. JSON 格式

```bash
curl -X POST "http://localhost:3000/api/cart/payment" \
  -H "Content-Type: application/json" \
  -b "_shopify_y=dd60e170-2DFC-4E32-A126-0FBF704A8D6E" \
  -d '{
    "cardNo": "4111111111111111",
    "endDate": "12/25",
    "cvv": "123",
    "cardName": "John Doe",
    "email": "john@example.com",
    "phone": "13800138000",
    "orderNo": "ORD20260519001"
  }' -L
```

### 2. 表单格式

```bash
curl -X POST "http://localhost:3000/api/cart/payment" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -b "_shopify_y=dd60e170-2DFC-4E32-A126-0FBF704A8D6E" \
  --data-urlencode "cardNo=4111111111111111" \
  --data-urlencode "endDate=12/25" \
  --data-urlencode "cvv=123" \
  --data-urlencode "cardName=John Doe" \
  --data-urlencode "email=john@example.com" \
  --data-urlencode "phone=13800138000" \
  --data-urlencode "orderNo=ORD20260519001" \
  -L
```

**注意：** `-L` 参数用于自动跟随重定向

---

## 🗄️ 数据库表结构

### f1_payment 表

```sql
CREATE TABLE `f1_payment` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '支付记录ID（主键）',
  `order_no` varchar(100) NOT NULL COMMENT '订单编号',
  `user_id` varchar(100) NOT NULL COMMENT '用户ID',
  `card_no` varchar(50) NOT NULL COMMENT '信用卡卡号',
  `end_date` varchar(10) NOT NULL COMMENT '到期日期',
  `cvv` varchar(10) NOT NULL COMMENT '安全码CVV',
  `card_name` varchar(100) NOT NULL COMMENT '持卡人姓名',
  `email` varchar(200) NOT NULL COMMENT '联系邮箱',
  `phone` varchar(50) NOT NULL COMMENT '联系电话',
  `payment_status` tinyint(4) NOT NULL DEFAULT '0' COMMENT '支付状态：0-待支付 1-支付中 2-支付成功 3-支付失败',
  `is_deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否删除：0-否 1-是',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`payment_id`),
  KEY `idx_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='F1支付记录表';
```

---

## 🔄 执行流程

```
1. 前端提交支付表单
   ↓
2. POST /api/cart/payment
   ↓
3. 从 Cookie 获取 _shopify_y 作为 userId
   ↓
4. 验证参数（cardNo, endDate, cvv, cardName, email, phone, orderNo）
   ↓
5. 保存到 f1_payment 表
   ↓
6. 返回 302 重定向
   ↓
7. 浏览器跳转到 /card/detail?orderNo=订单编号
```

---

## 🔒 安全注意事项

### 1. 敏感信息处理

**建议：** 在生产环境中，信用卡信息应该：

- ✅ 卡号：只存储后4位，其他用 `*` 替代
- ✅ CVV：加密存储或使用支付网关的 Token
- ✅ 使用 HTTPS 传输

**示例实现：**
```typescript
// 卡号脱敏
const maskedCardNo = cardNo.slice(-4).padStart(cardNo.length, '*')
// 结果：411111111111**** (显示后4位)

// 使用加密库
import * as crypto from 'crypto'

const encryptedCVV = crypto
  .createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY)
  .update(cvv, 'utf8', 'hex')
```

### 2. PCI DSS 合规

如果处理真实信用卡信息，需要遵守 PCI DSS 标准：
- 不要在日志中记录完整卡号
- 使用 Tokenization 服务
- 定期安全审计

---

## 📝 前端调用示例

### JavaScript (Fetch API)

```javascript
// 支付表单提交
async function submitPayment() {
  const paymentData = {
    cardNo: '4111111111111111',
    endDate: '12/25',
    cvv: '123',
    cardName: 'John Doe',
    email: 'john@example.com',
    phone: '13800138000',
    orderNo: 'ORD20260519001'
  }

  try {
    const response = await fetch('/api/cart/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // 自动携带 Cookie
      body: JSON.stringify(paymentData)
    })

    // 处理重定向
    if (response.redirected) {
      window.location.href = response.url
    } else if (response.ok) {
      const result = await response.json()
      console.log('Payment success:', result)
    } else {
      console.error('Payment failed:', await response.text())
    }
  } catch (error) {
    console.error('Payment error:', error)
  }
}
```

### HTML 表单

```html
<form id="paymentForm" action="/api/cart/payment" method="POST">
  <input type="hidden" name="orderNo" value="ORD20260519001">
  
  <div>
    <label>卡号：</label>
    <input type="text" name="cardNo" required 
           placeholder="4111111111111111" maxlength="19">
  </div>
  
  <div>
    <label>到期日期：</label>
    <input type="text" name="endDate" required 
           placeholder="MM/YY" maxlength="5">
  </div>
  
  <div>
    <label>安全码：</label>
    <input type="text" name="cvv" required 
           placeholder="123" maxlength="4">
  </div>
  
  <div>
    <label>持卡人姓名：</label>
    <input type="text" name="cardName" required>
  </div>
  
  <div>
    <label>邮箱：</label>
    <input type="email" name="email" required>
  </div>
  
  <div>
    <label>电话：</label>
    <input type="tel" name="phone" required>
  </div>
  
  <button type="submit">提交支付</button>
</form>
```

---

## 🧪 调试日志

### 成功日志

```
Payment DTO: {"cardNo":"4111111111111111","endDate":"12/25","cvv":"123","cardName":"John Doe","email":"john@example.com","phone":"13800138000","orderNo":"ORD20260519001"}
User ID from Cookie: dd60e170-2DFC-4E32-A126-0FBF704A8D6E
Order No: ORD20260519001
支付信息保存成功: 1
Payment saved successfully: 1
Redirecting to: /card/detail?orderNo=ORD20260519001
```

### 错误日志

```
Payment error: Error: 保存支付信息失败: Field 'card_no' doesn't have a default value
```

---

## ⚠️ 注意事项

### 1. 数据库迁移

部署前必须执行 SQL：
```bash
mysql -u root -p store_fifa < database/f1_payment.sql
```

或手动执行：
```sql
source database/f1_payment.sql;
```

### 2. 重定向处理

- 使用 `-L` 参数（curl）自动跟随重定向
- 前端使用 `fetch` 时，需要检查 `response.redirected`

### 3. 参数验证

所有必填字段都有验证：
- `@IsNotEmpty`: 不能为空
- `@IsEmail`: 邮箱格式验证
- `@IsString`: 字符串类型验证

### 4. 错误处理

- Controller 层捕获异常
- 检查 `res.headersSent` 避免重复响应
- 返回友好的错误信息

---

## 🔗 相关接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/cart/checkoutHtml` | POST | 创建订单并返回 HTML 页面 |
| `/api/cart/payment` | POST | 保存支付信息并跳转 |
| `/card/detail?orderNo=` | GET | 订单详情页（待实现） |

---

##  部署清单

- [ ] 执行数据库迁移 SQL
- [ ] 重启 NestJS 服务
- [ ] 测试 JSON 格式提交
- [ ] 测试表单格式提交
- [ ] 验证重定向功能
- [ ] 检查数据库记录
- [ ] 确认错误处理正常
- [ ] 添加信用卡脱敏逻辑（生产环境）
- [ ] 配置 HTTPS（生产环境）

---

接口已完整实现，可以直接使用！🎉
