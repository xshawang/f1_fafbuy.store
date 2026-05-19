import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { ApiProperty } from '@nestjs/swagger'

@Entity('f1_order', { comment: 'F1订单表' })
@Index(['f1Name'])
@Index(['id'])
export class F1Order extends BaseEntity {

  @ApiProperty({ description: '订单ID（主键）' })
  @PrimaryGeneratedColumn({ name: 'f1_order_id', comment: '订单ID（主键）' })
  f1OrderId: number

  @ApiProperty({ description: 'F1名称' })
  @Column({ name: 'f1_name', comment: 'F1名称', length: 200 })
  f1Name: string

  @ApiProperty({ description: 'F1标题' })
  @Column({ name: 'f1_title', comment: 'F1标题', length: 500 })
  f1Title: string

  @ApiProperty({ description: 'F1季度' })
  @Column({ name: 'f1_quarty', comment: 'F1季度', length: 50 })
  f1Quarty: string

  @ApiProperty({ description: 'F1金额' })
  @Column({ name: 'f1_money', comment: 'F1金额', type: 'decimal', precision: 10, scale: 2, default: 0 })
  f1Money?: number

  @ApiProperty({ description: '关联ID' })
  @Column({ name: 'id', comment: '关联ID', length: 100 })
  id: string

  @ApiProperty({ description: '订单状态：0-待处理 1-已处理 2-已完成 3-已取消' })
  @Column({ name: 'order_status', comment: '订单状态：0-待处理 1-已处理 2-已完成 3-已取消', default: 0 })
  orderStatus: number

  @ApiProperty({ description: '是否删除：0-否 1-是' })
  @Column({ name: 'is_deleted', comment: '是否删除：0-否 1-是', default: 0 })
  isDeleted: number

  @ApiProperty({ description: '订单编号' })
  @Column({ name: 'order_no', comment: '订单编号', length: 200 })
  orderNo: string
}

