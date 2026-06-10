import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { HpPayController } from './hp-pay.controller'
import { HpPayService } from './hp-pay.service'

@Module({
  imports: [HttpModule],
  controllers: [HpPayController],
  providers: [HpPayService],
  exports: [HpPayService],
})
export class HpPayModule {}
