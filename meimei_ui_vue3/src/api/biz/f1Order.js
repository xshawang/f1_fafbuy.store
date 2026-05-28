import request from '@/utils/request'

// 查询 F1 订单列表
export function listF1Order(query) {
  return request({
    url: '/cart/list',
    method: 'get',
    params: query,
  })
}

// 获取 F1 订单详情
export function getF1OrderDetail(orderNo) {
  return request({
    url: `/cart/detail/${orderNo}`,
    method: 'get',
  })
}
