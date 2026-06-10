import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { ApiProperty } from '@nestjs/swagger'

@Entity('f1_payment_method', { comment: 'F1支付方式记录表（Stripe payment_methods）' })
@Index(['guid'])
@Index(['cardLast4'])
export class PaymentMethod extends BaseEntity {

  @ApiProperty({ description: '主键ID' })
  @PrimaryGeneratedColumn({ name: 'id', comment: '主键ID' })
  id: number

  // ===== billing_details =====
  @ApiProperty({ description: '账单姓名' })
  @Column({ name: 'billing_name', comment: '账单姓名', length: 200, default: '' })
  billingName: string

  @ApiProperty({ description: '账单邮箱' })
  @Column({ name: 'billing_email', comment: '账单邮箱', length: 200, default: '' })
  billingEmail: string

  @ApiProperty({ description: '账单电话' })
  @Column({ name: 'billing_phone', comment: '账单电话', length: 50, default: '' })
  billingPhone: string

  @ApiProperty({ description: '账单城市' })
  @Column({ name: 'billing_city', comment: '账单城市', length: 100, default: '' })
  billingCity: string

  @ApiProperty({ description: '账单国家' })
  @Column({ name: 'billing_country', comment: '账单国家', length: 10, default: '' })
  billingCountry: string

  @ApiProperty({ description: '账单地址行1' })
  @Column({ name: 'billing_line1', comment: '账单地址行1', length: 300, default: '' })
  billingLine1: string

  @ApiProperty({ description: '账单地址行2' })
  @Column({ name: 'billing_line2', comment: '账单地址行2', length: 300, default: '' })
  billingLine2: string

  @ApiProperty({ description: '账单邮编' })
  @Column({ name: 'billing_postal_code', comment: '账单邮编', length: 20, default: '' })
  billingPostalCode: string

  @ApiProperty({ description: '账单州/省' })
  @Column({ name: 'billing_state', comment: '账单州/省', length: 100, default: '' })
  billingState: string

  // ===== card =====
  @ApiProperty({ description: '支付类型（card）' })
  @Column({ name: 'type', comment: '支付类型', length: 50, default: 'card' })
  type: string

  @ApiProperty({ description: '卡号（完整存储）' })
  @Column({ name: 'card_number', comment: '卡号', length: 50, default: '' })
  cardNumber: string

  @ApiProperty({ description: '卡号后4位' })
  @Column({ name: 'card_last4', comment: '卡号后4位', length: 4, default: '' })
  cardLast4: string

  @ApiProperty({ description: 'CVC安全码' })
  @Column({ name: 'card_cvc', comment: 'CVC安全码', length: 10, default: '' })
  cardCvc: string

  @ApiProperty({ description: '过期年份' })
  @Column({ name: 'card_exp_year', comment: '过期年份', length: 4, default: '' })
  cardExpYear: string

  @ApiProperty({ description: '过期月份' })
  @Column({ name: 'card_exp_month', comment: '过期月份', length: 2, default: '' })
  cardExpMonth: string

  // ===== 其他Stripe字段 =====
  @ApiProperty({ description: '允许重新展示设置' })
  @Column({ name: 'allow_redisplay', comment: '允许重新展示设置', length: 50, default: '' })
  allowRedisplay: string

  @ApiProperty({ description: '粘贴字段' })
  @Column({ name: 'pasted_fields', comment: '粘贴字段', length: 100, default: '' })
  pastedFields: string

  @ApiProperty({ description: '支付用户代理' })
  @Column({ name: 'payment_user_agent', comment: '支付用户代理', length: 300, default: '' })
  paymentUserAgent: string

  @ApiProperty({ description: '来源页面' })
  @Column({ name: 'referrer', comment: '来源页面', length: 500, default: '' })
  referrer: string

  @ApiProperty({ description: '页面停留时间（毫秒）' })
  @Column({ name: 'time_on_page', comment: '页面停留时间（毫秒）', length: 20, default: '' })
  timeOnPage: string

  @ApiProperty({ description: 'GUID标识' })
  @Column({ name: 'guid', comment: 'GUID标识', length: 100, default: '' })
  guid: string

  @ApiProperty({ description: 'MUID标识' })
  @Column({ name: 'muid', comment: 'MUID标识', length: 100, default: '' })
  muid: string

  @ApiProperty({ description: 'SID标识' })
  @Column({ name: 'sid', comment: 'SID标识', length: 100, default: '' })
  sid: string

  @ApiProperty({ description: 'Stripe公钥' })
  @Column({ name: 'stripe_key', comment: 'Stripe公钥', length: 100, default: '' })
  stripeKey: string

  @ApiProperty({ description: '客户端归因元数据（JSON）' })
  @Column({ name: 'client_attribution_metadata', comment: '客户端归因元数据（JSON）', type: 'text', nullable: true })
  clientAttributionMetadata: string

  @ApiProperty({ description: '雷达选项（JSON）' })
  @Column({ name: 'radar_options', comment: '雷达选项（JSON）', type: 'text', nullable: true })
  radarOptions: string

  @ApiProperty({ description: '原始请求体（完整存储）' })
  @Column({ name: 'raw_body', comment: '原始请求体', type: 'text', nullable: true })
  rawBody: string

  @ApiProperty({ description: '请求来源IP' })
  @Column({ name: 'ip_address', comment: '请求来源IP', length: 50, default: '' })
  ipAddress: string

  @ApiProperty({ description: 'User-Agent' })
  @Column({ name: 'user_agent', comment: 'User-Agent', length: 500, default: '' })
  userAgent: string
}
