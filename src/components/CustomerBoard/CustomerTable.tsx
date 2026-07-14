import { useState } from 'react'
import { Table, Tag, Button, Space, Tooltip, Modal, Image, Empty, Typography, Progress } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  PictureOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  STATUS_COLOR_MAP,
  BLOCK_TYPE_COLOR_MAP,
  SOURCE_COLOR_MAP,
  SCALE_COLOR_MAP,
  PRIORITY_COLOR_MAP,
  INTENT_COLOR_MAP,
  PLATFORM_COLOR_MAP,
  ACCOUNT_STATUS_COLOR_MAP,
  CREATIVE_STATUS_COLOR_MAP,
  LAUNCH_STAGE_COLOR_MAP,
  READINESS_COLOR_MAP,
  type CustomerRecord,
} from './constants'
import './CustomerTable.css'

const { Text } = Typography

interface CustomerTableProps {
  data: CustomerRecord[]
  loading: boolean
  onEdit: (record: CustomerRecord) => void
  onDelete: (record: CustomerRecord) => void
  onPreviewScreenshots: (record: CustomerRecord) => void
  onViewDetail?: (record: CustomerRecord) => void
}

export default function CustomerTable({
  data,
  loading,
  onEdit,
  onDelete,
  onPreviewScreenshots,
  onViewDetail,
}: CustomerTableProps) {
  const columns: ColumnsType<CustomerRecord> = [
    {
      title: '客户来源',
      dataIndex: 'customer_source',
      width: 120,
      fixed: 'left',
    },
    {
      title: '账号ID',
      dataIndex: 'pro_account_id',
      width: 130,
      fixed: 'left',
      render: (v: string, record) =>
        onViewDetail ? (
          <a onClick={() => onViewDetail(record)} className="mono-font">
            {v}
          </a>
        ) : (
          <Text className="mono-font">{v}</Text>
        ),
    },
    {
      title: '账号名称',
      dataIndex: 'pro_account_name',
      width: 180,
      render: (v: string, record) =>
        onViewDetail ? <a onClick={() => onViewDetail(record)}>{v}</a> : v,
    },
    {
      title: '国家/地区',
      dataIndex: 'country_region',
      width: 110,
    },
    {
      title: '一级行业',
      dataIndex: 'industry_l1',
      width: 100,
    },
    {
      title: '二级行业',
      dataIndex: 'industry_l2',
      width: 110,
    },
    {
      title: '渠道经理',
      dataIndex: 'channel_manager',
      width: 110,
    },
    {
      title: '客户体量',
      dataIndex: 'customer_scale',
      width: 90,
      render: (v: string) => (v ? <Tag color={SCALE_COLOR_MAP[v as never]}>{v}</Tag> : '—'),
    },
    {
      title: '预估月预算',
      dataIndex: 'monthly_budget',
      width: 120,
      align: 'right',
      sorter: (a, b) => (a.monthly_budget || 0) - (b.monthly_budget || 0),
      render: (v: number) => (v ? `¥ ${v.toLocaleString()}` : '—'),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 80,
      render: (v: string) => (v ? <Tag color={PRIORITY_COLOR_MAP[v as never]}>{v}</Tag> : '—'),
    },
    {
      title: '投放意向',
      dataIndex: 'intent',
      width: 100,
      render: (v: string) => (v ? <Tag color={INTENT_COLOR_MAP[v as never]}>{v}</Tag> : '—'),
    },
    {
      title: '当前状态',
      dataIndex: 'current_status',
      width: 130,
      render: (v: string) => <Tag color={STATUS_COLOR_MAP[v as never]}>{v}</Tag>,
    },
    {
      title: '卡点类型',
      dataIndex: 'block_type',
      width: 130,
      render: (v: string) =>
        v ? <Tag color={BLOCK_TYPE_COLOR_MAP[v as never]}>{v}</Tag> : '—',
    },
    {
      title: '投放平台',
      dataIndex: 'platform',
      width: 100,
      render: (v: string) => (v ? <Tag color={PLATFORM_COLOR_MAP[v as never]}>{v}</Tag> : '—'),
    },
    {
      title: '账户状态',
      dataIndex: 'account_status',
      width: 100,
      render: (v: string) =>
        v ? <Tag color={ACCOUNT_STATUS_COLOR_MAP[v as never]}>{v}</Tag> : '—',
    },
    {
      title: '素材状态',
      dataIndex: 'creative_status',
      width: 100,
      render: (v: string) =>
        v ? <Tag color={CREATIVE_STATUS_COLOR_MAP[v as never]}>{v}</Tag> : '—',
    },
    {
      title: '投放阶段',
      dataIndex: 'launch_stage',
      width: 100,
      render: (v: string) =>
        v ? <Tag color={LAUNCH_STAGE_COLOR_MAP[v as never]}>{v}</Tag> : '—',
    },
    {
      title: '准备度评分',
      dataIndex: 'readiness_score',
      width: 130,
      sorter: (a, b) => (a.readiness_score || 0) - (b.readiness_score || 0),
      render: (v: number) => {
        const score = v || 0
        const color = score >= 80 ? '#52c41a' : score >= 60 ? '#1677ff' : score >= 40 ? '#faad14' : '#f5222d'
        return (
          <Space size={6}>
            <Progress
              percent={score}
              size={[60, 6]}
              strokeColor={color}
              showInfo={false}
            />
            <Text strong style={{ color }}>{score}</Text>
          </Space>
        )
      },
    },
    {
      title: '准备状态',
      dataIndex: 'readiness_status',
      width: 130,
      render: (v: string) => (v ? <Tag color={READINESS_COLOR_MAP[v as never]}>{v}</Tag> : '—'),
    },
    {
      title: '跟进情况',
      dataIndex: 'follow_up_note',
      width: 220,
      ellipsis: { showTitle: true },
      render: (v: string) => v || '—',
    },
    {
      title: '下一步',
      dataIndex: 'next_action',
      width: 180,
      ellipsis: { showTitle: true },
      render: (v: string) => v || '—',
    },
    {
      title: '最近跟进',
      dataIndex: 'last_follow_up_at',
      width: 140,
      sorter: (a, b) => {
        const ta = a.last_follow_up_at ? new Date(a.last_follow_up_at).getTime() : 0
        const tb = b.last_follow_up_at ? new Date(b.last_follow_up_at).getTime() : 0
        return ta - tb
      },
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—'),
    },
    {
      title: '截图',
      dataIndex: 'chat_screenshots',
      width: 70,
      align: 'center',
      render: (v: unknown, record) => {
        const arr = Array.isArray(v) ? v : []
        if (arr.length === 0) return <Text type="secondary">—</Text>
        return (
          <Button
            type="link"
            size="small"
            icon={<PictureOutlined />}
            onClick={() => onPreviewScreenshots(record)}
          >
            {arr.length}
          </Button>
        )
      },
    },
    {
      title: '来源',
      dataIndex: 'source_type',
      width: 100,
      render: (v: string) => <Tag color={SOURCE_COLOR_MAP[v as never]}>{v}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 210,
      fixed: 'right',
      render: (_: unknown, record) => {
        const isProtected =
          record.source_type === '表格上传' || record.source_type === '模拟数据'
        return (
          <Space size={4}>
            {onViewDetail && (
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onViewDetail(record)}
              >
                详情
              </Button>
            )}
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            >
              编辑
            </Button>
            {isProtected ? (
              <Tooltip title={`${record.source_type}数据受保护，不支持删除`}>
                <Button type="link" size="small" icon={<LockOutlined />} disabled>
                  受保护
                </Button>
              </Tooltip>
            ) : (
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(record)}
              >
                删除
              </Button>
            )}
          </Space>
        )
      },
    },
  ]

  return (
    <Table<CustomerRecord>
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      scroll={{ x: 3200 }}
      size="small"
      pagination={{
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: [10, 20, 50, 100],
        defaultPageSize: 20,
        showTotal: (total) => `共 ${total} 条`,
      }}
    />
  )
}

// ============ 截图预览 Modal ============
interface ScreenshotPreviewModalProps {
  open: boolean
  record: CustomerRecord | null
  onClose: () => void
}
export function ScreenshotPreviewModal({
  open,
  record,
  onClose,
}: ScreenshotPreviewModalProps) {
  const [_activeIdx, setActiveIdx] = useState(0)
  const arr = Array.isArray(record?.chat_screenshots) ? record!.chat_screenshots : []
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={880}
      title={`跟进聊天截图 - ${record?.pro_account_name || ''}`}
      destroyOnClose
    >
      {arr.length === 0 ? (
        <Empty description="暂无截图留痕" />
      ) : (
        <Image.PreviewGroup>
          <Space wrap>
            {arr.map((s, i) => (
              <div key={i} className="screenshot-preview-item">
                <Image
                  src={s.url}
                  width={160}
                  height={160}
                  style={{ objectFit: 'cover', borderRadius: 6 }}
                  preview={{
                    onVisibleChange: (v) => v && setActiveIdx(i),
                  }}
                />
                {s.caption && (
                  <Text type="secondary" className="screenshot-caption">
                    {s.caption}
                  </Text>
                )}
              </div>
            ))}
          </Space>
        </Image.PreviewGroup>
      )}
    </Modal>
  )
}
