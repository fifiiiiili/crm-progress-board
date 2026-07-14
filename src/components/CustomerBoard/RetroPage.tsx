import { useEffect, useMemo, useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Space,
  Typography,
  Button,
  Input,
  Select,
  Modal,
  Form,
  App as AntdAppCtx,
  Popconfirm,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { RetroRecord } from './constants'
import { fetchAllRetros, insertRetro, updateRetroById, deleteRetroById } from '../../api'

const { Text, Paragraph } = Typography

const CASE_TYPES = [
  '成功开通案例',
  '审核卡住案例',
  '高预算客户推进案例',
  '客户流失案例',
  '素材审核失败案例',
  '低意向客户转化案例',
  '账户开通失败案例',
  '可进入测试投放案例',
  '其他',
]

const CASE_TYPE_COLOR: Record<string, string> = {
  成功开通案例: 'success',
  审核卡住案例: 'red',
  高预算客户推进案例: 'purple',
  客户流失案例: 'default',
  素材审核失败案例: 'orange',
  低意向客户转化案例: 'blue',
  账户开通失败案例: 'volcano',
  可进入测试投放案例: 'green',
  其他: 'default',
}

interface RetroPageProps {
  currentUser: string
}

export default function RetroPage({ currentUser }: RetroPageProps) {
  const { message, modal } = AntdAppCtx.useApp()
  const [list, setList] = useState<RetroRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [caseType, setCaseType] = useState<string[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<RetroRecord | null>(null)
  const [form] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      const rows = await fetchAllRetros()
      setList(rows)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!formOpen) return
    if (editing) {
      form.setFieldsValue(editing)
    } else {
      form.resetFields()
      form.setFieldsValue({ recorder: currentUser })
    }
  }, [formOpen, editing, currentUser, form])

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return list.filter((r) => {
      if (caseType.length > 0 && !caseType.includes(r.case_type)) return false
      if (kw) {
        const hay = [r.related_account_name, r.related_account_id, r.industry, r.problem_bg]
          .map((x) => (x || '').toLowerCase())
          .join(' | ')
        if (!hay.includes(kw)) return false
      }
      return true
    })
  }, [list, keyword, caseType])

  const handleSave = async () => {
    const values = await form.validateFields()
    try {
      if (editing?.id != null) {
        await updateRetroById(editing.id, values)
        message.success('已更新')
      } else {
        await insertRetro({ ...values, recorded_at: new Date().toISOString() })
        message.success('已新增')
      }
      setFormOpen(false)
      setEditing(null)
      await load()
    } catch (e) {
      message.error('保存失败：' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const handleDelete = (r: RetroRecord) => {
    modal.confirm({
      title: '确认删除该复盘记录？',
      content: `案例：${r.case_type} / ${r.related_account_name || '—'}`,
      okType: 'danger',
      onOk: async () => {
        if (r.id == null) return
        await deleteRetroById(r.id)
        message.success('已删除')
        await load()
      },
    })
  }

  const columns: ColumnsType<RetroRecord> = [
    {
      title: '案例类型',
      dataIndex: 'case_type',
      width: 150,
      render: (v: string) => <Tag color={CASE_TYPE_COLOR[v] || 'default'}>{v}</Tag>,
    },
    {
      title: '账号',
      key: 'account',
      width: 200,
      render: (_: unknown, r) => (
        <div>
          <div>{r.related_account_name || '—'}</div>
          <Text type="secondary" style={{ fontSize: 12 }} className="mono-font">
            {r.related_account_id || ''}
          </Text>
        </div>
      ),
    },
    { title: '行业', dataIndex: 'industry', width: 140 },
    {
      title: '问题背景',
      dataIndex: 'problem_bg',
      width: 220,
      render: (v: string) => (
        <Paragraph
          style={{ margin: 0, fontSize: 12 }}
          ellipsis={{ rows: 2, tooltip: v }}
        >
          {v}
        </Paragraph>
      ),
    },
    {
      title: '处理动作',
      dataIndex: 'action_taken',
      width: 220,
      render: (v: string) => (
        <Paragraph
          style={{ margin: 0, fontSize: 12 }}
          ellipsis={{ rows: 2, tooltip: v }}
        >
          {v}
        </Paragraph>
      ),
    },
    {
      title: '结果',
      dataIndex: 'result',
      width: 200,
      render: (v: string) => (
        <Paragraph
          style={{ margin: 0, fontSize: 12 }}
          ellipsis={{ rows: 2, tooltip: v }}
        >
          {v}
        </Paragraph>
      ),
    },
    {
      title: '可复用经验',
      dataIndex: 'reusable_experience',
      width: 240,
      render: (v: string) => (
        <Paragraph
          style={{ margin: 0, fontSize: 12 }}
          ellipsis={{ rows: 2, tooltip: v }}
        >
          {v}
        </Paragraph>
      ),
    },
    { title: '记录人', dataIndex: 'recorder', width: 100 },
    {
      title: '时间',
      dataIndex: 'recorded_at',
      width: 130,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD') : '—'),
    },
    {
      title: '操作',
      key: 'act',
      width: 130,
      fixed: 'right',
      render: (_: unknown, r) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(r)
              setFormOpen(true)
            }}
          >
            编辑
          </Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="retro-page">
      <Card
        size="small"
        title={
          <Space>
            📚 复盘沉淀
            <Text type="secondary" style={{ fontSize: 12 }}>
              （共 {filtered.length} 条）
            </Text>
          </Space>
        }
        extra={
          <Space>
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索账号 / 行业 / 问题"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
              style={{ width: 220 }}
            />
            <Select
              mode="multiple"
              placeholder="案例类型"
              allowClear
              style={{ width: 220 }}
              maxTagCount="responsive"
              options={CASE_TYPES.map((t) => ({ label: t, value: t }))}
              value={caseType}
              onChange={setCaseType}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              新增复盘
            </Button>
          </Space>
        }
      >
        <Table<RetroRecord>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          loading={loading}
          size="small"
          scroll={{ x: 1900 }}
          pagination={{
            defaultPageSize: 15,
            showSizeChanger: true,
            showTotal: (t) => `${t} 条`,
          }}
        />
      </Card>

      <Modal
        open={formOpen}
        title={editing ? '编辑复盘记录' : '新增复盘记录'}
        onCancel={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onOk={handleSave}
        okText="保存"
        cancelText="取消"
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="案例类型"
            name="case_type"
            rules={[{ required: true, message: '请选择案例类型' }]}
          >
            <Select
              placeholder="请选择"
              options={CASE_TYPES.map((t) => ({ label: t, value: t }))}
            />
          </Form.Item>
          <Space.Compact block>
            <Form.Item
              label="关联账号 ID"
              name="related_account_id"
              style={{ width: '50%' }}
            >
              <Input placeholder="如：AD_100001" />
            </Form.Item>
            <Form.Item
              label="账号名称"
              name="related_account_name"
              style={{ width: '50%' }}
            >
              <Input placeholder="如：模拟品牌案例" />
            </Form.Item>
          </Space.Compact>
          <Form.Item label="行业 / 品类" name="industry">
            <Input placeholder="如：游戏 / SLG" />
          </Form.Item>
          <Form.Item
            label="问题背景"
            name="problem_bg"
            rules={[{ required: true, message: '请填写问题背景' }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            label="处理动作"
            name="action_taken"
            rules={[{ required: true, message: '请填写处理动作' }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            label="结果"
            name="result"
            rules={[{ required: true, message: '请填写结果' }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            label="可复用经验"
            name="reusable_experience"
            rules={[{ required: true, message: '请填写可复用经验' }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            label="记录人"
            name="recorder"
            rules={[{ required: true, message: '请填写记录人' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
