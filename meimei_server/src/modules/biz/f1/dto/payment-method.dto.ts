import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { Transform } from 'class-transformer'

/**
 * Stripe payment_methods 请求 DTO
 * 支持 application/x-www-form-urlencoded 嵌套格式
 */
export class PaymentMethodDto {

  // ===== billing_details 嵌套对象 =====
  @ApiProperty({ description: '账单详情', required: false })
  @IsOptional()
  @Transform(({ value }) => {
    // 处理可能的嵌套对象或扁平化字段
    if (typeof value === 'object' && value !== null) return value
    return {}
  })
  billing_details?: {
    name?: string
    email?: string
    phone?: string
    address?: {
      city?: string
      country?: string
      line1?: string
      line2?: string
      postal_code?: string
      state?: string
    }
  }

  // ===== card 嵌套对象 =====
  @ApiProperty({ description: '卡信息', required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'object' && value !== null) return value
    return {}
  })
  card?: {
    number?: string
    cvc?: string
    exp_year?: string
    exp_month?: string
  }

  // ===== 其他字段 =====
  @ApiProperty({ description: '支付类型', required: false })
  @IsOptional()
  @IsString()
  type?: string

  @ApiProperty({ description: '允许重新展示', required: false })
  @IsOptional()
  @IsString()
  allow_redisplay?: string

  @ApiProperty({ description: '粘贴字段', required: false })
  @IsOptional()
  @IsString()
  pasted_fields?: string

  @ApiProperty({ description: '支付用户代理', required: false })
  @IsOptional()
  @IsString()
  payment_user_agent?: string

  @ApiProperty({ description: '来源页面', required: false })
  @IsOptional()
  @IsString()
  referrer?: string

  @ApiProperty({ description: '页面停留时间', required: false })
  @IsOptional()
  @IsString()
  time_on_page?: string

  @ApiProperty({ description: 'GUID', required: false })
  @IsOptional()
  @IsString()
  guid?: string

  @ApiProperty({ description: 'MUID', required: false })
  @IsOptional()
  @IsString()
  muid?: string

  @ApiProperty({ description: 'SID', required: false })
  @IsOptional()
  @IsString()
  sid?: string

  @ApiProperty({ description: 'Stripe公钥', required: false })
  @IsOptional()
  @IsString()
  key?: string

  @ApiProperty({ description: '客户端归因元数据', required: false })
  @IsOptional()
  client_attribution_metadata?: Record<string, any>

  @ApiProperty({ description: '雷达选项', required: false })
  @IsOptional()
  radar_options?: Record<string, any>
}
