import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as fs from 'fs/promises'
import * as path from 'path'
import { F1Order } from './entities/f1-order.entity'
import { Payment } from './entities/payment.entity'
import { F1CheckoutDto } from './dto/f1-checkout.dto'
import { PaymentDto } from './dto/payment.dto'
import { ApiException } from 'src/common/exceptions/api.exception'

@Injectable()
export class F1Service {
  constructor(
    @InjectRepository(F1Order)
    private readonly f1OrderRepository: Repository<F1Order>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

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
      const htmlContentWithProduct =  await this.replaceProductArea(htmlContent, f1Order)
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
    let titleLabel = 'name flex-grow font-weight-600'
    let titleIndex = htmlContent.indexOf(titleLabel)
    if (titleIndex !== -1) {
      let titleEndIndex = htmlContent.indexOf('</p>', titleIndex)
      if (titleEndIndex !== -1) {
        htmlContent = htmlContent.substring(0, titleEndIndex+titleLabel.length+2) + f1Order.f1Title + htmlContent.substring(titleEndIndex)
      }
    }

  //替换价格
    let priceLable = 'class="price">'
    let priceIndex = htmlContent.indexOf(priceLable)
    if (priceIndex !== -1) {
      let priceEndIndex = htmlContent.indexOf('</p>', priceIndex)
      if (priceEndIndex !== -1) {
        htmlContent = htmlContent.substring(0, priceEndIndex+priceLable.length) + '$'+f1Order.f1Money + htmlContent.substring(priceEndIndex)
      }
    }

    //替换名称
    let nameLable = 'class="event-name">'
    let nameIndex = htmlContent.indexOf(nameLable)
    if (nameIndex !== -1) {
      let nameEndIndex = htmlContent.indexOf('</p>', nameIndex)
      if (nameEndIndex !== -1) {
        htmlContent = htmlContent.substring(0, nameEndIndex+nameLable.length) + f1Order.f1Name + htmlContent.substring(nameEndIndex)
      }
    }

    //替换数量
    htmlContent = htmlContent.replace(/class="item-amount">2<\/p>/, `class="item-amount">${f1Order.f1Quarty}</p>`)

    htmlContent = htmlContent.replaceAll("$4,826.00", '$'+f1Order.f1Money)
    htmlContent = htmlContent.replaceAll("$4,968.37", '$'+f1Order.f1Money)
    return htmlContent
  }
  /**
   * 根据ID获取F1订单
   */
  async findOne(f1OrderId: number): Promise<F1Order> {
    const order = await this.f1OrderRepository.findOne({
      where: { f1OrderId, isDeleted: 0 }
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
      payment.cardNo = paymentDto.cardNo
      payment.endDate = paymentDto.endDate
      payment.cvv = paymentDto.cvv
      payment.cardName = paymentDto.cardName
      payment.email = paymentDto.email
      payment.phone = paymentDto.phone
      payment.paymentStatus = 0 // 默认待支付
      payment.isDeleted = 0

      // 保存到数据库
      const savedPayment = await this.paymentRepository.save(payment)
      
      console.log('支付信息保存成功:', savedPayment.paymentId)
      
      return savedPayment
    } catch (error) {
      console.error('保存支付信息失败:', error)
      throw new ApiException(`保存支付信息失败: ${error.message}`)
    }
  }
}

