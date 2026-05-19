import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as fs from 'fs/promises'
import * as path from 'path'
import { F1Order } from './entities/f1-order.entity'
import { F1CheckoutDto } from './dto/f1-checkout.dto'
import { ApiException } from 'src/common/exceptions/api.exception'

@Injectable()
export class F1Service {
  constructor(
    @InjectRepository(F1Order)
    private readonly f1OrderRepository: Repository<F1Order>,
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
      
      // 处理金额：如果 f1_money 不存在或为0，尝试从 f1_total 转换（不转分）
      if (!checkoutDto.f1_money || checkoutDto.f1_money === 0) {
        if (checkoutDto.f1_total && typeof checkoutDto.f1_total === 'string') {
          const moneyValue = parseFloat(checkoutDto.f1_total.replace('$', '').replace(',', ''))
          if (!isNaN(moneyValue)) {
            f1Order.f1Money = moneyValue // 保持原值，不乘以100
          } else {
            f1Order.f1Money = 0
          }
        } else {
          f1Order.f1Money = 0
        }
      } else {
        f1Order.f1Money = checkoutDto.f1_money
      }
      
      f1Order.id = checkoutDto.id || ''
      f1Order.orderStatus = 0 // 默认待处理
      f1Order.isDeleted = 0 // 默认未删除

      console.log('准备保存订单:', {
        f1Name: f1Order.f1Name,
        f1Title: f1Order.f1Title,
        f1Quarty: f1Order.f1Quarty,
        f1Money: f1Order.f1Money,
        id: f1Order.id
      })

      // 保存到数据库
      const savedOrder = await this.f1OrderRepository.save(f1Order)
      
      console.log('订单保存成功:', savedOrder.f1OrderId, '金额:', savedOrder.f1Money)
      
      // 2. 读取HTML模板文件
      const htmlContent = await this.readCheckoutHtml()
      
      // 3. 返回订单数据和HTML内容
      return {
        order: savedOrder,
        html: htmlContent
      }
    } catch (error) {
      console.error('checkoutWithHtml 错误:', error)
      throw new ApiException(`Checkout失败: ${error.message}`)
    }
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
}

