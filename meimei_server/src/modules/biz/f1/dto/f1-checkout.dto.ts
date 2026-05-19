import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * F1订单结账DTO
 * 支持 JSON 和 application/x-www-form-urlencoded 表单提交
 */
export class F1CheckoutDto {
  @ApiProperty({ description: 'F1名称' })
    @IsOptional()
  f1_name: string

  @ApiProperty({ description: 'F1标题' })
    @IsOptional()
  f1_title: string

  @ApiProperty({ description: 'F1季度' })
    @IsOptional()
  f1_quarty: string

  @ApiProperty({ description: 'F1金额（字符串格式，如 "$15,180.14"）', example: '$15,180.14' })
  @IsOptional()
  f1_total: string

  @ApiProperty({ description: 'F1金额（数字格式，单位：分）' })
  @IsOptional()
  f1_money?: number

  @ApiProperty({ description: '关联用户ID（从Cookie自动获取）', required: false })
  @IsString()
  @IsOptional()
  id?: string
}
