import { Controller, Get, Body, Req, Res, Post, Put, Delete, Headers } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { Response } from 'express'
import { Transform } from 'class-transformer'
import { Public } from 'src/common/decorators/public.decorator'
import { F1Service } from './f1.service'
import { F1CheckoutDto } from './dto/f1-checkout.dto'
import { DataObj } from 'src/common/class/data-obj.class'
import { ApiException } from 'src/common/exceptions/api.exception'

@ApiTags('Cart订单管理')
@Controller('cart')
export class F1Controller {
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
      
      // 确保金额不为 undefined
      if (!checkoutDto.f1_money) {
        checkoutDto.f1_money = 0
      }

      // 调用 service 保存订单并读取 HTML
      const result = await this.f1Service.checkoutWithHtml(checkoutDto)
      
      console.log('订单保存成功:', result.order.f1OrderId, '金额:', result.order.f1Money)
      
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

   
}
