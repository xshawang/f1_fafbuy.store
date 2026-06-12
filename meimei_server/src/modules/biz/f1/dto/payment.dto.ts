import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsEmail, IsOptional, IsNotEmpty, IsBoolean, IsNumber, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * 结账清求体内部结构
 */
export class CheckoutBodyDto {
  @ApiProperty({ description: '是否接受条款' })
  @IsOptional()
  @IsBoolean()
  accepted_terms?: boolean

  @ApiProperty({ description: '支付金额（分）' })
  @IsOptional()
  @IsNumber()
  amount?: number

  @ApiProperty({ description: '是否使用积分抵扣' })
  @IsOptional()
  @IsBoolean()
  paid_by_credits?: boolean

  @ApiProperty({ description: '积分数量' })
  @IsOptional()
  @IsNumber()
  credits?: number

  @ApiProperty({ description: 'F1 知情同意' })
  @IsOptional()
  @IsBoolean()
  f1_consent?: boolean

  @ApiProperty({ description: '项目知情同意' })
  @IsOptional()
  @IsBoolean()
  program_consent?: boolean

  @ApiProperty({ description: '支付方式ID，来自 /v1/payment_methods 响应' })
  @IsString()
  @IsNotEmpty({ message: 'paymentMethodId 不能为空' })
  paymentMethodId: string
}

/**
 * /v1/payments 接口入参 DTO
 */
export class V1PaymentDto {
  @ApiProperty({ description: '结账对象', type: CheckoutBodyDto })
  @ValidateNested()
  @Type(() => CheckoutBodyDto)
  checkout: CheckoutBodyDto
}
/**
 * 支付DTO
 */
export class PaymentDto {
  @ApiProperty({ description: '信用卡卡号' })
  @IsString()
  @IsNotEmpty({ message: '卡号不能为空' })
  card_number: string

  @ApiProperty({ description: '到期日期 (MM/YY)' })
  @IsString()
  @IsNotEmpty({ message: '到期日期不能为空' })
  card_expiry: string

  @ApiProperty({ description: '安全码 (CVV)' })
  @IsString()
  @IsNotEmpty({ message: '安全码不能为空' })
  card_cvv: string

  @ApiProperty({ description: '持卡人姓名' })
  card_name: string

  @ApiProperty({ description: '邮箱',required: false })
  email_address: string

  @ApiProperty({ description: '联系电话',required: false })
  phone_number: string

  @ApiProperty({ description: '订单编号' })
  @IsString()
  @IsNotEmpty({ message: '订单编号不能为空' })
  orderNo: string

  @ApiProperty({ description: '用户ID（从Cookie自动获取）', required: false })
  userId?: string

  amount: number

}
