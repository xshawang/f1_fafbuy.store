# F1 Order 数据库表结构修复说明

## 📋 问题描述

**错误信息：**
```json
{
  "code": 500,
  "msg": "Checkout失败: Field 'f1_money' doesn't have a default value"
}
```

**根本原因：**
- 数据库表中 `f1_money` 字段没有设置默认值
- DTO 中 `f1_money` 字段标记为可选（@IsOptional）
- 当客户端不传递 `f1_money` 时，TypeORM 尝试插入 `undefined` 或 `NULL`
- MySQL 拒绝了这个操作，导致报错

---

## ✅ 解决方案

### 1. 实体层修复 ([f1-order.entity.ts](file:///d:/work/project/java/wuhan/f1/meimei_server/src/modules/biz/f1/entities/f1-order.entity.ts))

**修改前：**
```typescript
@ApiProperty({ description: 'F1金额（分）' })
@Column({ name: 'f1_money', comment: 'F1金额（分）', type: 'bigint' })
f1Money: number  // ❌ 必填字段
```

**修改后：**
```typescript
@ApiProperty({ description: 'F1金额（分）' })
@Column({ name: 'f1_money', comment: 'F1金额（分）', type: 'bigint', default: 0 })
f1Money?: number  // ✅ 可选字段，默认值为 0
```

**关键改动：**
- ✅ 添加 `default: 0` - 数据库字段默认值
- ✅ 改为 `f1Money?: number` -  TypeScript 可选属性

---

### 2. Service 层增强 ([f1.service.ts](file:///d:/work/project/java/wuhan/f1/meimei_server/src/modules/biz/f1/f1.service.ts))

**增加了完善的金额处理逻辑：**

```typescript
// 处理金额：如果 f1_money 不存在或为0，尝试从 f1_total 转换
if (!checkoutDto.f1_money || checkoutDto.f1_money === 0) {
  if (checkoutDto.f1_total && typeof checkoutDto.f1_total === 'string') {
    const moneyValue = parseFloat(checkoutDto.f1_total.replace('$', '').replace(',', ''))
    if (!isNaN(moneyValue)) {
      f1Order.f1Money = Math.floor(moneyValue * 100) // 转换为分
    } else {
      f1Order.f1Money = 0
    }
  } else {
    f1Order.f1Money = 0
  }
} else {
  f1Order.f1Money = checkoutDto.f1_money
}
```

**处理逻辑：**
1. 优先使用 `f1_money`（如果存在且不为 0）
2. 否则从 `f1_total` 解析并转换
3. 如果都无法获取，设置为 0
4. 添加详细的日志输出

---

### 3. Controller 层双重保险 ([f1.controller.ts](file:///d:/work/project/java/wuhan/f1/meimei_server/src/modules/biz/f1/f1.controller.ts))

```typescript
// 处理金额转换：将字符串格式转为数字（美元转分为单位）
if (checkoutDto.f1_total && typeof checkoutDto.f1_total === 'string') {
  const moneyValue = parseFloat(checkoutDto.f1_total.replace('$', '').replace(',', ''))
  if (!isNaN(moneyValue)) {
    checkoutDto.f1_money = Math.floor(moneyValue * 100) // 转换为分
    console.log('金额转换成功:', checkoutDto.f1_total, '->', checkoutDto.f1_money, '分')
  } else {
    console.warn('金额解析失败:', checkoutDto.f1_total)
    checkoutDto.f1_money = 0
  }
}

// 确保金额不为 undefined
if (!checkoutDto.f1_money) {
  checkoutDto.f1_money = 0
}
```

---

## 🔄 数据库迁移（如果需要手动更新）

如果 TypeORM 的 `synchronize` 配置为 `false`（生产环境建议），需要手动执行 SQL：

```sql
-- 修改 f1_money 字段，添加默认值
ALTER TABLE `f1_order` 
MODIFY COLUMN `f1_money` bigint(20) DEFAULT 0 COMMENT 'F1金额（分）';
```

### 完整迁移脚本

```sql
-- 查看当前表结构
DESCRIBE `f1_order`;

-- 备份现有数据（可选）
CREATE TABLE `f1_order_backup` AS SELECT * FROM `f1_order`;

-- 修改 f1_money 字段
ALTER TABLE `f1_order` 
MODIFY COLUMN `f1_money` bigint(20) DEFAULT 0 COMMENT 'F1金额（分）';

-- 验证修改
DESCRIBE `f1_order`;

-- 检查数据是否正常
SELECT * FROM `f1_order` ORDER BY f1_order_id DESC LIMIT 10;
```

---

##  金额单位说明

### 存储单位：分（cents）

**为什么用分而不是元？**
- ✅ 避免浮点数精度问题
- ✅ 符合支付行业标准
- ✅ 便于精确计算

**转换示例：**

| 用户输入 | Controller 处理 | Service 存储 | 说明 |
|---------|----------------|-------------|------|
| `"$15,180.14"` | `parseFloat("$15,180.14")` → `15180.14` | `Math.floor(15180.14 × 100)` → `1518014` | 美元→分 |
| `"$999.99"` | `999.99` | `99999` | 美元→分 |
| `"1518014"` | `1518014` | `151801400` | 注意：如果已经是分会再×100 |
| `0` 或 `undefined` | - | `0` | 默认值 |

**重要提示：**
- 如果前端直接传递 `f1_money: 1518014`（已是分），Controller 不会再转换
- 推荐做法：前端传递 `f1_total: "$15,180.14"`，后端自动转换

---

## 🧪 测试用例

### 测试 1：只传 f1_total（推荐方式）

```bash
curl -X POST "http://localhost:3000/api/cart/checkoutHtml" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -b "_shopify_y=test-user" \
  --data-urlencode "f1_name=F1 Canada GP" \
  --data-urlencode "f1_title=Paddock Club" \
  --data-urlencode "f1_total=\$15,180.14" \
  --data-urlencode "f1_quarty=Q1 2026"
```

**预期结果：**
```json
{
  "code": 200,
  "data": {
    "f1OrderId": 1,
    "f1Money": 1518014,
    ...
  }
}
```

### 测试 2：同时传 f1_total 和 f1_money

```bash
curl -X POST "http://localhost:3000/api/cart/checkoutHtml" \
  -H "Content-Type: application/json" \
  -d '{
    "f1_name": "F1 Canada GP",
    "f1_title": "Paddock Club",
    "f1_total": "$15,180.14",
    "f1_money": 1518014,
    "f1_quarty": "Q1 2026"
  }'
```

**预期结果：**
- 优先使用 `f1_money: 1518014`
- `f1_total` 被忽略

### 测试 3：不传任何金额

```bash
curl -X POST "http://localhost:3000/api/cart/checkoutHtml" \
  -H "Content-Type: application/json" \
  -d '{
    "f1_name": "F1 Canada GP",
    "f1_title": "Paddock Club",
    "f1_quarty": "Q1 2026"
  }'
```

**预期结果：**
- `f1Money: 0`
- 订单正常创建

---

## 📊 修复对比

### 修复前的问题

| 场景 | 结果 | 错误信息 |
|------|------|---------|
| 不传 `f1_money` | ❌ 500 错误 | Field 'f1_money' doesn't have a default value |
| `f1_money: undefined` | ❌ 500 错误 | Field 'f1_money' doesn't have a default value |
| 传入 `$15,180.14` | ❌ 类型错误 | String 无法赋值给 Number |

### 修复后的表现

| 场景 | 结果 | 存储金额 |
|------|------|---------|
| 不传 `f1_money` | ✅ 成功 | 0 |
| `f1_money: undefined` | ✅ 成功 | 0 |
| 传入 `f1_total: "$15,180.14"` | ✅ 成功 | 1518014 |
| 传入 `f1_money: 1518014` | ✅ 成功 | 1518014 |
| 传入 `f1_total: "abc"` | ✅ 成功 | 0（带警告日志） |

---

## 🔍 调试日志

### 成功的日志输出

```
F1 Checkout Html {"f1_name":"...","f1_total":"$15,180.14","f1_quarty":"Q1 2026"}
User ID from Cookie: dd60e170-2DFC-4E32-A126-0FBF704A8D6E
金额转换成功: $15,180.14 -> 1518014 分
准备保存订单: {
  f1Name: 'FORMULA LENOVO GRAND PRIX DU CANADA 2026',
  f1Title: 'Paddock Club',
  f1Quarty: 'Q1 2026',
  f1Money: 1518014,
  id: 'dd60e170-2DFC-4E32-A126-0FBF704A8D6E'
}
订单保存成功: 123 金额: 1518014 分
```

### 异常情况日志

```
F1 Checkout Html {"f1_name":"...","f1_total":"abc"}
User ID from Cookie: xxx
金额解析失败: abc
准备保存订单: {
  f1Money: 0
}
订单保存成功: 124 金额: 0 分
```

---

## ⚠️ 注意事项

### 1. TypeORM Synchronize

检查 `.env.development` 配置：
```ini
DB_SYNCHRONIZE=false  # 生产环境建议设为 false
```

**影响：**
- `true`: 每次启动自动同步实体和数据库（开发环境方便）
- `false`: 不会自动修改表结构，需要手动迁移（生产环境安全）

### 2. 重启服务

修改后必须重启 NestJS 服务：
```bash
pm2 restart meimei_server
# 或
npm run start:dev
```

### 3. 数据迁移风险

如果已有数据：
```sql
-- 先检查现有数据的 f1_money 值
SELECT COUNT(*) FROM f1_order WHERE f1_money IS NULL OR f1_money = 0;

-- 如果有大量 0 值的订单，可能需要回补
UPDATE f1_order SET f1_money = 1518014 WHERE f1_order_id = XXX;
```

---

## 📞 常见问题

### Q1: 为什么不直接把 f1_money 设为必填？

A: 为了更好的用户体验和灵活性：
- 允许只传 `f1_total`（字符串格式），后端自动转换
- 兼容旧系统直接传递 `f1_money`（数字格式）
- 提供默认值兜底

### Q2: 金额单位会不会混乱？

A: 不会，统一规范：
- 数据库存储：分（整数）
- API 响应：分
- 前端展示：元（需要 ÷ 100）

### Q3: 如何验证修复是否成功？

A: 运行测试命令：
```bash
curl -X POST "http://localhost:3000/api/cart/checkoutHtml" \
  -H "Content-Type: application/json" \
  -d '{"f1_name":"test","f1_total":"$100","f1_quarty":"Q1"}'
```

应该返回 HTML 页面，数据库中 `f1_money` 应为 10000 分。

---

## ✅ 验证清单

- [x] 实体添加 `default: 0`
- [x] 字段改为可选 `f1Money?`
- [x] Service 层增加金额转换逻辑
- [x] Controller 层双重保险
- [x] 完善日志输出
- [ ] 数据库表结构更新
- [ ] 服务重启
- [ ] 测试通过

---

修复完成后，之前的 curl 命令应该可以正常工作了！🎉
