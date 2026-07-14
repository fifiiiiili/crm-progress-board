import { Table, Tag, Space, Button, Tooltip, Modal, Image, Empty } from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
  LockOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { TableColumnsType } from 'antd'
import {
  STATUS_COLOR_MAP,
  BLOCK_COLOR_MAP,
  type CustomerRecord,
} from './constants'
import './CustomerTable.css'

interface Props {
  data: CustomerRecord[]
  loading: boolean
  onEdit: (record: CustomerRecord) => void
  onDelete: (record: CustomerRecord) => void
  onPreviewScreenshots: (record: CustomerRecord) => void
}

function formatTime(t?: string | null) {
  if (!t) return '—'
  const d = dayjs(t)
  if (!d.isValid()) return '—'
  return d.format('YYYY-MM-DD HH:mm')
}

export default function CustomerTable({
  data,
  loading,
  onEdit,
  onDelete,
  onPreviewScreenshots,
}: Props) {
  const columns: TableColumnsType<CustomerRecord> = [
    {
      title: '客户来源',
      dataIndex: 'customer_source',
      width: 110,
      fixed: 'left',
      ellipsis: true,
    },
    {
      title: '专业号ID',
      dataIndex: 'pro_account_id',
      width: 140,
      fixed: 'left',
      ellipsis: true,
      render: (v) => <span className="mono">{v}</span>,
    },
    {
      title: '专业号名称',
      dataIndex: 'pro_account_name',
      width: 160,
      fixed: 'left',
      ellipsis: true,
    },
    {
      title: '国家/地区',
      dataIndex: 'country_region',
      width: 90,
      ellipsis: true,
    },
    {
      title: '一级行业',
      dataIndex: 'industry_l1',
      width: 100,
      ellipsis: true,
    },
    {
      title: '二级行业',
      dataIndex: 'industry_l2',
      width: 100,
      ellipsis: true,
    },
    {
      title: '渠道经理',
      dataIndex: 'channel_manager',
      width: 100,
      ellipsis: true,
    },
    {
      title: '当前状态',
      dataIndex: 'current_status',
      width: 130,
      render: (v: string) =>
        v ? <Tag color={STATUS_COLOR_MAP[v] || 'default'}>{v}</Tag> : '—',
      sorter: (a, b) => (a.current_status || '').localeCompare(b.current_status || ''),
    },
    {
      title: '卡点类型',
      dataIndex: 'block_type',
      width: 140,
      render: (v: string | null) =>
        v ? <Tag color={BLOCK_COLOR_MAP[v] || 'default'}>{v}</Tag> : '—',
    },
    {
      title: '跟进情况',
      dataIndex: 'follow_up_note',
      width: 200,
      render: (v: string | null) =>
        v ? (
          <Tooltip title={v} placement="topLeft">
            <div className="ellipsis-2">{v}</div>
          </Tooltip>
        ) : (
          '—'
        ),
    },
    {
      title: '下一步动作',
      dataIndex: 'next_action',
      width: 160,
      render: (v: string | null) =>
        v ? (
          <Tooltip title={v} placement="topLeft">
            <div className="ellipsis-2">{v}</div>
          </Tooltip>
        ) : (
          '—'
        ),
    },
    {
      title: '最近跟进时间',
      dataIndex: 'last_follow_up_at',
      width: 140,
      render: (v: string | null) => formatTime(v),
      sorter: (a, b) => {
        const at = a.last_follow_up_at ? dayjs(a.last_follow_up_at).valueOf() : 0
        const bt = b.last_follow_up_at ? dayjs(b.last_follow_up_at).valueOf() : 0
        return at - bt
      },
      defaultSortOrder: 'descend',
    },
    {
      title: '聊天截图',
      dataIndex: 'chat_screenshots',
      width: 100,
      align: 'center',
      render: (_v, record) => {
        const count = record.chat_screenshots?.length || 0
        if (!count) return <span className="empty-cell">—</span>
        return (
          <Button
            type="link"
            size="small"
            icon={<PictureOutlined />}
            onClick={() => onPreviewScreenshots(record)}
          >
            {count}
          </Button>
        )
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 160,
      render: (v: string | null) =>
        v ? (
          <Tooltip title={v} placement="topLeft">
            <div className="ellipsis-2">{v}</div>
          </Tooltip>
        ) : (
          '—'
        ),
    },
    {
      title: '数据来源',
      dataIndex: 'source_type',
      width: 110,
      render: (v: string) =>
        v === '表格上传' ? (
          <Tag color="processing" icon={<LockOutlined />}>
            {v}
          </Tag>
        ) : (
          <Tag color="success">{v}</Tag>
        ),
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      width: 100,
      ellipsis: true,
      render: (v, r) => v || r.author_name || '—',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 140,
      render: (v: string | null) => formatTime(v),
      sorter: (a, b) => {
        const at = a.created_at ? dayjs(a.created_at).valueOf() : 0
        const bt = b.created_at ? dayjs(b.created_at).valueOf() : 0
        return at - bt
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 140,
      render: (v: string | null) => formatTime(v),
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_v, record) => {
        const isProtected = record.source_type === '表格上传'
        return (
          <Space size={4}>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            >
              编辑
            </Button>
            <Tooltip
              title={
                isProtected
                  ? '该数据来源于表格上传，已开启数据保护，不支持删除'
                  : ''
              }
            >
              <Button
                type="link"
                size="small"
                danger
                icon={isProtected ? <LockOutlined /> : <DeleteOutlined />}
                disabled={isProtected}
                onClick={() => onDelete(record)}
              >
                {isProtected ? '受保护' : '删除'}
              </Button>
            </Tooltip>
          </Space>
        )
      },
    },
  ]

  return (
    <Table<CustomerRecord>
      className="customer-table"
      rowKey={(r) => String(r.id ?? r.pro_account_id)}
      dataSource={data}
      columns={columns}
      loading={loading}
      size="middle"
      scroll={{ x: 2200, y: 'calc(100vh - 420px)' }}
      pagination={{
        pageSize: 20,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
        showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条 / 共 ${total} 条`,
      }}
      locale={{
        emptyText: (
          <Empty
            description="暂无客户数据，可通过右上角「新增客户」或「批量上传」录入"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ),
      }}
    />
  )
}

// 截图预览 Modal（独立组件，供上层调用）
export function ScreenshotPreviewModal({
  open,
  record,
  onClose,
}: {
  open: boolean
  record: CustomerRecord | null
  onClose: () => void
}) {
  const list = record?.chat_screenshots || []
  return (
    <Modal
      open={open}
      title={
        <span>
          <PictureOutlined /> 「{record?.pro_account_name || '—'}」的聊天截图（{list.length}）
        </span>
      }
      footer={null}
      onCancel={onClose}
      width={840}
      centered
      getContainer={() => document.body}
    >
      {list.length === 0 ? (
        <Empty description="暂无截图" />
      ) : (
        <div className="screenshot-preview-grid">
          {list.map((s, i) => (
            <div key={i} className="preview-item">
              <Image
                src={s.url}
                alt={s.caption || `screenshot-${i}`}
                style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }}
              />
              {s.caption && (
                <div className="preview-caption-inline">
                  <InfoCircleOutlined /> {s.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
