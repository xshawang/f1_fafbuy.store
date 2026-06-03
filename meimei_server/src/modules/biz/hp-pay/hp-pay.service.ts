import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'
import { createHash } from 'crypto'
import {
  HpPayCreatePayDto,
  HpPayCreatePayoutDto,
  HpPayNotifyDto,
  HpPayOrderQueryDto,
  HpPayRequestDto,
} from './dto/hp-pay.dto'
import { ApiException } from 'src/common/exceptions/api.exception'

type PlainRecord = Record<string, string | number>

type HpPayResponse<T = any> = {
  status: number
  result: T
  sign: string
}

@Injectable()
export class HpPayService {
  private readonly logger = new Logger(HpPayService.name)

  constructor(private readonly httpService: HttpService) {}

  private getConfig() {
    const baseUrl = process.env.HP_PAY_BASE_URL || ''
    const uid = process.env.HP_PAY_UID || ''
    const key = process.env.HP_PAY_KEY || ''
    const timeout = Number(process.env.HP_PAY_TIMEOUT_MS || 10000)

    if (!baseUrl || !uid || !key) {
      throw new ApiException('缺少 HP Pay 配置：请设置 HP_PAY_BASE_URL、HP_PAY_UID、HP_PAY_KEY')
    }

    return { baseUrl, uid, key, timeout }
  }

  private resolveTimestamp(timestamp?: number): number {
    return timestamp ?? Math.floor(Date.now() / 1000)
  }

  private normalizeValue(value: unknown): string {
    if (value === undefined || value === null) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    return JSON.stringify(value)
  }

  private generateSign(payload: Record<string, unknown>, key: string): string {
    const signText = Object.keys(payload)
      .filter((k) => k !== 'sign')
      .sort()
      .map((k) => `${k}=${this.normalizeValue(payload[k])}`)
      .join('&')
      .concat(`&key=${key}`)

    return createHash('md5').update(signText, 'utf8').digest('hex').toUpperCase()
  }

  private buildFormPayload(payload: Record<string, unknown>): string {
    const form = new URLSearchParams()
    for (const [key, value] of Object.entries(payload)) {
      form.append(key, this.normalizeValue(value))
    }
    return form.toString()
  }

  private async requestHpPay<T = any>(path: string, payload: PlainRecord): Promise<{
    upstream: HpPayResponse<T>
    signValid: boolean
    expectedSign: string
  }> {
    const { baseUrl, key, timeout } = this.getConfig()
    const endpoint = `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`

    const requestSign = this.generateSign(payload, key)
    const requestBody = {
      ...payload,
      sign: requestSign,
    }

    this.logger.log(`HP Pay request -> ${endpoint}, orderid=${payload.orderid || ''}`)
    this.logger.log(`HP Pay request body: ${this.buildFormPayload(requestBody)}`)

    let response: any
    try {
      response = await firstValueFrom(
        this.httpService.post(endpoint, this.buildFormPayload(requestBody), {
          timeout,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          responseType: 'text',
          transformResponse: [(data) => data],
        }),
      )
    } catch (httpError: any) {
      // 详细打印 HTTP 错误信息
      const status = httpError?.response?.status
      const statusText = httpError?.response?.statusText
      const respBody = httpError?.response?.data
      const errCode = httpError?.code
      const errMsg = httpError?.message
      this.logger.error(
        `HP Pay HTTP 请求失败 -> endpoint=${endpoint}, orderid=${payload.orderid || ''}, ` +
        `httpStatus=${status || 'N/A'}, statusText=${statusText || 'N/A'}, ` +
        `errorCode=${errCode || 'N/A'}, errorMessage=${errMsg || 'N/A'}, ` +
        `respBody=${typeof respBody === 'string' ? respBody.substring(0, 500) : JSON.stringify(respBody || {}).substring(0, 500)}`
      )
      throw new ApiException(
        `HP Pay 请求失败: ${errMsg || errCode || 'unknown'}` +
        (status ? ` (HTTP ${status})` : '') +
        (respBody ? ` body=${typeof respBody === 'string' ? respBody.substring(0, 200) : JSON.stringify(respBody).substring(0, 200)}` : '')
      )
    }

    this.logger.log(`HP Pay response: ${(response.data as string).substring(0, 500)}`)

    let data: HpPayResponse<T>
    try {
      data = JSON.parse(response.data as string)
    } catch (error) {
      this.logger.error(`HP Pay response parse failed, raw=${response.data}`)
      throw new ApiException(
        `HP Pay 返回非 JSON 数据: ${typeof response.data === 'string' ? response.data.substring(0, 200) : String(response.data)}`
      )
    }

    const resultText = typeof data.result === 'string' ? data.result : JSON.stringify(data.result)
    const expectedSign = this.generateSign(
      {
        status: this.normalizeValue(data.status),
        result: resultText,
      },
      key,
    )

    return {
      upstream: data,
      signValid: data.sign === expectedSign,
      expectedSign,
    }
  }

  async pay(dto: HpPayCreatePayDto) {
    const { uid } = this.getConfig()

    const payload: PlainRecord = {
      uid,
      currencyID: dto.currencyID,
      orderid: dto.orderid,
      channel: dto.channel,
      notify_url: dto.notify_url,
      return_url: dto.return_url,
      amount: dto.amount,
      user_id: dto.user_id,
      user_name: dto.user_name,
      userip: dto.userip,
      timestamp: this.resolveTimestamp(dto.timestamp),
      custom: dto.custom ?? '',
    }

    return this.requestHpPay('/pay', payload)
  }

  async applyfor(dto: HpPayCreatePayoutDto) {
    const { uid } = this.getConfig()

    const payload: PlainRecord = {
      uid,
      currencyID: dto.currencyID,
      orderid: dto.orderid,
      channel: dto.channel,
      notify_url: dto.notify_url,
      amount: dto.amount,
      userip: dto.userip,
      timestamp: this.resolveTimestamp(dto.timestamp),
      custom: dto.custom ?? '',
      bank_account: dto.bank_account,
      bank_no: dto.bank_no,
      bank_id: dto.bank_id,
      bank_sub: dto.bank_sub,
    }

    if (dto.user_name) {
      payload.user_name = dto.user_name
    }

    return this.requestHpPay('/applyfor', payload)
  }

  async orderquery(dto: HpPayOrderQueryDto) {
    const { uid } = this.getConfig()

    const payload: PlainRecord = {
      uid,
      timestamp: this.resolveTimestamp(dto.timestamp),
    }

    if (dto.orderid) payload.orderid = dto.orderid
    if (dto.currencyID !== undefined) payload.currencyID = dto.currencyID
    if (dto.page !== undefined) payload.page = dto.page
    if (dto.row !== undefined) payload.row = dto.row
    if (dto.start) payload.start = dto.start
    if (dto.end) payload.end = dto.end
    if (dto.date_type !== undefined) payload.date_type = dto.date_type

    return this.requestHpPay('/orderquery', payload)
  }

  async getpoints(dto: HpPayRequestDto) {
    const { uid } = this.getConfig()

    const payload: PlainRecord = {
      uid,
      timestamp: this.resolveTimestamp(dto.timestamp),
    }

    return this.requestHpPay('/getpoints', payload)
  }

  verifyNotify(dto: HpPayNotifyDto) {
    const { key } = this.getConfig()
    const rawResult = typeof dto.result === 'string' ? dto.result : JSON.stringify(dto.result ?? '')

    const expectedSign = this.generateSign(
      {
        status: this.normalizeValue(dto.status),
        result: rawResult,
      },
      key,
    )

    const valid = expectedSign === dto.sign

    let parsedResult: any = rawResult
    try {
      parsedResult = JSON.parse(rawResult)
    } catch {
      parsedResult = rawResult
    }

    return {
      valid,
      expectedSign,
      payload: {
        status: Number(dto.status),
        result: parsedResult,
        rawResult,
        sign: dto.sign,
      },
    }
  }
}
