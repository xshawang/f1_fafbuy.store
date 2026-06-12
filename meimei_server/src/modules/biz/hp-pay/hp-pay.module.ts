import { Module, forwardRef } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { F1Module } from '../f1/f1.module'
import { HpPayController } from './hp-pay.controller'
import { HpPayService } from './hp-pay.service'

@Module({
  imports: [HttpModule, forwardRef(() => F1Module)],
  controllers: [HpPayController],
  providers: [HpPayService],
  exports: [HpPayService],
})
export class HpPayModule {}
