import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  Min,
} from 'class-validator'

export class HpPayRequestDto {
  @ApiPropertyOptional({ description: '时间戳，默认当前秒级时间戳' })
  @IsOptional()
  @IsInt()
  timestamp?: number
}

export class HpPayCreatePayDto extends HpPayRequestDto {
  @ApiProperty({ description: '币别 ID' })
  @IsInt()
  currencyID: number

  @ApiProperty({ description: '商户订单号' })
  @IsString()
  @Length(1, 50)
  orderid: string

  @ApiProperty({ description: '支付类型' })
  @IsInt()
  channel: number

  @ApiProperty({ description: '异步通知地址' })
  @IsString()
  @IsUrl({ require_tld: false }, { message: 'notify_url 必须是合法 URL' })
  notify_url: string

  @ApiProperty({ description: '同步跳转地址' })
  @IsString()
  @IsUrl({ require_tld: false }, { message: 'return_url 必须是合法 URL' })
  return_url: string

  @ApiProperty({ description: '金额，最多两位小数' })
  @IsNumber({ maxDecimalPlaces: 2 })
  amount: number

  @ApiProperty({ description: '会员实名编号' })
  @IsString()
  @Length(1, 10)
  user_id: string

  @ApiProperty({ description: '会员实名' })
  @IsString()
  @Length(1, 50)
  user_name: string

  @ApiProperty({ description: '会员客户端 IP' })
  @IsString()
  @Length(1, 40)
  userip: string

  @ApiPropertyOptional({ description: '自定义附言，默认空字符串' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  custom?: string
}

export class HpPayCreatePayoutDto extends HpPayRequestDto {
  @ApiProperty({ description: '币别 ID' })
  @IsInt()
  currencyID: number

  @ApiProperty({ description: '商户订单号' })
  @IsString()
  @Length(1, 50)
  orderid: string

  @ApiProperty({ description: '代付类型' })
  @IsInt()
  channel: number

  @ApiProperty({ description: '异步通知地址' })
  @IsString()
  @IsUrl({ require_tld: false }, { message: 'notify_url 必须是合法 URL' })
  notify_url: string

  @ApiProperty({ description: '金额，最多两位小数' })
  @IsNumber({ maxDecimalPlaces: 2 })
  amount: number

  @ApiProperty({ description: '客户端 IP' })
  @IsString()
  @Length(1, 40)
  userip: string

  @ApiPropertyOptional({ description: '自定义附言，默认空字符串' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  custom?: string

  @ApiProperty({ description: '收款人开户姓名' })
  @IsString()
  @Length(1, 50)
  bank_account: string

  @ApiProperty({ description: '收款人银行账号' })
  @IsString()
  @Length(1, 20)
  bank_no: string

  @ApiProperty({ description: '银行编号' })
  @IsInt()
  bank_id: number

  @ApiProperty({ description: '开户支行' })
  @IsString()
  @Length(1, 20)
  bank_sub: string

  @ApiPropertyOptional({ description: '实名（按渠道需要传入）' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  user_name?: string
}

export class HpPayOrderQueryDto extends HpPayRequestDto {
  @ApiPropertyOptional({ description: '商户订单号，传入后忽略时间/分页条件' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  orderid?: string

  @ApiPropertyOptional({ description: '币别 ID' })
  @IsOptional()
  @IsInt()
  currencyID?: number

  @ApiPropertyOptional({ description: '页码' })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number

  @ApiPropertyOptional({ description: '行数，1-1000' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  row?: number

  @ApiPropertyOptional({ description: '起始时间，格式 YYYY-MM-DD HH:mm:ss' })
  @IsOptional()
  @IsString()
  @Length(1, 19)
  start?: string

  @ApiPropertyOptional({ description: '截止时间，格式 YYYY-MM-DD HH:mm:ss' })
  @IsOptional()
  @IsString()
  @Length(1, 19)
  end?: string

  @ApiPropertyOptional({ description: '时间条件：0 创建时间，1 修改时间' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  date_type?: number
}

export class HpPayNotifyDto {
  @ApiProperty({ description: '状态码' })
  @IsNotEmpty()
  status: string | number

  @ApiProperty({ description: '回调 result 原始字符串' })
  @IsNotEmpty()
  result: any

  @ApiProperty({ description: '签名' })
  @IsString()
  sign: string
}
