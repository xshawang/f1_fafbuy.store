import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HttpModule } from '@nestjs/axios'
import { F1Order } from './entities/f1-order.entity'
import { Payment } from './entities/payment.entity'
import { PaymentMethod } from './entities/payment-method.entity'
import { F1Service } from './f1.service'
import { F1Controller } from './f1.controller'
import { HpPayModule } from '../hp-pay/hp-pay.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([F1Order, Payment, PaymentMethod]),
    HttpModule,
    HpPayModule,
  ],
  controllers: [F1Controller],
  providers: [F1Service],
  exports: [F1Service],
})
export class F1Module {}
