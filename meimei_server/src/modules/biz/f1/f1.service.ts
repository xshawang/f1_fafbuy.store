import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
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

