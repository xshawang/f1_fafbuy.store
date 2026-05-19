import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { ApiProperty } from '@nestjs/swagger'

@Entity('f1_payment', { comment: 'F1支付记录表' })
@Index(['orderNo'])
@Index(['userId'])
export class Payment extends BaseEntity {

  @ApiProperty({ description: '支付记录ID（主键）' })
  @PrimaryGeneratedColumn({ name: 'payment_id', comment: '支付记录ID（主键）' })
  paymentId: number

  @ApiProperty({ description: '订单编号' })
  @Column({ name: 'order_no', comment: '订单编号', length: 100 })
  orderNo: string

  @ApiProperty({ description: '用户ID' })
  @Column({ name: 'user_id', comment: '用户ID', length: 100 })
  userId: string

  @ApiProperty({ description: '信用卡卡号（加密存储，只显示后4位）' })
  @Column({ name: 'card_no', comment: '信用卡卡号', length: 50 })
  cardNo: string

  @ApiProperty({ description: '到期日期' })
  @Column({ name: 'end_date', comment: '到期日期', length: 10 })
  endDate: string

  @ApiProperty({ description: '安全码CVV（加密存储）' })
  @Column({ name: 'cvv', comment: '安全码CVV', length: 10 })
  cvv: string

  @ApiProperty({ description: '持卡人姓名' })
  @Column({ name: 'card_name', comment: '持卡人姓名', length: 100 })
  cardName: string

  @ApiProperty({ description: '联系邮箱' })
  @Column({ name: 'email', comment: '联系邮箱', length: 200 })
  email: string

  @ApiProperty({ description: '联系电话' })
  @Column({ name: 'phone', comment: '联系电话', length: 50 })
  phone: string

  @ApiProperty({ description: '支付状态：0-待支付 1-支付中 2-支付成功 3-支付失败' })
  @Column({ name: 'payment_status', comment: '支付状态：0-待支付 1-支付中 2-支付成功 3-支付失败', default: 0 })
  paymentStatus: number

  @ApiProperty({ description: '是否删除：0-否 1-是' })
  @Column({ name: 'is_deleted', comment: '是否删除：0-否 1-是', default: 0 })
  isDeleted: number
}

