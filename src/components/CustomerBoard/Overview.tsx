import { useMemo } from 'react'
import { Row, Col, Card, Statistic, Typography, Space, Empty } from 'antd'
import {
  TeamOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  FileSearchOutlined,
  AuditOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  CrownOutlined,
  DollarOutlined,
  RocketOutlined,
  CloseCircleOutlined,
  StopOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import type {
  CustomerRecord,
  CustomerScaleValue,
  PlatformValue,
  PriorityValue,
  ReadinessStatusValue,
} from './constants'
import {
  BLOCK_TYPE_OPTIONS,
  CUSTOMER_SCALE_OPTIONS,
  PLATFORM_OPTIONS,
  PRIORITY_OPTIONS,
  READINESS_STATUS_OPTIONS,
  STATUS_OPTIONS,
} from './constants'
import './Overview.css'

const { Text } = Typography

interface OverviewProps {
  records: CustomerRecord[]
  totalBeforeFilter: number
}

const CHART_COLORS = [
  '#5B8FF9', '#61DDAA', '#65789B', '#F6BD16', '#7262fd',
  '#78D3F8', '#9661BC', '#F6903D', '#008685', '#F08BB4',
]

export default function Overview({ records, totalBeforeFilter }: OverviewProps) {
  const stats = useMemo(() => {
    const sevenDaysAgo = dayjs().subtract(7, 'day')
    let opened = 0
    let following = 0
    let waitingMat = 0
    let waitingReview = 0
    let stuck = 0
    let stale = 0
    let highPri = 0
    let big = 0
    let budgetSum = 0
    let readyForTest = 0
    let creativeRejected = 0
    let accountFailed = 0

    for (const r of records) {
      if (r.current_status === '已开通') opened++
      if (r.current_status === '跟进中') following++
      if (r.current_status === '待客户补充材料') waitingMat++
      if (r.current_status === '待内部审核') waitingReview++
      if (r.current_status === '审核卡住') stuck++
      const t = r.last_follow_up_at || r.updated_at || r.created_at
      if (
        r.current_status !== '已开通' &&
        r.current_status !== '无效线索' &&
        t &&
        dayjs(t).isBefore(sevenDaysAgo)
      )
        stale++
      if (r.priority === 'P0' || r.priority === 'P1') highPri++
      if (r.customer_scale === '大客户') big++
      budgetSum += Number(r.monthly_budget || 0)
      if (r.readiness_status === '可进入测试投放') readyForTest++
      if (r.creative_status === '审核拒绝') creativeRejected++
      if (r.account_status === '开户失败') accountFailed++
    }

    return {
      total: records.length,
      opened,
      following,
      waitingMat,
      waitingReview,
      stuck,
      stale,
      highPri,
      big,
      budgetSum,
      readyForTest,
      creativeRejected,
      accountFailed,
    }
  }, [records])

  const statusPieOption = useMemo(() => {
    const map = new Map<string, number>()
    STATUS_OPTIONS.forEach((s) => map.set(s, 0))
    for (const r of records) {
      map.set(r.current_status, (map.get(r.current_status) || 0) + 1)
    }
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, type: 'scroll' },
      color: CHART_COLORS,
      series: [
        {
          type: 'pie',
          radius: ['40%', '65%'],
          center: ['50%', '42%'],
          data: Array.from(map.entries()).map(([name, value]) => ({ name, value })),
          label: { formatter: '{b}: {c}' },
        },
      ],
    }
  }, [records])

  const scalePieOption = useMemo(() => {
    const map = new Map<CustomerScaleValue, number>()
    CUSTOMER_SCALE_OPTIONS.forEach((s) => map.set(s, 0))
    for (const r of records) {
      if (r.customer_scale) map.set(r.customer_scale, (map.get(r.customer_scale) || 0) + 1)
    }
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      color: CHART_COLORS,
      series: [
        {
          type: 'pie',
          radius: '65%',
          center: ['50%', '45%'],
          data: Array.from(map.entries()).map(([name, value]) => ({ name, value })),
        },
      ],
    }
  }, [records])

  const industryBarOption = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of records) {
      if (r.industry_l1) map.set(r.industry_l1, (map.get(r.industry_l1) || 0) + 1)
    }
    const arr = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
    return {
      grid: { left: 90, right: 20, top: 20, bottom: 30 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: arr.map((x) => x[0]).reverse() },
      series: [
        {
          type: 'bar',
          data: arr.map((x) => x[1]).reverse(),
          itemStyle: { color: CHART_COLORS[0] },
          label: { show: true, position: 'right' },
        },
      ],
    }
  }, [records])

  const countryBarOption = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of records) {
      if (r.country_region) map.set(r.country_region, (map.get(r.country_region) || 0) + 1)
    }
    const arr = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
    return {
      grid: { left: 90, right: 20, top: 20, bottom: 30 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: arr.map((x) => x[0]).reverse() },
      series: [
        {
          type: 'bar',
          data: arr.map((x) => x[1]).reverse(),
          itemStyle: { color: CHART_COLORS[1] },
          label: { show: true, position: 'right' },
        },
      ],
    }
  }, [records])

  const managerBarOption = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of records) {
      if (r.channel_manager) map.set(r.channel_manager, (map.get(r.channel_manager) || 0) + 1)
    }
    const arr = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
    return {
      grid: { left: 100, right: 20, top: 20, bottom: 30 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: arr.map((x) => x[0]).reverse() },
      series: [
        {
          type: 'bar',
          data: arr.map((x) => x[1]).reverse(),
          itemStyle: { color: CHART_COLORS[2] },
          label: { show: true, position: 'right' },
        },
      ],
    }
  }, [records])

  const blockPieOption = useMemo(() => {
    const map = new Map<string, number>()
    BLOCK_TYPE_OPTIONS.forEach((s) => map.set(s, 0))
    for (const r of records) {
      if (r.block_type) map.set(r.block_type, (map.get(r.block_type) || 0) + 1)
    }
    const data = Array.from(map.entries()).map(([name, value]) => ({ name, value }))
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, type: 'scroll' },
      color: CHART_COLORS,
      series: [
        {
          type: 'pie',
          radius: ['35%', '60%'],
          center: ['50%', '42%'],
          data,
        },
      ],
    }
  }, [records])

  const priorityPieOption = useMemo(() => {
    const map = new Map<PriorityValue, number>()
    PRIORITY_OPTIONS.forEach((p) => map.set(p, 0))
    for (const r of records) {
      if (r.priority) map.set(r.priority, (map.get(r.priority) || 0) + 1)
    }
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      color: ['#F5222D', '#FA541C', '#1677FF', '#8C8C8C'],
      series: [
        {
          type: 'pie',
          radius: '65%',
          center: ['50%', '45%'],
          data: Array.from(map.entries()).map(([name, value]) => ({ name, value })),
        },
      ],
    }
  }, [records])

  const leadsTrendOption = useMemo(() => {
    const days: string[] = []
    const counts: number[] = []
    for (let i = 29; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day').format('MM-DD')
      days.push(d)
      counts.push(0)
    }
    for (const r of records) {
      if (!r.lead_created_at) continue
      const t = dayjs(r.lead_created_at)
      const key = t.format('MM-DD')
      const idx = days.indexOf(key)
      if (idx >= 0) counts[idx]++
    }
    return {
      grid: { left: 40, right: 30, top: 30, bottom: 50 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: days, axisLabel: { rotate: 45 } },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'line',
          data: counts,
          smooth: true,
          areaStyle: { opacity: 0.2 },
          itemStyle: { color: CHART_COLORS[5] },
        },
      ],
    }
  }, [records])

  const readinessPieOption = useMemo(() => {
    const map = new Map<ReadinessStatusValue, number>()
    READINESS_STATUS_OPTIONS.forEach((s) => map.set(s, 0))
    for (const r of records) {
      if (r.readiness_status) map.set(r.readiness_status, (map.get(r.readiness_status) || 0) + 1)
    }
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, type: 'scroll' },
      color: ['#52c41a', '#1677ff', '#faad14', '#8c8c8c'],
      series: [
        {
          type: 'pie',
          radius: ['40%', '65%'],
          center: ['50%', '42%'],
          data: Array.from(map.entries()).map(([name, value]) => ({ name, value })),
        },
      ],
    }
  }, [records])

  const platformBarOption = useMemo(() => {
    const map = new Map<PlatformValue, number>()
    PLATFORM_OPTIONS.forEach((p) => map.set(p, 0))
    for (const r of records) {
      if (r.platform) map.set(r.platform, (map.get(r.platform) || 0) + 1)
    }
    const arr = Array.from(map.entries())
    return {
      grid: { left: 60, right: 20, top: 20, bottom: 30 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: arr.map((x) => x[0]) },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'bar',
          data: arr.map((x) => x[1]),
          itemStyle: { color: CHART_COLORS[3] },
          label: { show: true, position: 'top' },
        },
      ],
    }
  }, [records])

  const showFilterHint = records.length !== totalBeforeFilter

  return (
    <div className="dashboard-overview">
      {showFilterHint && (
        <Text type="secondary" style={{ marginBottom: 12, display: 'block' }}>
          🔍 当前概览基于筛选后 {records.length} / {totalBeforeFilter} 条数据
        </Text>
      )}

      {/* 统计卡片 */}
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic
              title="客户总数"
              value={stats.total}
              prefix={<TeamOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic
              title="已开通"
              value={stats.opened}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic
              title="跟进中"
              value={stats.following}
              valueStyle={{ color: '#1677ff' }}
              prefix={<SyncOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic
              title="待补充材料"
              value={stats.waitingMat}
              valueStyle={{ color: '#faad14' }}
              prefix={<FileSearchOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic
              title="待内部审核"
              value={stats.waitingReview}
              valueStyle={{ color: '#722ed1' }}
              prefix={<AuditOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic
              title="审核卡住"
              value={stats.stuck}
              valueStyle={{ color: '#f5222d' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic
              title="超 7 天未更新"
              value={stats.stale}
              valueStyle={{ color: '#f5222d' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic
              title="P0/P1 高优"
              value={stats.highPri}
              valueStyle={{ color: '#fa541c' }}
              prefix={<FireOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic
              title="大客户数量"
              value={stats.big}
              valueStyle={{ color: '#eb2f96' }}
              prefix={<CrownOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic
              title="月预算总额"
              value={Math.round(stats.budgetSum / 10000)}
              suffix="万"
              valueStyle={{ color: '#1677ff' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic
              title="可进入测试投放"
              value={stats.readyForTest}
              valueStyle={{ color: '#52c41a' }}
              prefix={<RocketOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic
              title="素材审核拒绝"
              value={stats.creativeRejected}
              valueStyle={{ color: '#f5222d' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic
              title="开户失败"
              value={stats.accountFailed}
              valueStyle={{ color: '#f5222d' }}
              prefix={<StopOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区 */}
      {records.length === 0 ? (
        <Card style={{ marginTop: 16 }}>
          <Empty description="暂无数据可展示" />
        </Card>
      ) : (
        <>
          <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
            <Col xs={24} md={12} lg={8}>
              <Card size="small" title="当前状态分布">
                <ReactECharts option={statusPieOption} style={{ height: 320 }} />
              </Card>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Card size="small" title="客户体量分布">
                <ReactECharts option={scalePieOption} style={{ height: 320 }} />
              </Card>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Card size="small" title="客户优先级分布">
                <ReactECharts option={priorityPieOption} style={{ height: 320 }} />
              </Card>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Card size="small" title="投放准备状态分布">
                <ReactECharts option={readinessPieOption} style={{ height: 320 }} />
              </Card>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Card size="small" title="卡点类型分布">
                <ReactECharts option={blockPieOption} style={{ height: 320 }} />
              </Card>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Card size="small" title="投放平台分布">
                <ReactECharts option={platformBarOption} style={{ height: 320 }} />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small" title="一级行业分布">
                <ReactECharts option={industryBarOption} style={{ height: 380 }} />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small" title="国家/地区 Top12">
                <ReactECharts option={countryBarOption} style={{ height: 380 }} />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small" title="渠道经理负责客户数 Top12">
                <ReactECharts option={managerBarOption} style={{ height: 380 }} />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small" title="近 30 天线索新增趋势">
                <ReactECharts option={leadsTrendOption} style={{ height: 380 }} />
              </Card>
            </Col>
          </Row>
        </>
      )}

      <Space direction="vertical" style={{ marginTop: 16, opacity: 0.55 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          📌 所有数据为模拟数据，不含任何真实客户或平台内部信息，仅用于业务场景演示。
        </Text>
      </Space>
    </div>
  )
}
