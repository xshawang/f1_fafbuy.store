import { Body, Controller, Post, Req, Res, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Request, Response } from 'express'
import { Keep } from 'src/common/decorators/keep.decorator'
import { Public } from 'src/common/decorators/public.decorator'
import {
  HpPayCreatePayDto,
  HpPayCreatePayoutDto,
  HpPayNotifyDto,
  HpPayOrderQueryDto,
  HpPayRequestDto,
} from './dto/hp-pay.dto'
import { HpPayService } from './hp-pay.service'
import { F1Service } from '../f1/f1.service'

@ApiTags('HP Pay')
@Public()
@Controller('hp-pay')
export class HpPayController {
  constructor(private readonly f1Service: F1Service, private readonly hpPayService: HpPayService) {}

  @ApiOperation({ summary: '收款下单 /pay' })
  @Post('pay')
  pay(@Body() dto: HpPayCreatePayDto) {
    return this.hpPayService.pay(dto)
  }

  @ApiOperation({ summary: '代付下单 /applyfor' })
  @Post('applyfor')
  applyfor(@Body() dto: HpPayCreatePayoutDto) {
    return this.hpPayService.applyfor(dto)
  }

  @ApiOperation({ summary: '订单查询 /orderquery' })
  @Post('orderquery')
  orderquery(@Body() dto: HpPayOrderQueryDto) {
    return this.hpPayService.orderquery(dto)
  }

  @ApiOperation({ summary: '余额查询 /getpoints' })
  @Post('getpoints')
  getpoints(@Body() dto: HpPayRequestDto) {
    return this.hpPayService.getpoints(dto)
  }

  @ApiOperation({ summary: '异步通知验签' })
  @Post('notify')
  @Public()
  @Keep()
  @UseInterceptors(FileInterceptor(''))
  async notify(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // 兼容 multipart/form-data 和 JSON
    const body: any = req.body ?? {}
    const dto: HpPayNotifyDto = {
      status: body.status,
      sign: body.sign,
      result: typeof body.result === 'string' ? body.result : JSON.stringify(body.result ?? ''),
    }

    const verified = await this.f1Service.handleHpPayNotify(dto)
    console.log('HP Pay Notify Verification:', verified)
    if (!verified) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.send('fail')
      return
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.send('success')
  }
}
