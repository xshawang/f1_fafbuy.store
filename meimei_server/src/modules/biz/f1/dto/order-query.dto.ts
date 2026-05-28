import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional, IsDateString } from 'class-validator'

/**
 * 订单查询 DTO
 */
export class OrderQueryDto {
  @ApiProperty({ description: '订单编号', required: false })
  @IsString()
  @IsOptional()
  orderNo?: string

  @ApiProperty({ description: '开始日期', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string

  @ApiProperty({ description: '结束日期', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string

  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  pageNum?: number

  @ApiProperty({ description: '每页数量', required: false, default: 10 })
  @IsOptional()
  pageSize?: number
}

/**
 * 订单响应 DTO
 */
export class OrderResponseDto {
  @ApiProperty({ description: '订单编号' })
  orderNo: string

  @ApiProperty({ description: '订单金额' })
  f1Money: number

  @ApiProperty({ description: '订单名称' })
  f1Name: string

  @ApiProperty({ description: '订单标题' })
  f1Title: string

  @ApiProperty({ description: '创建时间' })
  createTime: Date

  @ApiProperty({ description: '订单状态：0-待处理 1-处理中 2-已完成 3-已取消' })
  orderStatus: number
}

/**
 * 分页响应 DTO
 */
export class PaginatedResponseDto {
  @ApiProperty({ description: '数据列表' })
  list: OrderResponseDto[]

  @ApiProperty({ description: '总数' })
  total: number

  @ApiProperty({ description: '页码' })
  pageNum: number

  @ApiProperty({ description: '每页数量' })
  pageSize: number
}
