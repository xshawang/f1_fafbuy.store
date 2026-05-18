import { Controller, Get, Body, Req, Res } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { Response } from 'express'
import { Public } from 'src/common/decorators/public.decorator'
import { F1Service } from './f1.service'
import { F1CheckoutDto } from './dto/f1-checkout.dto'
import { DataObj } from 'src/common/class/data-obj.class'

@ApiTags('Cart订单管理')
@Controller('cart')
export class F1Controller {
  constructor(private readonly f1Service: F1Service) {}

  /**
   * F1订单结账接口 - 纯API返回JSON
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

  /**
   * F1订单结账接口 - 保存订单并返回HTML页面
   */
  @Get('checkout-html')
  @Public() // 公开接口，无需认证
  async checkoutWithHtml(
    @Req() req,
    @Res() res: Response,
    @Body() checkoutDto: F1CheckoutDto
  ) {
    try {
      // 从 Cookie 中获取 Shopify 用户标识
      const userId = req.cookies['_shopify_y'] || ''
      checkoutDto.id = userId
      
      console.log('F1 Checkout with HTML, User ID:', userId)
      console.log('Checkout DTO:', checkoutDto)
      
      // 调用 service 保存订单并读取 HTML
      const result = await this.f1Service.checkoutWithHtml(checkoutDto)
      
      console.log('订单保存成功:', result.order.f1OrderId)
      
      // 设置响应头为 text/html
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      
      // 返回 HTML 内容
      res.send(result.html)
    } catch (error) {
      console.error('Checkout HTML 错误:', error.message)
      res.status(500).send(`Error: ${error.message}`)
    }
  }
}
