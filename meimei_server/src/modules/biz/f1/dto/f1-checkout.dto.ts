import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * F1订单结账DTO
 */
export class F1CheckoutDto {
  @ApiProperty({ description: 'F1名称' })
  @IsString()
  @IsNotEmpty({ message: 'F1名称不能为空' })
  f1_name: string

  @ApiProperty({ description: 'F1标题' })
  @IsString()
  @IsNotEmpty({ message: 'F1标题不能为空' })
  f1_title: string

  @ApiProperty({ description: 'F1季度' })
  @IsString()
  @IsNotEmpty({ message: 'F1季度不能为空' })
  f1_quarty: string

  @ApiProperty({ description: 'F1金额（分）' })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty({ message: 'F1金额不能为空' })
  f1_money: number

  @ApiProperty({ description: '关联ID' })
  id?: string
}
