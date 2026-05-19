import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { F1Order } from './entities/f1-order.entity'
import { Payment } from './entities/payment.entity'
import { F1Service } from './f1.service'
import { F1Controller } from './f1.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([F1Order, Payment]),
  ],
  controllers: [F1Controller],
  providers: [F1Service],
  exports: [F1Service],
})
export class F1Module {}
