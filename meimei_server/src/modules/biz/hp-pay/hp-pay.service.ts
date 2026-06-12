import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common'
import { createHash } from 'crypto'
import { HttpClient } from 'src/common/utils/http-client'
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

  /**
   * 从原始 JSON 字符串中精确提取 result 字段的值
   * 避免 JSON.parse 后再 stringify 导致格式变化（空格/key顺序）
   */
  private extractRawResult(rawBody: string): string | null {
    const marker = '"result":'
    const idx = rawBody.indexOf(marker)
    if (idx === -1) return null
    const start = idx + marker.length

    if (rawBody[start] === '{') {
      // JSON 对象 — 找到匹配的 }
      let depth = 0
      for (let i = start; i < rawBody.length; i++) {
        if (rawBody[i] === '{') depth++
        if (rawBody[i] === '}') depth--
        if (depth === 0) return rawBody.substring(start, i + 1)
      }
    } else if (rawBody[start] === '[') {
      // JSON 数组
      let depth = 0
      for (let i = start; i < rawBody.length; i++) {
        if (rawBody[i] === '[') depth++
        if (rawBody[i] === ']') depth--
        if (depth === 0) return rawBody.substring(start, i + 1)
      }
    } else if (rawBody[start] === '"') {
      // 字符串值 — 找到非转义的 "
      let i = start + 1
      while (i < rawBody.length) {
        if (rawBody[i] === '"' && rawBody[i - 1] !== '\\') return rawBody.substring(start, i + 1)
        i++
      }
    } else {
      // 数字/布尔/null — 读到 , 或 } 或 ]
      let i = start
      while (i < rawBody.length && !',}]'.includes(rawBody[i])) i++
      return rawBody.substring(start, i)
    }
    return null
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
    console.log('[hp-pay] url =>', endpoint, 'payload =>', JSON.stringify(requestBody))
    try {
      const resp = await HttpClient.formPost<HpPayResponse<T>>(endpoint, requestBody, { timeout })
      const data = resp.data

      console.log('[hp-pay] response =>', resp.rawBody)

      // 从原始响应中精确提取 result 字符串，避免 JSON.parse 后 stringify 格式变化
      const rawResultStr = this.extractRawResult(resp.rawBody) || this.normalizeValue(data.result)
      const signText = `result=${rawResultStr}&status=${data.status}&key=${key}`
      const expectedSign = createHash('md5').update(signText, 'utf8').digest('hex').toUpperCase()

      console.log('[hp-pay] signText =>', signText)
      console.log('[hp-pay] 自己sign =>', expectedSign, '| 对方sign =>', data.sign)

      return { upstream: data, signValid: data.sign === expectedSign, expectedSign }
    } catch (error: any) {
      throw new ApiException(`HP Pay 请求失败: ${error?.message || 'unknown'}`)
    }
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
