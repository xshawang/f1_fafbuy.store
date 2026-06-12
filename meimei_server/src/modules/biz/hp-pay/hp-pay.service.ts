import { HttpService } from '@nestjs/axios'
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'
import { createHash } from 'crypto'
import FormData from 'form-data'
import {
  HpPayCreatePayDto,
  HpPayCreatePayoutDto,
  HpPayNotifyDto,
  HpPayOrderQueryDto,
  HpPayRequestDto,
} from './dto/hp-pay.dto'
import { ApiException } from 'src/common/exceptions/api.exception'
import { F1Service } from 'src/modules/biz/f1/f1.service'

type PlainRecord = Record<string, string | number>

type HpPayResponse<T = any> = {
  status: number
  result: T
  sign: string
}

@Injectable()
export class HpPayService {
  private readonly logger = new Logger(HpPayService.name)

  constructor(
    private readonly httpService: HttpService,
    @Inject(forwardRef(() => F1Service)) private readonly f1Service: F1Service,
  ) {}

  // ==================== 配置 ====================

  private getConfig() {
    const baseUrl = process.env.HP_PAY_BASE_URL || ''
    const uid = process.env.HP_PAY_UID || ''
    const key = process.env.HP_PAY_KEY || ''
    const timeout = Number(process.env.HP_PAY_TIMEOUT_MS || 30000)

    if (!baseUrl || !uid || !key) {
      throw new ApiException('缺少 HP Pay 配置：请设置 HP_PAY_BASE_URL、HP_PAY_UID、HP_PAY_KEY')
    }
    return { baseUrl, uid, key, timeout }
  }

  // ==================== 工具方法 ====================

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

  // ==================== 核心请求 ====================

  private async requestHpPay<T = any>(path: string, payload: PlainRecord): Promise<{
    upstream: HpPayResponse<T>
    signValid: boolean
    expectedSign: string
  }> {
    const { baseUrl, key, timeout } = this.getConfig()
    const endpoint = `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`

    // 签名
    const requestSign = this.generateSign(payload, key)
    const requestBody: Record<string, any> = { ...payload, sign: requestSign }

    // 构造 multipart/form-data
    const form = new FormData()
    for (const [k, v] of Object.entries(requestBody)) {
      form.append(k, String(v))
    }

    // 请求日志
    const paramLog = Object.entries(requestBody).map(([k, v]) => `${k}=${v}`).join('&')
    console.log(`[HP-PAY] POST ${endpoint} | orderid=${payload.orderid || ''} | params: ${paramLog}`)

    // 发起请求
    let response: any
    try {
      response = await firstValueFrom(
        this.httpService.post(endpoint, form, {
          timeout,
          headers: form.getHeaders(),
          transformResponse: [(data) => data],
          validateStatus: () => true,
        }),
      )
    } catch (error: any) {
      // 网络层异常（超时、DNS、连接拒绝等）— 打印原始错误并抛出
      console.error('[HP-PAY] 请求异常:', {
        endpoint,
        orderid: payload.orderid,
        name: error?.name,
        code: error?.code,
        message: error?.message,
        stack: error?.stack,
      })
      throw new ApiException(`HP Pay 请求失败: ${error?.message || error?.code || error?.name || 'unknown'}`)
    }

    // 响应日志
    const respStatus = response?.status
    const rawBody = typeof response?.data === 'string' ? response.data : JSON.stringify(response?.data ?? '')
    console.log(`[HP-PAY] response: status=${respStatus}, body=${rawBody.substring(0, 500)}`)

    // HTTP 非 2xx
    if (respStatus && (respStatus < 200 || respStatus >= 300)) {
      throw new ApiException(`HP Pay HTTP ${respStatus}: ${rawBody.substring(0, 500)}`)
    }

    // 解析 JSON
    let data: HpPayResponse<T>
    try {
      data = JSON.parse(response.data as string)
    } catch (e: any) {
      console.error(`[HP-PAY] JSON 解析失败, raw=${response.data}, error=${e?.message}`)
      throw new ApiException(`HP Pay 返回非 JSON: ${String(response.data).substring(0, 200)}`)
    }

    // 验签
    const resultText = typeof data.result === 'string' ? data.result : JSON.stringify(data.result)
    const expectedSign = this.generateSign(
      { status: this.normalizeValue(data.status), result: resultText },
      key,
    )

    return { upstream: data, signValid: data.sign === expectedSign, expectedSign }
  }

  // ==================== 业务接口 ====================

  async pay(dto: HpPayCreatePayDto) {
    const { uid } = this.getConfig()
    return this.requestHpPay('/pay', {
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
    })
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
    if (dto.user_name) payload.user_name = dto.user_name
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
    return this.requestHpPay('/getpoints', {
      uid,
      timestamp: this.resolveTimestamp(dto.timestamp),
    })
  }

  // ==================== 回调验签 ====================

  verifyNotify(dto: HpPayNotifyDto) {
    const { key } = this.getConfig()
    const rawResult = typeof dto.result === 'string' ? dto.result : JSON.stringify(dto.result ?? '')

    const expectedSign = this.generateSign(
      { status: this.normalizeValue(dto.status), result: rawResult },
      key,
    )

    let parsedResult: any = rawResult
    try {
      parsedResult = JSON.parse(rawResult)
    } catch { /* 保持原始字符串 */ }

    return {
      valid: expectedSign === dto.sign,
      expectedSign,
      payload: {
        status: Number(dto.status),
        result: parsedResult,
        rawResult,
        sign: dto.sign,
      },
    }
  }

  // ==================== 回调处理 ====================

  async handleHpPayNotify(payload: any) {
    console.log('[HP-PAY] Notify Payload:', JSON.stringify(payload))

    const orderId = payload.orderid
    if (!orderId) {
      this.logger.error('[HP-PAY] 回调缺少 orderid')
      return { success: false, message: '缺少 orderid' }
    }

    try {
      const order = await this.f1Service.findOne(orderId)
      if (!order) {
        this.logger.warn(`[HP-PAY] 订单不存在: ${orderId}`)
        return { success: false, message: '订单不存在' }
      }
      this.logger.log(`[HP-PAY] 订单 ${orderId} 回调处理成功`)
      return { success: true, order }
    } catch (error: any) {
      this.logger.error(`[HP-PAY] 处理回调失败: ${error.message}`)
      return { success: false, message: error.message }
    }
  }
}
