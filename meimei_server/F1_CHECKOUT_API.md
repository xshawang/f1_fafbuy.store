# F1 Checkout 接口实现文档

## 📋 功能概述

实现了两个 checkout 接口：
1. **纯 API 接口** - 保存订单并返回 JSON 数据
2. **HTML 页面接口** - 保存订单并返回 HTML 模板文件（Content-Type: text/html）

## 🔌 接口说明

### 1. 纯API接口（JSON响应）

**请求地址：** `GET /cart/checkout`

**请求参数：**
```json
{
  "f1_name": "F1名称",
  "f1_title": "F1标题",
  "f1_quarty": "F1季度",
  "f1_money": 10000,
  "id": "用户标识（从Cookie获取）"
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "f1OrderId": 123,
    "f1Name": "xxx",
    "f1Title": "xxx",
    "f1Quarty": "Q1 2026",
    "f1Money": 10000,
    "id": "user_123",
    "orderStatus": 0,
    "isDeleted": 0,
    "createTime": "2026-05-18T10:00:00Z",
    "updateTime": "2026-05-18T10:00:00Z"
  },
  "timestamp": 1716028800000
}
```

---

### 2. HTML页面接口（HTML响应）

**请求地址：** `GET /cart/checkout-html`

**请求参数：**
```json
{
  "f1_name": "F1名称",
  "f1_title": "F1标题",
  "f1_quarty": "F1季度",
  "f1_money": 10000,
  "id": "用户标识（从Cookie获取）"
}
```

**响应头：**
```
Content-Type: text/html; charset=utf-8
```

**响应体：** 
- `scripts/newCheckout.html` 文件的完整内容
- 包含完整的结算页面HTML结构

---

## 💻 代码实现

### Controller层 (`f1.controller.ts`)

```typescript
@Get('checkout-html')
@Public()
async checkoutWithHtml(
  @Req() req,
  @Res() res: Response,
  @Body() checkoutDto: F1CheckoutDto
) {
  try {
    // 1. 获取用户标识
    const userId = req.cookies['_shopify_y'] || ''
    checkoutDto.id = userId
    
    // 2. 调用 service 保存订单并读取 HTML
    const result = await this.f1Service.checkoutWithHtml(checkoutDto)
    
    console.log('订单保存成功:', result.order.f1OrderId)
    
    // 3. 设置响应头为 text/html
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    
    // 4. 返回 HTML 内容
    res.send(result.html)
  } catch (error) {
    console.error('Checkout HTML 错误:', error.message)
    res.status(500).send(`Error: ${error.message}`)
  }
}
```

### Service层 (`f1.service.ts`)

#### 1. 读取HTML文件方法

```typescript
async readCheckoutHtml(): Promise<string> {
  try {
    // 获取项目根路径下的scripts目录
    const scriptsPath = path.join(process.cwd(), 'scripts')
    const filePath = path.join(scriptsPath, 'newCheckout.html')
    
    // 读取文件内容
    const htmlContent = await fs.readFile(filePath, 'utf-8')
    
    return htmlContent
  } catch (error) {
    throw new ApiException(`读取checkout HTML文件失败: ${error.message}`)
  }
}
```

#### 2. 完整Checkout流程

```typescript
async checkoutWithHtml(checkoutDto: F1CheckoutDto): Promise<{ order: F1Order; html: string }> {
  try {
    // 1. 保存订单到数据库
    const f1Order = new F1Order()
    f1Order.f1Name = checkoutDto.f1_name
    f1Order.f1Title = checkoutDto.f1_title
    f1Order.f1Quarty = checkoutDto.f1_quarty
    f1Order.f1Money = checkoutDto.f1_money
    f1Order.id = checkoutDto.id
    f1Order.orderStatus = 0
    f1Order.isDeleted = 0

    const savedOrder = await this.f1OrderRepository.save(f1Order)
    console.log('订单保存成功:', savedOrder.f1OrderId)
    
    // 2. 读取HTML模板文件
    const htmlContent = await this.readCheckoutHtml()
    
    // 3. 返回订单数据和HTML内容
    return {
      order: savedOrder,
      html: htmlContent
    }
  } catch (error) {
    throw new ApiException(`Checkout失败: ${error.message}`)
  }
}
```

---

## 📁 文件结构

```
meimei_server/
├── scripts/
│   └── newCheckout.html          # HTML模板文件
├── src/
│   └── modules/
│       └── biz/
│           └── f1/
│               ├── f1.controller.ts   # 控制器
│               ├── f1.service.ts      # 服务层
│               ├── dto/
│               │   └── f1-checkout.dto.ts
│               └── entities/
│                   └── f1-order.entity.ts
```

---

## 🔧 依赖安装

需要安装 Node.js 内置模块（无需额外安装）：
- `fs/promises` - 文件系统异步操作
- `path` - 路径处理

---

## 🚀 使用示例

### cURL 命令

#### 测试 JSON 接口
```bash
curl -X GET "http://localhost:3000/cart/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "f1_name": "F1体验包",
    "f1_title": "F1赛事体验套餐",
    "f1_quarty": "Q1 2026",
    "f1_money": 9999
  }'
```

#### 测试 HTML 接口
```bash
curl -X GET "http://localhost:3000/cart/checkout-html" \
  -H "Content-Type: text/html" \
  -d '{
    "f1_name": "F1体验包",
    "f1_title": "F1赛事体验套餐",
    "f1_quarty": "Q1 2026",
    "f1_money": 9999
  }'
```

### JavaScript 调用

```javascript
// 调用 HTML 接口
fetch('http://localhost:3000/cart/checkout-html', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    f1_name: 'F1体验包',
    f1_title: 'F1赛事体验套餐',
    f1_quarty: 'Q1 2026',
    f1_money: 9999
  })
})
.then(response => {
  // 检查 Content-Type
  const contentType = response.headers.get('content-type')
  console.log('Content-Type:', contentType)
  
  // 获取 HTML 内容
  return response.text()
})
.then(html => {
  console.log('HTML 长度:', html.length)
  console.log('HTML 预览:', html.substring(0, 500))
})
.catch(error => {
  console.error('请求失败:', error)
})
```

---

## ✅ 关键特性

### 1. 订单保存
- ✅ 自动获取用户ID（从 Cookie）
- ✅ 保存到 `f1_order` 表
- ✅ 自动生成订单号
- ✅ 记录创建时间

### 2. HTML文件读取
- ✅ 使用 `fs/promises` 异步读取
- ✅ 路径基于 `process.cwd()` 动态计算
- ✅ 支持 UTF-8 编码
- ✅ 错误处理完善

### 3. 响应头设置
- ✅ `Content-Type: text/html; charset=utf-8`
- ✅ 浏览器可直接渲染HTML
- ✅ 前端可以通过 fetch/axios 获取

---

## 🎯 接口对比

| 特性 | `/cart/checkout` | `/cart/checkout-html` |
|------|------------------|-----------------------|
| 响应类型 | JSON | HTML |
| Content-Type | application/json | text/html |
| 使用场景 | API调用、前端业务逻辑 | 直接返回页面、邮件模板 |
| 数据结构 | 只返回订单信息 | 返回订单+完整HTML |

---

## ⚠️ 注意事项

### 1. 文件路径
- 配置文件路径：`process.cwd()/scripts/newCheckout.html`
- 部署时确保文件存在
- 建议使用绝对路径避免歧义

### 2. 错误处理
- 文件不存在时返回 500 错误
- 异常信息会显示在响应中
- 建议生产环境隐藏详细错误信息

### 3. 性能优化
- 频繁访问时考虑添加缓存
- 可使用 `node-cache` 或 Redis
- HTML文件变化时需要清除缓存

### 4. 安全性
- 公开接口，无需认证
- 建议添加频率限制
- 防止恶意刷接口

---

## 🔍 调试技巧

### 1. 查看控制台日志
```
User ID from Cookie: user_123
F1 Checkout DTO: { f1_name: '...', ... }
订单保存成功: 123
```

### 2. 检查数据库
```sql
SELECT * FROM f1_order ORDER BY f1_id DESC LIMIT 10;
```

### 3. 验证响应头
```bash
curl -I "http://localhost:3000/cart/checkout-html"
```

期望输出：
```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
```

---

## 📝 扩展建议

### 1. 添加缓存机制
```typescript
private htmlCache: string | null = null
private cacheTimestamp: number = 0

async readCheckoutHtml(): Promise<string> {
  // 缓存有效期5分钟
  if (this.htmlCache && Date.now() - this.cacheTimestamp < 5 * 60 * 1000) {
    return this.htmlCache
  }
  
  this.htmlCache = await fs.readFile(filePath, 'utf-8')
  this.cacheTimestamp = Date.now()
  return this.htmlCache
}
```

### 2. 动态替换模板变量
```typescript
async checkoutWithHtml(checkoutDto: F1CheckoutDto): Promise<{ order: F1Order; html: string }> {
  // ... 保存订单逻辑
  
  let htmlContent = await this.readCheckoutHtml()
  
  // 替换模板变量
  htmlContent = htmlContent.replace('{{ORDER_ID}}', savedOrder.f1OrderId.toString())
  htmlContent = htmlContent.replace('{{ORDER_AMOUNT}}', savedOrder.f1Money.toString())
  
  return { order: savedOrder, html: htmlContent }
}
```

### 3. 添加日志记录
```typescript
import * as winston from 'winston'

constructor(
  private readonly logger: LoggerService
) {}

async checkoutWithHtml(checkoutDto: F1CheckoutDto) {
  this.logger.info(`Checkout请求: ${checkoutDto.f1_name}`)
  
  const savedOrder = await this.f1OrderRepository.save(f1Order)
  this.logger.info(`订单保存成功: ${savedOrder.f1OrderId}`)
  
  // ...
}
```

---

##  常见问题

### Q1: 文件找不到怎么办？
A: 检查文件路径是否正确，确保 `scripts/newCheckout.html` 存在

### Q2: 为什么返回的是 HTML 源代码而不是渲染后的页面？
A: 这是正常行为。如果需要在浏览器中渲染，需要使用 `<iframe>` 或直接打开新标签页

### Q3: 如何禁用缓存？
A: 删除 `readCheckoutHtml()` 方法中的缓存逻辑即可

---

## 📞 联系方式

如有问题，请联系开发团队。
