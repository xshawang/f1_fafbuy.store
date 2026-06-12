import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios'
import { Logger } from '@nestjs/common'
import * as https from 'https'
import * as http from 'http'
const logger = new Logger('HttpClient')

/**
 * 强制 IPv4 的 Agent
 * 服务器无 IPv6 连通性时，Node.js 默认 Happy Eyeballs 算法会尝试 IPv6，
 * 导致 ETIMEDOUT。强制 family:4 可避免此问题。
 */
const httpsAgent = new https.Agent({ family: 4 })
const httpAgent = new http.Agent({ family: 4 })
export type ContentType = 'json' | 'form-data' | 'urlencoded'

export interface RequestOptions {
  url: string
  method?: Method
  params?: Record<string, any>
  data?: Record<string, any>
  headers?: Record<string, string>
  timeout?: number
  contentType?: ContentType
}

export interface HttpResponse<T = any> {
  status: number
  data: T
  headers: Record<string, string>
}

/**
 * 根据 contentType 构建请求体和请求头
 */
function buildBody(
  data: Record<string, any>,
  contentType: ContentType,
): { body: any; headers: Record<string, string> } {
  const extraHeaders: Record<string, string> = {}

  if (contentType === 'json') {
    extraHeaders['Content-Type'] = 'application/json'
    return { body: data, headers: extraHeaders }
  }

  if (contentType === 'urlencoded') {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(data)) {
      params.append(k, v == null ? '' : String(v))
    }
    extraHeaders['Content-Type'] = 'application/x-www-form-urlencoded'
    return { body: params.toString(), headers: extraHeaders }
  }

  // form-data: Node.js 18+ 内置 FormData
  if (contentType === 'form-data') {
    const fd = new FormData()
    for (const [k, v] of Object.entries(data)) {
      fd.append(k, v == null ? '' : String(v))
    }
    return { body: fd, headers: extraHeaders }
  }

  return { body: data, headers: extraHeaders }
}

/**
 * 通用请求方法
 */
export async function request<T = any>(options: RequestOptions): Promise<HttpResponse<T>> {
  const {
    url,
    method = 'POST',
    params,
    data = {},
    headers = {},
    timeout = 30000,
    contentType = 'json',
  } = options

  const { body, headers: builtHeaders } = buildBody(data, contentType)
  const mergedHeaders = { ...builtHeaders, ...headers }

  const config: AxiosRequestConfig = {
    url,
    method,
    params,
    timeout,
    headers: mergedHeaders,
    httpsAgent,
    httpAgent,
    validateStatus: () => true, // 不自动抛 HTTP 错误，统一处理
  }

  if (method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD') {
    config.data = body
  }

  const logTag = `[${method.toUpperCase()} ${url}]`
  logger.log(`${logTag} contentType=${contentType}, timeout=${timeout}ms`)

  let response: AxiosResponse
  try {
    response = await axios.request(config)
  } catch (error: any) {
    // 有 response 说明是 HTTP 错误码（被 validateStatus 拦住了，但 axios.request 仍可能抛）
    if (error?.response) {
      response = error.response
    } else {
      // 网络层异常（超时、DNS、连接拒绝等）
      console.error(`${logTag} 请求异常:`, {
        name: error?.name,
        code: error?.code,
        message: error?.message,
      })
      throw new Error(`请求失败: ${error?.message || error?.code || error?.name || 'unknown'}`)
    }
  }

  const rawBody =
    typeof response.data === 'string'
      ? response.data
      : JSON.stringify(response.data ?? '')
  logger.log(`${logTag} status=${response.status}, body=${rawBody.substring(0, 500)}`)

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`HTTP ${response.status}: ${rawBody.substring(0, 500)}`)
  }

  // 解析响应体
  let parsedData: T
  try {
    parsedData =
      typeof response.data === 'string' ? JSON.parse(response.data) : response.data
  } catch {
    parsedData = response.data as T
  }

  return {
    status: response.status,
    data: parsedData,
    headers: response.headers as Record<string, string>,
  }
}

/**
 * HttpClient 工具对象 — 快捷调用
 */
export const HttpClient = {
  /** JSON POST */
  post<T = any>(
    url: string,
    data: Record<string, any>,
    options?: Partial<RequestOptions>,
  ): Promise<HttpResponse<T>> {
    return request<T>({ url, method: 'POST', data, contentType: 'json', ...options })
  },

  /** GET */
  get<T = any>(
    url: string,
    params?: Record<string, any>,
    options?: Partial<RequestOptions>,
  ): Promise<HttpResponse<T>> {
    return request<T>({ url, method: 'GET', params, ...options })
  },

  /** multipart/form-data POST（等效 curl -F） */
  formPost<T = any>(
    url: string,
    data: Record<string, any>,
    options?: Partial<RequestOptions>,
  ): Promise<HttpResponse<T>> {
    return request<T>({ url, method: 'POST', data, contentType: 'form-data', ...options })
  },

  /** application/x-www-form-urlencoded POST */
  urlencodedPost<T = any>(
    url: string,
    data: Record<string, any>,
    options?: Partial<RequestOptions>,
  ): Promise<HttpResponse<T>> {
    return request<T>({ url, method: 'POST', data, contentType: 'urlencoded', ...options })
  },
}
