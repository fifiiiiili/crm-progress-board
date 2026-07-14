import { useMemo } from 'react'
import { Card, Table, Tag, Space, Typography, Row, Col, Statistic, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  AlertOutlined,
  FireOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import {
  RISK_LEVEL_COLOR_MAP,
  STATUS_COLOR_MAP,
  BLOCK_TYPE_COLOR_MAP,
  ACCOUNT_STATUS_COLOR_MAP,
  CREATIVE_STATUS_COLOR_MAP,
  PRIORITY_COLOR_MAP,
  type CustomerRecord,
} from './constants'
import { detectRisks, highestRiskLevel, type RiskLevel } from '../../utils/risk'

const { Text, Paragraph } = Typography

interface AlertItem {
  record: CustomerRecord
  alert: {
    type: string
    level: RiskLevel
    reason: string
    suggestion: string
  }
}

interface RiskAlertsProps {
  records: CustomerRecord[]
  onViewDetail?: (r: CustomerRecord) => void
}

export default function RiskAlerts({ records, onViewDetail }: RiskAlertsProps) {
  const alerts: AlertItem[] = useMemo(() => {
    const list: AlertItem[] = []
    for (const r of records) {
      const rs = detectRisks(r)
      for (const a of rs) list.push({ record: r, alert: a })
    }
    return list
  }, [records])

  const summary = useMemo(() => {
    const highSet = new Set<number>()
    const midSet = new Set<number>()
    const lowSet = new Set<number>()
    for (const it of alerts) {
      const id = it.record.id!
      if (it.alert.level === '高风险') highSet.add(id)
      else if (it.alert.level === '中风险') midSet.add(id)
      else lowSet.add(id)
    }
    // 去重：一个客户可能有多个风险
    return {
      total: alerts.length,
      high: highSet.size,
      mid: midSet.size,
      low: lowSet.size,
    }
  }, [alerts])

  const columns: ColumnsType<AlertItem> = [
    {
      title: '预警等级',
      key: 'level',
      width: 90,
      fixed: 'left',
      filters: [
        { text: '高风险', value: '高风险' },
        { text: '中风险', value: '中风险' },
        { text: '低风险', value: '低风险' },
      ],
      onFilter: (v, r) => r.alert.level === v,
      render: (_: unknown, r) => (
        <Tag color={RISK_LEVEL_COLOR_MAP[r.alert.level]}>{r.alert.level}</Tag>
      ),
    },
    {
      title: '预警类型',
      key: 'type',
      width: 150,
      filters: Array.from(new Set(alerts.map((a) => a.alert.type))).map((t) => ({
        text: t,
        value: t,
      })),
      onFilter: (v, r) => r.alert.type === v,
      render: (_: unknown, r) => r.alert.type,
    },
    {
      title: '账号ID',
      key: 'proId',
      width: 120,
      render: (_: unknown, r) =>
        onViewDetail ? (
          <a onClick={() => onViewDetail(r.record)} className="mono-font">
            {r.record.pro_account_id}
          </a>
        ) : (
          <Text className="mono-font">{r.record.pro_account_id}</Text>
        ),
    },
    {
      title: '账号名称',
      key: 'name',
      width: 180,
      ellipsis: true,
      render: (_: unknown, r) => r.record.pro_account_name,
    },
    {
      title: '优先级',
      key: 'pri',
      width: 70,
      render: (_: unknown, r) =>
        r.record.priority ? (
          <Tag color={PRIORITY_COLOR_MAP[r.record.priority as never]}>{r.record.priority}</Tag>
        ) : (
          '—'
        ),
    },
    {
      title: '月预算',
      key: 'budget',
      width: 100,
      align: 'right',
      render: (_: unknown, r) =>
        r.record.monthly_budget ? `¥${(r.record.monthly_budget / 10000).toFixed(1)}万` : '—',
    },
    {
      title: '渠道经理',
      key: 'mgr',
      width: 100,
      render: (_: unknown, r) => r.record.channel_manager,
    },
    {
      title: '当前状态',
      key: 'st',
      width: 130,
      render: (_: unknown, r) => (
        <Tag color={STATUS_COLOR_MAP[r.record.current_status]}>{r.record.current_status}</Tag>
      ),
    },
    {
      title: '卡点',
      key: 'blk',
      width: 130,
      render: (_: unknown, r) =>
        r.record.block_type ? (
          <Tag color={BLOCK_TYPE_COLOR_MAP[r.record.block_type as never]}>{r.record.block_type}</Tag>
        ) : (
          '—'
        ),
    },
    {
      title: '账户',
      key: 'acc',
      width: 100,
      render: (_: unknown, r) =>
        r.record.account_status ? (
          <Tag color={ACCOUNT_STATUS_COLOR_MAP[r.record.account_status as never]}>
            {r.record.account_status}
          </Tag>
        ) : (
          '—'
        ),
    },
    {
      title: '素材',
      key: 'cre',
      width: 100,
      render: (_: unknown, r) =>
        r.record.creative_status ? (
          <Tag color={CREATIVE_STATUS_COLOR_MAP[r.record.creative_status as never]}>
            {r.record.creative_status}
          </Tag>
        ) : (
          '—'
        ),
    },
    {
      title: '准备度',
      key: 'score',
      width: 80,
      align: 'center',
      render: (_: unknown, r) => r.record.readiness_score ?? 0,
    },
    {
      title: '风险原因',
      key: 'reason',
      width: 260,
      render: (_: unknown, r) => (
        <Paragraph
          type="secondary"
          style={{ margin: 0, fontSize: 12 }}
          ellipsis={{ rows: 2, tooltip: r.alert.reason }}
        >
          {r.alert.reason}
        </Paragraph>
      ),
    },
    {
      title: '建议动作',
      key: 'suggest',
      width: 220,
      render: (_: unknown, r) => (
        <Paragraph
          style={{ margin: 0, fontSize: 12 }}
          ellipsis={{ rows: 2, tooltip: r.alert.suggestion }}
        >
          {r.alert.suggestion}
        </Paragraph>
      ),
    },
    {
      title: '操作',
      key: 'act',
      width: 80,
      fixed: 'right',
      render: (_: unknown, r) =>
        onViewDetail ? (
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onViewDetail(r.record)}
          >
            详情
          </Button>
        ) : (
          '—'
        ),
    },
  ]

  return (
    <div className="risk-alerts">
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="预警总数"
              value={summary.total}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="高风险客户"
              value={summary.high}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="中风险客户"
              value={summary.mid}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="低风险客户"
              value={summary.low}
              prefix={<InfoCircleOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card size="small" title={<Space><AlertOutlined /> 异常预警明细</Space>}>
        <Table<AlertItem>
          rowKey={(r) => `${r.record.id}-${r.alert.type}`}
          columns={columns}
          dataSource={alerts}
          size="small"
          scroll={{ x: 1900 }}
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: [20, 50, 100, 200],
            showTotal: (t) => `共 ${t} 条预警`,
          }}
        />
      </Card>
    </div>
  )
}

export { highestRiskLevel }
