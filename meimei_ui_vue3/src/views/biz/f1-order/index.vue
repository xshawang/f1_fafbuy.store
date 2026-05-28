<template>
  <div class="app-container">
    <!-- 搜索表单 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="订单编号" prop="orderNo">
        <el-input
          v-model="queryParams.orderNo"
          placeholder="请输入订单编号"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="dateRange">
        <el-date-picker
          v-model="dateRange"
          value-format="YYYY-MM-DD"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 280px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Refresh" @click="handleQuery">刷新</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="dataList" border>
      <el-table-column label="订单编号" align="center" prop="orderNo" width="280" :show-overflow-tooltip="true" />
      <el-table-column label="订单名称" align="center" prop="f1Name" width="200" :show-overflow-tooltip="true" />
      <el-table-column label="订单标题" align="center" prop="f1Title" width="200" :show-overflow-tooltip="true" />
      <el-table-column label="订单金额" align="center" prop="f1Money" width="150">
        <template #default="scope">
          <span class="money-text">${{ scope.row.f1Money?.toFixed(2) || '0.00' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="订单状态" align="center" prop="orderStatus" width="120">
        <template #default="scope">
          <el-tag v-if="scope.row.orderStatus === 0" type="info">待处理</el-tag>
          <el-tag v-else-if="scope.row.orderStatus === 1" type="warning">处理中</el-tag>
          <el-tag v-else-if="scope.row.orderStatus === 2" type="success">已完成</el-tag>
          <el-tag v-else-if="scope.row.orderStatus === 3" type="danger">已取消</el-tag>
          <el-tag v-else type="info">未知</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="120" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="handleViewDetail(scope.row.orderNo)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script setup name="F1OrderList">
import { listF1Order } from '@/api/biz/f1Order'
import { parseTime } from '@/utils/mei-mei'
import { ElMessage } from 'element-plus'

const { proxy } = getCurrentInstance()

const dataList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const dateRange = ref([])
const queryRef = ref()

const data = reactive({
  queryParams: {
    orderNo: undefined,
    startDate: undefined,
    endDate: undefined,
    pageNum: 1,
    pageSize: 10
  }
})

const { queryParams } = toRefs(data)

/** 查询订单列表 */
function getList() {
  loading.value = true
  
  // 处理日期范围
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.value.startDate = dateRange.value[0]
    queryParams.value.endDate = dateRange.value[1]
  } else {
    queryParams.value.startDate = undefined
    queryParams.value.endDate = undefined
  }
  
  listF1Order(queryParams.value).then(response => {
    dataList.value = response.data.list
    total.value = response.data.total
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = []
  queryRef.value?.resetFields()
  handleQuery()
}

/** 查看详情 */
function handleViewDetail(orderNo) {
  ElMessage.info(`查看订单详情: ${orderNo}`)
  // 可以跳转到订单详情页
  // router.push({ path: '/biz/f1-order/detail', query: { orderNo } })
}

// 初始化
getList()
</script>

<style scoped>
.money-text {
  color: #f56c6c;
  font-weight: bold;
  font-size: 14px;
}

.app-container {
  padding: 20px;
}
</style>
