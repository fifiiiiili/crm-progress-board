import { useMemo } from 'react'
import { Card, Table, Tag, Space, Typography, Empty, Row, Col, Statistic, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FireOutlined, ClockCircleOutlined, ExclamationCircleOutlined, DollarOutlined, RocketOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  PRIORITY_COLOR_MAP,
  STATUS_COLOR_MAP,
  BLOCK_TYPE_COLOR_MAP,
  READINESS_COLOR_MAP,
  type CustomerRecord,
} from './constants'
import { buildSuggestedAction } from '../../utils/risk'

const { Text } = Typography

interface TodoCenterProps {
  records: CustomerRecord[]
  onViewDetail?: (r: CustomerRecord) => void
}

interface ListDef {
  key: string
  title: string
  icon: React.ReactNode
  color: string
  filter: (r: CustomerRecord) => boolean
  emptyText: string
}

export default function TodoCenter({ records, onViewDetail }: TodoCenterProps) {
  const lists: ListDef[] = useMemo(
    () => [
      {
        key: 'highPri',
        title: '高优客户待跟进',
        icon: <FireOutlined />,
        color: '#fa541c',
        filter: (r) =>
          (r.priority === 'P0' || r.priority === 'P1') &&
          r.current_status !== '已开通' &&
          r.current_status !== '无效线索',
        emptyText: '暂无 P0/P1 待跟进客户',
      },
      {
        key: 'stale',
        title: '超 7 天未更新',
        icon: <ClockCircleOutlined />,
        color: '#faad14',
        filter: (r) => {
          if (r.current_status === '已开通' || r.current_status === '无效线索') return false
          const t = r.last_follow_up_at || r.updated_at || r.created_at
          if (!t) return true
          return dayjs().diff(dayjs(t), 'day') > 7
        },
        emptyText: '暂无超期未更新客户',
      },
      {
        key: 'stuck',
        title: '审核卡住客户',
        icon: <ExclamationCircleOutlined />,
        color: '#f5222d',
        filter: (r) =>
          r.current_status === '审核卡住' ||
          r.block_type === '资质卡审' ||
          r.block_type === '内部审核待处理' ||
          r.block_type === '广告账户开通问题',
        emptyText: '暂无审核卡住客户',
      },
      {
        key: 'highBudget',
        title: '高预算未开通客户',
        icon: <DollarOutlined />,
        color: '#722ed1',
        filter: (r) => Number(r.monthly_budget || 0) >= 50000 && r.current_status !== '已开通',
        emptyText: '暂无高预算未开通客户',
      },
      {
        key: 'ready',
        title: '可进入测试投放',
        icon: <RocketOutlined />,
        color: '#52c41a',
        filter: (r) =>
          (r.readiness_score || 0) >= 80 && r.readiness_status === '可进入测试投放',
        emptyText: '暂无可进入测试投放客户',
      },
    ],
    [],
  )

  const listData = useMemo(
    () => lists.map((l) => ({ ...l, data: records.filter(l.filter) })),
    [lists, records],
  )

  const columns: ColumnsType<CustomerRecord> = [
    {
      title: '账号ID',
      dataIndex: 'pro_account_id',
      width: 120,
      fixed: 'left',
      render: (v: string, r) =>
        onViewDetail ? (
          <a onClick={() => onViewDetail(r)} className="mono-font">
            {v}
          </a>
        ) : (
          <Text className="mono-font">{v}</Text>
        ),
    },
    { title: '账号名称', dataIndex: 'pro_account_name', width: 180, ellipsis: true },
    {
      title: '体量',
      dataIndex: 'customer_scale',
      width: 80,
      render: (v) => v || '—',
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 70,
      render: (v: string) => (v ? <Tag color={PRIORITY_COLOR_MAP[v as never]}>{v}</Tag> : '—'),
    },
    {
      title: '月预算',
      dataIndex: 'monthly_budget',
      width: 100,
      align: 'right',
      render: (v: number) => (v ? `¥${(v / 10000).toFixed(1)}万` : '—'),
    },
    { title: '渠道经理', dataIndex: 'channel_manager', width: 100 },
    {
      title: '当前状态',
      dataIndex: 'current_status',
      width: 130,
      render: (v: string) => <Tag color={STATUS_COLOR_MAP[v as never]}>{v}</Tag>,
    },
    {
      title: '卡点',
      dataIndex: 'block_type',
      width: 130,
      render: (v: string) =>
        v ? <Tag color={BLOCK_TYPE_COLOR_MAP[v as never]}>{v}</Tag> : '—',
    },
    {
      title: '准备度',
      dataIndex: 'readiness_score',
      width: 90,
      align: 'center',
      render: (v: number) => <Text strong>{v || 0}</Text>,
    },
    {
      title: '准备状态',
      dataIndex: 'readiness_status',
      width: 130,
      render: (v: string) => (v ? <Tag color={READINESS_COLOR_MAP[v as never]}>{v}</Tag> : '—'),
    },
    {
      title: '最近跟进',
      dataIndex: 'last_follow_up_at',
      width: 130,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD') : '—'),
    },
    {
      title: '下一步',
      dataIndex: 'next_action',
      width: 160,
      ellipsis: true,
      render: (v: string) => v || '—',
    },
    {
      title: '建议动作',
      key: 'suggestion',
      width: 260,
      render: (_: unknown, r) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {buildSuggestedAction(r)}
        </Text>
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
            onClick={() => onViewDetail(r)}
          >
            详情
          </Button>
        ) : (
          '—'
        ),
    },
  ]

  return (
    <div className="todo-center">
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {listData.map((l) => (
          <Col xs={12} sm={12} md={8} lg={4} key={l.key}>
            <Card size="small">
              <Statistic
                title={l.title}
                value={l.data.length}
                valueStyle={{ color: l.color }}
                prefix={l.icon}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        {listData.map((l) => (
          <Card
            key={l.key}
            size="small"
            title={
              <span>
                <span style={{ color: l.color, marginRight: 6 }}>{l.icon}</span>
                {l.title}
                <Text type="secondary" style={{ marginLeft: 6, fontSize: 12 }}>
                  （{l.data.length} 个）
                </Text>
              </span>
            }
          >
            {l.data.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={l.emptyText} />
            ) : (
              <Table<CustomerRecord>
                rowKey="id"
                columns={columns}
                dataSource={l.data.slice(0, 50)}
                pagination={{
                  pageSize: 10,
                  showTotal: (t) => `${t} 条${l.data.length > 50 ? '（仅展示前 50）' : ''}`,
                }}
                size="small"
                scroll={{ x: 1700 }}
              />
            )}
          </Card>
        ))}
      </Space>
    </div>
  )
}
