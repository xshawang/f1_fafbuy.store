# F1 Checkout API 测试命令

## 正确的 curl 请求

### 1. 测试 JSON 接口 (checkout)

```bash
curl -X POST "http://localhost:3000/api/cart/checkout" \
  -H "Content-Type: application/json" \
  -b "_shopify_y=dd60e170-2DFC-4E32-A126-0FBF704A8D6E" \
  -d '{
    "f1_name": "FORMULA LENOVO GRAND PRIX DU CANADA 2026",
    "f1_title": "Paddock Club 3-Days | Audi Revolut F1 Team Suite",
    "f1_total": "总额USD $15,180.14",
    "f1_quarty": "1"
  }'
```

### 2. 测试 HTML 接口 (checkout-html)

```bash
curl -X POST "http://localhost:3000/api/cart/checkout-html" \
  -H "Content-Type: application/json" \
  -b "_shopify_y=dd60e170-2DFC-4E32-A126-0FBF704A8D6E" \
  -d '{
    "f1_name": "FORMULA LENOVO GRAND PRIX DU CANADA 2026",
    "f1_title": "Paddock Club 3-Days | Audi Revolut F1 Team Suite",
    "f1_total": "总额USD $15,180.14",
    "f1_quarty": "1"
  }' > checkout.html
```

### 3. 带标题的中文参数

```bash
curl -X POST "http://localhost:3000/api/cart/checkout-html" \
  -H "Content-Type: application/json" \
  -b "_shopify_y=dd60e170-2DFC-4E32-A126-0FBF704A8D6E" \
  -d '{
    "f1_name": "F1加拿大大奖赛2026",
    "f1_title": "围栏俱乐部三天套餐",
    "f1_total": "总额USD $15,180.14",
    "f1_quarty": "Q1"
  }'
```

---

## 常见错误

### ❌ 错误 1: 使用 -d 传递 Cookie

```bash
# 错误！Cookie 会被当成 body 的一部分
-d "Cookie: _shopify_y=xxx"
```

### ❌ 错误 2: 忘记设置 Content-Type

```bash
# 可能无法正确解析 JSON body
curl -X POST "http://localhost:3000/api/cart/checkout-html" \
  -b "_shopify_y=xxx" \
  -d '{"f1_name": "..."}'
```

应该添加：
```bash
-H "Content-Type: application/json"
```

### ❌ 错误 3: 路径错误

```bash
# 错误 - 缺少 /api 前缀
http://localhost:3000/cart/checkout-html

# 正确
http://localhost:3000/api/cart/checkout-html
```

---

## 验证响应

### JSON 响应示例

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "f1OrderId": 1,
    "f1Name": "FORMULA LENOVO GRAND PRIX DU CANADA 2026",
    "f1Title": "Paddock Club 3-Days | Audi Revolut F1 Team Suite",
    "f1Quarty": "1",
    "f1Money": 1518014,
    "id": "dd60e170-2DFC-4E32-A126-0FBF704A8D6E",
    "orderStatus": 0,
    "isDeleted": 0
  },
  "timestamp": 1716028800000
}
```

### HTML 响应示例

HTML 文件会直接返回 `scripts/newCheckout.html` 的内容。

可以用 `<` 符号保存到文件：
```bash
curl -X POST "http://localhost:3000/api/cart/checkout-html" \
  -b "_shopify_y=xxx" \
  -d '{"f1_name":"...", "f1_title":"...", "f1_total":"$100", "f1_quarty":"1"}' \
  > order.html

# 然后用浏览器打开 order.html
```

---

## PowerShell 示例

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/cart/checkout" `
  -Method Post `
  -Headers @{
    "Cookie" = "_shopify_y=dd60e170-2DFC-4E32-A126-0FBF704A8D6E"
    "Content-Type" = "application/json"
  } `
  -Body '{"f1_name":"F1 Canada GP","f1_title":"Paddock Club","f1_total":"$15,180.14","f1_quarty":"1"}'
```

---

## 调试技巧

### 1. 查看请求详情

添加 `-v` 参数查看详细信息：
```bash
curl -v -X POST "http://localhost:3000/api/cart/checkout-html" \
  -H "Content-Type: application/json" \
  -b "_shopify_y=dd60e170-2DFC-4E32-A126-0FBF704A8D6E" \
  -d '{"f1_name":"test","f1_title":"test","f1_total":"$100","f1_quarty":"1"}'
```

### 2. 只查看响应头

```bash
curl -I -X POST "http://localhost:3000/api/cart/checkout-html" \
  -H "Content-Type: application/json" \
  -b "_shopify_y=dd60e170-2DFC-4E32-A126-0FBF704A8D6E" \
  -d '{"f1_name":"test","f1_title":"test","f1_total":"$100","f1_quarty":"1"}'
```

期望输出：
```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
```

### 3. 查看服务器日志

启动应用后观察控制台输出：
```
User ID from Cookie: dd60e170-2DFC-4E32-A126-0FBF704A8D6E
F1 Checkout with HTML, User ID: dd60e170-2DFC-4E32-A126-0FBF704A8D6E
Checkout DTO: { f1_name: '...', ... }
订单保存成功: 123
```
