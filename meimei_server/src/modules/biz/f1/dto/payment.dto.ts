import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsEmail, IsOptional, IsNotEmpty } from 'class-validator'

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
  @IsString()
  @IsNotEmpty({ message: '持卡人姓名不能为空' })
  card_name: string

  @ApiProperty({ description: '邮箱' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email_address: string

  @ApiProperty({ description: '联系电话' })
  @IsString()
  @IsNotEmpty({ message: '联系电话不能为空' })
  phone_number: string

  @ApiProperty({ description: '订单编号' })
  @IsString()
  @IsNotEmpty({ message: '订单编号不能为空' })
  orderNo: string

  @ApiProperty({ description: '用户ID（从Cookie自动获取）', required: false })
  @IsString()
  @IsOptional()
  userId?: string
}
