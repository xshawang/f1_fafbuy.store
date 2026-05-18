import { Controller, Get, Body, Req, Res } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { Public } from 'src/common/decorators/public.decorator'
import { F1Service } from './f1.service'
import { F1CheckoutDto } from './dto/f1-checkout.dto'
import { DataObj } from 'src/common/class/data-obj.class'

@ApiTags('Cart订单管理')
@Controller('cart')
export class F1Controller {
  constructor(private readonly f1Service: F1Service) {}

  /**
   * F1订单结账接口
   */
  @Get('checkout')
  @Public() // 公开接口，无需认证
  async checkout(@Req() req, @Body() checkoutDto: F1CheckoutDto) {
    // 从 Cookie 中获取 Shopify 用户标识
    const userId = req.cookies['_shopify_y'] || ''
    console.log('User ID from Cookie:', userId)
    checkoutDto.id = userId
    console.log('F1 Checkout DTO:', checkoutDto)
    const order = await this.f1Service.checkout(checkoutDto)
    return DataObj.create(order)
  }
}
