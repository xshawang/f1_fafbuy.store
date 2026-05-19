# F1 Checkout POST 表单提交完整指南

## 📋 功能概述

F1 Checkout API 现已支持两种提交方式：
1. **JSON 格式** (`application/json`)
2. **表单格式** (`application/x-www-form-urlencoded`)

---

## 🔌 接口信息

### 1. JSON 接口（返回订单数据）

**请求地址：** `POST /api/cart/checkout`

**Content-Type：** `application/json`

**请求参数：**
```json
{
  "f1_name": "FORMULA LENOVO GRAND PRIX DU CANADA 2026",
  "f1_title": "Paddock Club™ 3-Days | Audi Revolut F1® Team Suite",
  "f1_total": "$15,180.14",
  "f1_quarty": "Q1 2026"
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "f1OrderId": 1,
    "f1Name": "FORMULA LENOVO GRAND PRIX DU CANADA 2026",
    "f1Title": "Paddock Club™ 3-Days | Audi Revolut F1® Team Suite",
    "f1Quarty": "Q1 2026",
    "f1Money": 1518014,
    "orderStatus": 0,
    "createTime": "2026-05-18T10:00:00Z"
  }
}
```

---

### 2. HTML 接口（返回完整页面）

**请求地址：** `POST /api/cart/checkout-html`

**支持的 Content-Type：**
- `application/json`
- `application/x-www-form-urlencoded`

**响应头：**
```
Content-Type: text/html; charset=utf-8
```

**响应体：** `scripts/newCheckout.html` 文件的完整内容

---

## 💻 测试方法

### 方法 1：JSON 格式提交

#### cURL 命令
```bash
curl -X POST "http://localhost:3000/api/cart/checkout" \
  -H "Content-Type: application/json" \
  -b "_shopify_y=dd60e170-2DFC-4E32-A126-0FBF704A8D6E" \
  -d '{
    "f1_name": "FORMULA LENOVO GRAND PRIX DU CANADA 2026",
    "f1_title": "Paddock Club™ 3-Days | Audi Revolut F1® Team Suite",
    "f1_total": "$15,180.14",
    "f1_quarty": "Q1 2026"
  }'
```

#### PowerShell (Invoke-RestMethod)
```powershell
$body = @{
    f1_name = "FORMULA LENOVO GRAND PRIX DU CANADA 2026"
    f1_title = "Paddock Club 3-Days"
    f1_total = "`$15,180.14"
    f1_quarty = "Q1 2026"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/cart/checkout" `
  -Method Post `
  -Headers @{
    "Cookie" = "_shopify_y=dd60e170-2DFC-4E32-A126-0FBF704A8D6E"
    "Content-Type" = "application/json"
  } `
  -Body $body
```

#### JavaScript (Fetch API)
```javascript
fetch('http://localhost:3000/api/cart/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': '_shopify_y=dd60e170-2DFC-4E32-A126-0FBF704A8D6E'
  },
  body: JSON.stringify({
    f1_name: 'FORMULA LENOVO GRAND PRIX DU CANADA 2026',
    f1_title: 'Paddock Club™ 3-Days',
    f1_total: '$15,180.14',
    f1_quarty: 'Q1 2026'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

---

### 方法 2：表单格式提交（HTML Form）

#### cURL 命令
```bash
curl -X POST "http://localhost:3000/api/cart/checkout" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -b "_shopify_y=dd60e170-2DFC-4E32-A126-0FBF704A8D6E" \
  --data-urlencode "f1_name=FORMULA LENOVO GRAND PRIX DU CANADA 2026" \
  --data-urlencode "f1_title=Paddock Club™ 3-Days | Audi Revolut F1® Team Suite" \
  --data-urlencode "f1_total=$15,180.14" \
  --data-urlencode "f1_quarty=Q1 2026"
```

#### HTML 表单示例
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>F1 订单提交</title>
</head>
<body>
    <h2>F1 体验订单</h2>
    <form id="checkoutForm" action="http://localhost:3000/api/cart/checkout" method="POST">
        <input type="hidden" name="_cookie" value="dd60e170-2DFC-4E32-A126-0FBF704A8D6E">
        
        <div>
            <label>赛事名称：</label>
            <input type="text" name="f1_name" required 
                   value="FORMULA LENOVO GRAND PRIX DU CANADA 2026">
        </div>
        
        <div>
            <label>套餐标题：</label>
            <input type="text" name="f1_title" required 
                   value="Paddock Club™ 3-Days">
        </div>
        
        <div>
            <label>总金额：</label>
            <input type="text" name="f1_total" required 
                   value="$15,180.14">
        </div>
        
        <div>
            <label>季度：</label>
            <input type="text" name="f1_quarty" required 
                   value="Q1 2026">
        </div>
        
        <button type="submit">提交订单</button>
    </form>

    <script>
        document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            // 获取 Cookie
            const cookies = document.cookie.split(';');
            let shopifyCookie = '';
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === '_shopify_y') {
                    shopifyCookie = value;
                    break;
                }
            }
            
            try {
                const response = await fetch('/api/cart/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': `_shopify_y=${shopifyCookie}`
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                console.log('订单创建成功:', result);
                alert('订单号: ' + result.data.f1OrderId);
            } catch (error) {
                console.error('提交失败:', error);
            }
        });
    </script>
</body>
</html>
```

#### HTML 表单 + HTML 响应
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>F1 订单 - 返回页面</title>
</head>
<body>
    <h2>F1 订单确认</h2>
    <form action="http://localhost:3000/api/cart/checkout-html" method="POST">
        <input type="hidden" name="f1_name" value="FORMULA LENOVO GRAND PRIX DU CANADA 2026">
        <input type="hidden" name="f1_title" value="Paddock Club™ 3-Days">
        <input type="hidden" name="f1_total" value="$15,180.14">
        <input type="hidden" name="f1_quarty" value="Q1 2026">
        
        <button type="submit">查看结算页面</button>
    </form>
</body>
</html>
```

---

### 方法 3：application/x-www-form-urlencoded 格式

#### cURL 命令
```bash
curl -X POST "http://localhost:3000/api/cart/checkout-html" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -b "_shopify_y=dd60e170-2DFC-4E32-A126-0FBF704A8D6E" \
  -d "f1_name=FORMULA+LENOVO+GRAND+PRIX+DU+CANADA+2026&f1_title=Paddock+Club&f1_total=%2415%2C180.14&f1_quarty=Q1+2026" > checkout.html
```

#### JavaScript (URLSearchParams)
```javascript
const params = new URLSearchParams();
params.append('f1_name', 'FORMULA LENOVO GRAND PRIX DU CANADA 2026');
params.append('f1_title', 'Paddock Club™ 3-Days');
params.append('f1_total', '$15,180.14');
params.append('f1_quarty', 'Q1 2026');

fetch('http://localhost:3000/api/cart/checkout-html', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': '_shopify_y=dd60e170-2DFC-4E32-A126-0FBF704A8D6E'
  },
  body: params.toString()
})
.then(response => response.text())
.then(html => {
  console.log('HTML 长度:', html.length);
  // 可以将 HTML 写入文件或用 iframe 显示
})
.catch(error => console.error('Error:', error));
```

---

## 🎯 金额处理说明

### 自动转换逻辑

后端会自动将字符串格式的金额转换为数字（单位：分）：

```javascript
// 输入格式示例
f1_total: "$15,180.14"
f1_total: "$1,234.56"
f1_total: "总额USD $999.99"

// 自动转换为（分）
f1_money: 1518014  // $15,180.14 × 100
f1_money: 123456   // $1,234.56 × 100
f1_money: 99999    // $999.99 × 100
```

### 转换规则

1. 移除 `$` 符号
2. 移除千位分隔符 `,`
3. 转换为浮点数
4. 乘以 100 转为分（如果前端需要进一步处理）

---

## 📊 两种格式对比

| 特性 | JSON | Form |
|------|------|------|
| Content-Type | `application/json` | `application/x-www-form-urlencoded` |
| 数据格式 | JSON 字符串 | URL编码的键值对 |
| 特殊字符处理 | 自动转义 | 需要手动编码或urlencode |
| 兼容性 | 现代浏览器 | 所有浏览器（包括旧版） |
| 适用场景 | API调用、前后端分离 | HTML表单、传统Web应用 |
| 可读性 | ✅ 更清晰 | ⚠️ 需要格式化 |

---

## 🔍 常见问题

### Q1: Cookie 应该在哪里传递？

**推荐方式：** 使用 `-b` 参数或 `Cookie` HTTP头

```bash
# ✅ 正确
-b "_shopify_y=xxx"

# ✅ 正确
-H "Cookie: _shopify_y=xxx"

# ❌ 错误（会被当成body的一部分）
-d "Cookie: _shopify_y=xxx"
```

### Q2: 金额必须带 `$` 符号吗？

不需要，可以是任意格式的字符串，后端会自动处理：
```json
{
  "f1_total": "$15,180.14"  // ✅
  "f1_total": "15180.14"    // ✅
  "f1_total": "15180.14元"  // ✅
}
```

### Q3: 如何保存到文件？

```bash
# JSON 接口
curl -X POST "..." -d '{}' > order.json

# HTML 接口
curl -X POST "..." -d '{}' > checkout.html
```

### Q4: 本地开发没有 Cookie 怎么办？

可以直接在 body 中传递 `id` 字段：
```json
{
  "f1_name": "...",
  "f1_title": "...",
  "f1_total": "$100",
  "f1_quarty": "Q1",
  "id": "自定义用户ID"
}
```

---

## 🚀 快速测试脚本

### test-checkout.sh
```bash
#!/bin/bash

echo "测试 F1 Checkout API..."
echo ""

# 测试 JSON 接口
echo "1. 测试 JSON 接口："
curl -s -X POST "http://localhost:3000/api/cart/checkout" \
  -H "Content-Type: application/json" \
  -b "_shopify_y=test-user-id" \
  -d '{
    "f1_name": "F1 Canada GP",
    "f1_title": "Paddock Club",
    "f1_total": "$999.99",
    "f1_quarty": "Q1"
  }' | python -m json.tool

echo ""
echo "==================================="
echo ""

# 测试 HTML 接口
echo "2. 测试 HTML 接口："
curl -s -X POST "http://localhost:3000/api/cart/checkout-html" \
  -H "Content-Type: application/json" \
  -b "_shopify_y=test-user-id" \
  -d '{
    "f1_name": "F1 Canada GP",
    "f1_title": "Paddock Club",
    "f1_total": "$999.99",
    "f1_quarty": "Q1"
  }' > checkout_test.html

echo "HTML 已保存到 checkout_test.html"
echo ""
echo "==================================="
echo ""

# 测试表单接口
echo "3. 测试表单格式接口："
curl -s -X POST "http://localhost:3000/api/cart/checkout" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -b "_shopify_y=test-user-id" \
  --data-urlencode "f1_name=F1 Canada GP" \
  --data-urlencode "f1_title=Paddock Club" \
  --data-urlencode "f1_total=\$999.99" \
  --data-urlencode "f1_quarty=Q1" | python -m json.tool
```

---

## 📝 总结

现在 F1 Checkout API 完全支持：
- ✅ JSON 格式 POST 提交
- ✅ application/x-www-form-urlencoded 表单提交
- ✅ Cookie 自动获取用户标识
- ✅ 金额字符串自动转换
- ✅ 返回 JSON 数据或完整 HTML 页面

根据你的业务需求选择合适的提交方式即可！🎉
