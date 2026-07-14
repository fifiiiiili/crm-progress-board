import { useMemo } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Space, Typography, Empty } from 'antd'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import type { CustomerRecord } from './constants'
import {
  STATUS_COLOR_MAP,
  BLOCK_COLOR_MAP,
  SCALE_COLOR_MAP,
  PRIORITY_COLOR_MAP,
  STATUS_OPTIONS,
  CUSTOMER_SCALE_OPTIONS,
  PRIORITY_OPTIONS,
  BLOCK_TYPE_OPTIONS,
} from './constants'
import './Overview.css'

const { Title, Text } = Typography

interface Props {
  records: CustomerRecord[]
  totalBeforeFilter: number
}

function countBy<T>(items: T[], keyGetter: (t: T) => string | null | undefined): Map<string, number> {
  const map = new Map<string, number>()
  for (const item of items) {
    const key = keyGetter(item)
    if (!key) continue
    map.set(key, (map.get(key) || 0) + 1)
  }
  return map
}

function formatMoney(n: number): string {
  if (n >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(2)} 亿`
  if (n >= 1_0000) return `${(n / 1_0000).toFixed(1)} 万`
  return String(n)
}

// —— 图表通用配置 ——
const CHART_HEIGHT = 280
const CHART_COLORS = [
  '#0D9488',
  '#1677ff',
  '#faad14',
  '#f5222d',
  '#722ed1',
  '#13c2c2',
  '#eb2f96',
  '#52c41a',
  '#fa8c16',
  '#5b6ab7',
  '#a0d911',
  '#f759ab',
]

export default function Overview({ records }: Props) {
  // —— 卡片指标 ——
  const stats = useMemo(() => {
    const now = dayjs()
    const sevenDaysAgo = now.subtract(7, 'day')
    const cnt = (fn: (r: CustomerRecord) => boolean) => records.filter(fn).length
    const stale = records.filter((r) => {
      if (r.current_status === '已开通' || r.current_status === '无效线索') return false
      const t = r.last_follow_up_at || r.updated_at || r.created_at
      if (!t) return true
      return dayjs(t).isBefore(sevenDaysAgo)
    }).length
    const totalBudget = records.reduce((sum, r) => sum + (r.monthly_budget || 0), 0)

    return {
      total: records.length,
      opened: cnt((r) => r.current_status === '已开通'),
      following: cnt((r) => r.current_status === '跟进中'),
      waitingSupp: cnt((r) => r.current_status === '待客户补充材料'),
      waitingReview: cnt((r) => r.current_status === '待内部审核'),
      reviewBlocked: cnt((r) => r.current_status === '审核卡住'),
      stale,
      highPriority: cnt((r) => r.priority === 'P0' || r.priority === 'P1'),
      bigClient: cnt((r) => r.customer_scale === '大客户'),
      totalBudget,
    }
  }, [records])

  const cards: Array<{
    key: string
    title: string
    value: number | string
    color: string
    suffix?: string
  }> = [
    { key: 'total', title: '客户总数', value: stats.total, color: '#0D9488' },
    { key: 'opened', title: '已开通客户', value: stats.opened, color: '#52c41a' },
    { key: 'following', title: '跟进中', value: stats.following, color: '#1677ff' },
    { key: 'waitingSupp', title: '待客户补充材料', value: stats.waitingSupp, color: '#d4a017' },
    { key: 'waitingReview', title: '待内部审核', value: stats.waitingReview, color: '#5b6ab7' },
    { key: 'reviewBlocked', title: '审核卡住', value: stats.reviewBlocked, color: '#d4380d' },
    { key: 'stale', title: '超 7 天未更新', value: stats.stale, color: '#fa541c' },
    {
      key: 'highPriority',
      title: 'P0 / P1 高优客户',
      value: stats.highPriority,
      color: '#f5222d',
    },
    { key: 'bigClient', title: '大客户数量', value: stats.bigClient, color: '#722ed1' },
    {
      key: 'budget',
      title: '预估月预算总额',
      value: formatMoney(stats.totalBudget),
      color: '#0D9488',
      suffix: '元',
    },
  ]

  // —— 图表数据 ——
  // 当前状态分布（按 STATUS_OPTIONS 顺序）
  const statusChart = useMemo(() => {
    const map = countBy(records, (r) => r.current_status)
    const data = STATUS_OPTIONS.map((s) => ({
      name: s.value,
      value: map.get(s.value) || 0,
    })).filter((d) => d.value > 0)
    return {
      tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, type: 'scroll' as const },
      color: CHART_COLORS,
      series: [
        {
          name: '当前状态',
          type: 'pie' as const,
          radius: ['40%', '65%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: '#fff', borderWidth: 2 },
          label: { formatter: '{b}\n{d}%', fontSize: 11 },
          data,
        },
      ],
    }
  }, [records])

  // 客户体量分布
  const scaleChart = useMemo(() => {
    const map = countBy(records, (r) => r.customer_scale)
    const data = CUSTOMER_SCALE_OPTIONS.map((s) => ({
      name: s.value,
      value: map.get(s.value) || 0,
    })).filter((d) => d.value > 0)
    return {
      tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      color: ['#f5222d', '#fa8c16', '#1677ff', '#8c8c8c'],
      series: [
        {
          type: 'pie' as const,
          radius: '65%',
          center: ['50%', '45%'],
          label: { formatter: '{b}: {c}', fontSize: 11 },
          data,
        },
      ],
    }
  }, [records])

  // 行业分布（Top）
  const industryChart = useMemo(() => {
    const map = countBy(records, (r) => r.industry_l1)
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1])
    return {
      grid: { left: 100, right: 30, top: 20, bottom: 30 },
      tooltip: { trigger: 'axis' as const },
      xAxis: { type: 'value' as const },
      yAxis: {
        type: 'category' as const,
        data: sorted.map((x) => x[0]).reverse(),
        axisLabel: { fontSize: 11 },
      },
      color: ['#0D9488'],
      series: [
        {
          name: '客户数',
          type: 'bar' as const,
          data: sorted.map((x) => x[1]).reverse(),
          label: { show: true, position: 'right' as const, fontSize: 11 },
          itemStyle: { borderRadius: [0, 4, 4, 0] },
        },
      ],
    }
  }, [records])

  // 国家/地区分布（Top 15）
  const countryChart = useMemo(() => {
    const map = countBy(records, (r) => r.country_region)
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
    return {
      grid: { left: 80, right: 30, top: 20, bottom: 30 },
      tooltip: { trigger: 'axis' as const },
      xAxis: { type: 'value' as const },
      yAxis: {
        type: 'category' as const,
        data: sorted.map((x) => x[0]).reverse(),
        axisLabel: { fontSize: 11 },
      },
      color: ['#1677ff'],
      series: [
        {
          name: '客户数',
          type: 'bar' as const,
          data: sorted.map((x) => x[1]).reverse(),
          label: { show: true, position: 'right' as const, fontSize: 11 },
          itemStyle: { borderRadius: [0, 4, 4, 0] },
        },
      ],
    }
  }, [records])

  // 渠道经理负责客户数排行
  const managerChart = useMemo(() => {
    const map = countBy(records, (r) => r.channel_manager)
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1])
    return {
      grid: { left: 80, right: 30, top: 20, bottom: 30 },
      tooltip: { trigger: 'axis' as const },
      xAxis: { type: 'value' as const },
      yAxis: {
        type: 'category' as const,
        data: sorted.map((x) => x[0]).reverse(),
        axisLabel: { fontSize: 11 },
      },
      color: ['#722ed1'],
      series: [
        {
          name: '负责客户数',
          type: 'bar' as const,
          data: sorted.map((x) => x[1]).reverse(),
          label: { show: true, position: 'right' as const, fontSize: 11 },
          itemStyle: { borderRadius: [0, 4, 4, 0] },
        },
      ],
    }
  }, [records])

  // 卡点类型分布
  const blockChart = useMemo(() => {
    const map = countBy(records, (r) => r.block_type)
    const data = BLOCK_TYPE_OPTIONS.map((s) => ({
      name: s.value,
      value: map.get(s.value) || 0,
    })).filter((d) => d.value > 0)
    return {
      tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, type: 'scroll' as const },
      color: CHART_COLORS,
      series: [
        {
          type: 'pie' as const,
          radius: ['35%', '60%'],
          center: ['50%', '43%'],
          label: { formatter: '{b}\n{d}%', fontSize: 10 },
          data,
        },
      ],
    }
  }, [records])

  // 优先级分布
  const priorityChart = useMemo(() => {
    const map = countBy(records, (r) => r.priority)
    const data = PRIORITY_OPTIONS.map((s) => ({
      name: s.value,
      value: map.get(s.value) || 0,
    })).filter((d) => d.value > 0)
    return {
      tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      color: ['#f5222d', '#fa541c', '#faad14', '#8c8c8c'],
      series: [
        {
          type: 'pie' as const,
          radius: '65%',
          center: ['50%', '45%'],
          label: { formatter: '{b}: {c}', fontSize: 11 },
          data,
        },
      ],
    }
  }, [records])

  // 近 30 天线索新增趋势
  const trendChart = useMemo(() => {
    const now = dayjs().endOf('day')
    const buckets: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = now.subtract(i, 'day').format('MM-DD')
      buckets[d] = 0
    }
    for (const r of records) {
      const t = r.lead_created_at || r.created_at
      if (!t) continue
      const key = dayjs(t).format('MM-DD')
      if (key in buckets) buckets[key]++
    }
    const dates = Object.keys(buckets)
    return {
      grid: { left: 40, right: 20, top: 20, bottom: 40 },
      tooltip: { trigger: 'axis' as const },
      xAxis: {
        type: 'category' as const,
        data: dates,
        axisLabel: { fontSize: 10, rotate: 0 },
      },
      yAxis: { type: 'value' as const, minInterval: 1 },
      color: ['#0D9488'],
      series: [
        {
          name: '新增线索',
          type: 'line' as const,
          data: dates.map((d) => buckets[d]),
          smooth: true,
          areaStyle: { opacity: 0.15 },
          symbol: 'circle' as const,
          symbolSize: 5,
        },
      ],
    }
  }, [records])

  // —— 重点列表 ——
  const highPriorityList = useMemo(() => {
    return records
      .filter(
        (r) =>
          (r.priority === 'P0' || r.priority === 'P1') &&
          r.current_status !== '已开通' &&
          r.current_status !== '无效线索',
      )
      .sort((a, b) => {
        const pa = a.priority === 'P0' ? 0 : 1
        const pb = b.priority === 'P0' ? 0 : 1
        if (pa !== pb) return pa - pb
        const ta = a.last_follow_up_at ? dayjs(a.last_follow_up_at).valueOf() : 0
        const tb = b.last_follow_up_at ? dayjs(b.last_follow_up_at).valueOf() : 0
        return ta - tb
      })
      .slice(0, 50)
  }, [records])

  const staleList = useMemo(() => {
    const sevenDaysAgo = dayjs().subtract(7, 'day')
    return records
      .filter((r) => {
        if (r.current_status === '已开通' || r.current_status === '无效线索') return false
        const t = r.last_follow_up_at || r.updated_at || r.created_at
        if (!t) return true
        return dayjs(t).isBefore(sevenDaysAgo)
      })
      .sort((a, b) => {
        const ta = a.last_follow_up_at ? dayjs(a.last_follow_up_at).valueOf() : 0
        const tb = b.last_follow_up_at ? dayjs(b.last_follow_up_at).valueOf() : 0
        return ta - tb
      })
      .slice(0, 50)
  }, [records])

  const blockedList = useMemo(() => {
    return records
      .filter(
        (r) =>
          r.current_status === '审核卡住' ||
          r.block_type === '资质卡审' ||
          r.block_type === '内部审核待处理',
      )
      .sort((a, b) => {
        const pa =
          a.priority === 'P0'
            ? 0
            : a.priority === 'P1'
            ? 1
            : a.priority === 'P2'
            ? 2
            : 3
        const pb =
          b.priority === 'P0'
            ? 0
            : b.priority === 'P1'
            ? 1
            : b.priority === 'P2'
            ? 2
            : 3
        return pa - pb
      })
      .slice(0, 50)
  }, [records])

  const listColumns = [
    {
      title: '账号ID',
      dataIndex: 'pro_account_id',
      width: 130,
      render: (v: string) => <span className="mono">{v}</span>,
    },
    { title: '账号名称', dataIndex: 'pro_account_name', width: 160, ellipsis: true },
    {
      title: '客户体量',
      dataIndex: 'customer_scale',
      width: 90,
      render: (v?: string | null) =>
        v ? <Tag color={SCALE_COLOR_MAP[v] || 'default'}>{v}</Tag> : '—',
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 80,
      render: (v?: string | null) =>
        v ? <Tag color={PRIORITY_COLOR_MAP[v] || 'default'}>{v}</Tag> : '—',
    },
    { title: '渠道经理', dataIndex: 'channel_manager', width: 100, ellipsis: true },
    {
      title: '当前状态',
      dataIndex: 'current_status',
      width: 130,
      render: (v: string) =>
        v ? <Tag color={STATUS_COLOR_MAP[v] || 'default'}>{v}</Tag> : '—',
    },
    {
      title: '卡点类型',
      dataIndex: 'block_type',
      width: 130,
      render: (v?: string | null) =>
        v ? <Tag color={BLOCK_COLOR_MAP[v] || 'default'}>{v}</Tag> : '—',
    },
    {
      title: '最近跟进',
      dataIndex: 'last_follow_up_at',
      width: 110,
      render: (v?: string | null) => (v ? dayjs(v).format('MM-DD HH:mm') : '—'),
    },
    {
      title: '下一步动作',
      dataIndex: 'next_action',
      ellipsis: true,
    },
  ]

  return (
    <div className="overview-page">
      {/* 统计卡片 */}
      <Row gutter={[12, 12]} className="overview-cards">
        {cards.map((c) => (
          <Col key={c.key} xs={12} sm={8} md={6} lg={24 / 10} xl={24 / 10}>
            <Card size="small" className="overview-card" styles={{ body: { padding: '12px 14px' } }}>
              <Statistic
                title={<span className="card-title">{c.title}</span>}
                value={c.value}
                suffix={c.suffix}
                valueStyle={{
                  color: c.color,
                  fontSize: 20,
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 图表区 */}
      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        <Col xs={24} lg={12}>
          <Card size="small" title="当前状态分布">
            <ReactECharts option={statusChart} style={{ height: CHART_HEIGHT }} notMerge />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="客户体量分布">
            <ReactECharts option={scaleChart} style={{ height: CHART_HEIGHT }} notMerge />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="一级行业分布">
            <ReactECharts option={industryChart} style={{ height: CHART_HEIGHT + 40 }} notMerge />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="国家/地区分布（Top 15）">
            <ReactECharts option={countryChart} style={{ height: CHART_HEIGHT + 40 }} notMerge />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="渠道经理负责客户数排行">
            <ReactECharts option={managerChart} style={{ height: CHART_HEIGHT + 40 }} notMerge />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="卡点类型分布">
            <ReactECharts option={blockChart} style={{ height: CHART_HEIGHT + 40 }} notMerge />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="客户优先级分布">
            <ReactECharts option={priorityChart} style={{ height: CHART_HEIGHT }} notMerge />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="近 30 天线索新增趋势">
            <ReactECharts option={trendChart} style={{ height: CHART_HEIGHT }} notMerge />
          </Card>
        </Col>
      </Row>

      {/* 重点客户列表 */}
      <div className="overview-lists">
        <Title level={5} style={{ marginTop: 20, marginBottom: 8 }}>
          🎯 重点客户列表
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          以下列表根据当前筛选条件动态计算，每类最多展示 50 条
        </Text>

        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Card
            size="small"
            title={
              <span>
                <Tag color="red">P0/P1</Tag> 高优先级待跟进客户（{highPriorityList.length}）
              </span>
            }
          >
            <Table
              size="small"
              rowKey={(r) => String(r.id ?? r.pro_account_id)}
              dataSource={highPriorityList}
              columns={listColumns}
              scroll={{ x: 1100, y: 260 }}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              locale={{ emptyText: <Empty description="没有符合条件的高优先级客户" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            />
          </Card>

          <Card
            size="small"
            title={
              <span>
                <Tag color="volcano">⏱</Tag> 超过 7 天未更新客户（{staleList.length}）
              </span>
            }
          >
            <Table
              size="small"
              rowKey={(r) => String(r.id ?? r.pro_account_id)}
              dataSource={staleList}
              columns={listColumns}
              scroll={{ x: 1100, y: 260 }}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              locale={{ emptyText: <Empty description="所有客户跟进都比较及时" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            />
          </Card>

          <Card
            size="small"
            title={
              <span>
                <Tag color="orange">🚧</Tag> 审核卡住 / 资质卡审 / 内部审核待处理客户（{blockedList.length}）
              </span>
            }
          >
            <Table
              size="small"
              rowKey={(r) => String(r.id ?? r.pro_account_id)}
              dataSource={blockedList}
              columns={listColumns}
              scroll={{ x: 1100, y: 260 }}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              locale={{ emptyText: <Empty description="没有审核卡住的客户" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            />
          </Card>
        </Space>
      </div>
    </div>
  )
}
