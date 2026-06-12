import { Controller, Get, Query, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Response } from 'express'
import { Public } from 'src/common/decorators/public.decorator'
import { F1Service } from './f1.service'

@ApiTags('卡券商品详情')
@Controller('card')
export class CardController {
  constructor(private readonly f1Service: F1Service) {}

  /** 根据订单号查询商品购买详情 */
  @Get('detail')
  @Public()
  async detail(@Query('orderNo') orderNo: string, @Res() res: Response) {
    if (!orderNo) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      return res.status(400).send('<h1>错误：orderNo 不能为空</h1>')
    }
    try {
      const order = await this.f1Service.findOne(orderNo)
      const statusMap: Record<number, string> = { 0: 'Pending', 1: 'Processed', 2: 'Completed', 3: 'Cancelled' }
      const statusText = statusMap[order.orderStatus] || '未知'
      
      const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>订单详情 - ${order.orderNo}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; background: #f5f5f5; }
    .card { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #333; margin-bottom: 24px; font-size: 24px; }
    .field { margin-bottom: 16px; }
    .label { color: #666; font-size: 14px; margin-bottom: 4px; }
    .value { color: #333; font-size: 16px; font-weight: 500; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 14px; }
    .status-0 { background: #fff3cd; color: #856404; }
    .status-1 { background: #d1ecf1; color: #0c5460; }
    .status-2 { background: #d4edda; color: #155724; }
    .status-3 { background: #f8d7da; color: #721c24; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Order Details</h1>
    <div class="field">
      <div class="label">Order No.</div>
      <div class="value">${order.orderNo}</div>
    </div>
    <div class="field">
      <div class="label">F1 Event Name</div>
      <div class="value">${order.f1Name}</div>
    </div>
    <div class="field">
      <div class="label">Package</div>
      <div class="value">${order.f1Title}</div>
    </div>
    <div class="field">
      <div class="label">Quantity</div>
      <div class="value">${order.f1Quarty}</div>
    </div>
    <div class="field">
      <div class="label">Amount</div>
      <div class="value">$${order.f1Money || 0}</div>
    </div>
    <div class="field">
      <div class="label">Handling Fee</div>
      <div class="value">$${order.f1Free || 0}</div>
    </div>
    <div class="field">
      <div class="label">Order Status</div>
      <div class="value"><span class="status status-${order.orderStatus}">${statusText}</span></div>
    </div>
    <div class="field">
      <div class="label">Created Time</div>
      <div class="value">${order.createTime ? new Date(order.createTime) : '-'}</div>
    </div>
  </div>
</body>
</html>`
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      return res.send(html)
    } catch (e) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      return res.status(404).send(`<h1>错误：${e?.message || '订单不存在'}</h1>`)
    }
  }
}
