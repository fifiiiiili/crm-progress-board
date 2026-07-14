import { useState } from 'react'
import { Modal, Upload, Button, Table, Tag, Alert, Space, Typography, Divider } from 'antd'
import type { UploadProps } from 'antd'
import { InboxOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'
import type { ColumnsType } from 'antd/es/table'
import {
  EXCEL_HEADER_MAP,
  STATUS_OPTIONS,
  BLOCK_TYPE_OPTIONS,
  CUSTOMER_SCALE_OPTIONS,
  PRIORITY_OPTIONS,
  INTENT_OPTIONS,
  PLATFORM_OPTIONS,
  ACCOUNT_STATUS_OPTIONS,
  CREATIVE_STATUS_OPTIONS,
  LAUNCH_STAGE_OPTIONS,
  type CustomerRecord,
} from './constants'
import { existingProAccountIds } from '../../api'

const { Text, Paragraph } = Typography
const { Dragger } = Upload

interface BulkImportModalProps {
  open: boolean
  currentUser: string
  onCancel: () => void
  onSubmit: (records: Omit<CustomerRecord, 'id'>[]) => Promise<void>
}

interface ParsedRow {
  key: number
  raw: Record<string, unknown>
  data: Partial<CustomerRecord>
  error: string | null
}

const VALID_STATUS = new Set<string>(STATUS_OPTIONS)
const VALID_BLOCK = new Set<string>(BLOCK_TYPE_OPTIONS)
const VALID_SCALE = new Set<string>(CUSTOMER_SCALE_OPTIONS)
const VALID_PRIORITY = new Set<string>(PRIORITY_OPTIONS)
const VALID_INTENT = new Set<string>(INTENT_OPTIONS)
const VALID_PLATFORM = new Set<string>(PLATFORM_OPTIONS)
const VALID_ACCOUNT_STATUS = new Set<string>(ACCOUNT_STATUS_OPTIONS)
const VALID_CREATIVE_STATUS = new Set<string>(CREATIVE_STATUS_OPTIONS)
const VALID_LAUNCH_STAGE = new Set<string>(LAUNCH_STAGE_OPTIONS)

function parseValue(field: keyof CustomerRecord, val: unknown): unknown {
  if (val === null || val === undefined || val === '') return null
  const s = String(val).trim()
  if (
    field === 'last_follow_up_at' ||
    field === 'lead_created_at' ||
    field === 'first_test_date'
  ) {
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d.toISOString()
  }
  if (field === 'monthly_budget' || field === 'test_budget' || field === 'creative_count') {
    const n = Number(s)
    return isNaN(n) ? null : n
  }
  return s
}

export default function BulkImportModal({
  open,
  currentUser,
  onCancel,
  onSubmit,
}: BulkImportModalProps) {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [busy, setBusy] = useState(false)
  const [fileName, setFileName] = useState<string>('')

  const reset = () => {
    setRows([])
    setFileName('')
  }
  const handleCancel = () => {
    reset()
    onCancel()
  }

  const uploadProps: UploadProps = {
    accept: '.xlsx,.xls,.csv',
    beforeUpload: async (file) => {
      try {
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

        // 转换 raw → parsed
        const parsed: ParsedRow[] = raw.map((r, i) => {
          const data: Partial<CustomerRecord> = {}
          for (const [zh, field] of Object.entries(EXCEL_HEADER_MAP)) {
            if (r[zh] !== undefined) {
              ;(data as Record<string, unknown>)[field] = parseValue(field, r[zh])
            }
          }
          let error: string | null = null
          // 必填
          if (!data.pro_account_id) error = '账号 ID 缺失'
          else if (!data.pro_account_name) error = '账号名称缺失'
          else if (!data.customer_source) error = '客户来源缺失'
          else if (!data.channel_manager) error = '对应渠道经理缺失'
          else if (!data.current_status) error = '当前状态缺失'
          else if (data.current_status && !VALID_STATUS.has(data.current_status as string))
            error = `当前状态非法：${data.current_status}`
          else if (data.block_type && !VALID_BLOCK.has(data.block_type as string))
            error = `卡点类型非法：${data.block_type}`
          else if (data.customer_scale && !VALID_SCALE.has(data.customer_scale as string))
            error = `客户体量非法：${data.customer_scale}`
          else if (data.priority && !VALID_PRIORITY.has(data.priority as string))
            error = `优先级非法：${data.priority}`
          else if (data.intent && !VALID_INTENT.has(data.intent as string))
            error = `投放意向非法：${data.intent}`
          else if (data.platform && !VALID_PLATFORM.has(data.platform as string))
            error = `投放平台非法：${data.platform}`
          else if (
            data.account_status &&
            !VALID_ACCOUNT_STATUS.has(data.account_status as string)
          )
            error = `账户状态非法：${data.account_status}`
          else if (
            data.creative_status &&
            !VALID_CREATIVE_STATUS.has(data.creative_status as string)
          )
            error = `素材状态非法：${data.creative_status}`
          else if (data.launch_stage && !VALID_LAUNCH_STAGE.has(data.launch_stage as string))
            error = `投放阶段非法：${data.launch_stage}`

          return { key: i, raw: r, data, error }
        })

        // 文件内自身重复检测
        const seen = new Map<string, number>()
        parsed.forEach((p) => {
          if (p.error || !p.data.pro_account_id) return
          const pid = p.data.pro_account_id as string
          if (seen.has(pid)) {
            p.error = `文件内账号 ID 重复（第 ${seen.get(pid)! + 2} 行）`
          } else {
            seen.set(pid, p.key)
          }
        })

        // 数据库查重
        const valid = parsed.filter((p) => !p.error && p.data.pro_account_id)
        if (valid.length > 0) {
          const existing = await existingProAccountIds(
            valid.map((p) => p.data.pro_account_id as string),
          )
          for (const p of valid) {
            if (existing.has(p.data.pro_account_id as string)) {
              p.error =
                '该账号 ID 已存在，请勿重复添加。如需更新信息，请在原记录中编辑。'
            }
          }
        }

        setRows(parsed)
        setFileName(file.name)
      } catch (e) {
        console.error(e)
        alert('文件解析失败：' + (e instanceof Error ? e.message : String(e)))
      }
      return false
    },
    showUploadList: false,
    maxCount: 1,
  }

  const validRows = rows.filter((r) => !r.error)
  const errorRows = rows.filter((r) => !!r.error)

  const handleImport = async () => {
    if (validRows.length === 0) return
    setBusy(true)
    try {
      const now = new Date().toISOString()
      const records: Omit<CustomerRecord, 'id'>[] = validRows.map((r) => ({
        customer_source: (r.data.customer_source as string) || '',
        pro_account_id: (r.data.pro_account_id as string) || '',
        pro_account_name: (r.data.pro_account_name as string) || '',
        country_region: (r.data.country_region as string) || null,
        industry_l1: (r.data.industry_l1 as string) || null,
        industry_l2: (r.data.industry_l2 as string) || null,
        channel_manager: (r.data.channel_manager as string) || '',
        customer_scale: (r.data.customer_scale as never) || null,
        monthly_budget: (r.data.monthly_budget as number) ?? null,
        priority: (r.data.priority as never) || null,
        intent: (r.data.intent as never) || null,
        current_status: (r.data.current_status as never) || '未跟进',
        block_type: (r.data.block_type as never) || null,
        follow_up_note: (r.data.follow_up_note as string) || null,
        next_action: (r.data.next_action as string) || null,
        last_follow_up_at: (r.data.last_follow_up_at as string) || now,
        lead_created_at: (r.data.lead_created_at as string) || now,
        chat_screenshots: null,
        remark: (r.data.remark as string) || null,
        source_type: '表格上传',
        creator: currentUser,
        author_name: currentUser,
        platform: (r.data.platform as never) || null,
        account_status: (r.data.account_status as never) || null,
        creative_status: (r.data.creative_status as never) || null,
        creative_count: (r.data.creative_count as number) ?? null,
        creative_review: null,
        test_budget: (r.data.test_budget as number) ?? null,
        launch_stage: (r.data.launch_stage as never) || null,
        first_test_date: (r.data.first_test_date as string) || null,
      }))
      await onSubmit(records)
      reset()
      onCancel()
    } finally {
      setBusy(false)
    }
  }

  const downloadTemplate = () => {
    const templateRow: Record<string, string> = {}
    for (const zh of Object.keys(EXCEL_HEADER_MAP)) {
      templateRow[zh] = ''
    }
    templateRow['客户来源'] = '示例：销售BD推荐'
    templateRow['账号ID'] = 'AD_100999'
    templateRow['账号名称'] = '示例账号'
    templateRow['对应渠道经理'] = '模拟经理A'
    templateRow['当前状态'] = '未跟进'
    templateRow['客户优先级'] = 'P2'
    templateRow['投放意向'] = '中'
    templateRow['预估月预算'] = '50000'
    templateRow['投放平台'] = '巨量引擎'
    const ws = XLSX.utils.json_to_sheet([templateRow])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '模板')
    XLSX.writeFile(wb, '客户批量上传模板.xlsx')
  }

  const previewColumns: ColumnsType<ParsedRow> = [
    {
      title: '#',
      key: 'row',
      width: 50,
      render: (_: unknown, __: ParsedRow, idx) => idx + 1,
    },
    {
      title: '状态',
      key: 'status',
      width: 90,
      render: (_: unknown, r) =>
        r.error ? <Tag color="red">错误</Tag> : <Tag color="success">可导入</Tag>,
    },
    { title: '账号ID', dataIndex: ['data', 'pro_account_id'], width: 120 },
    { title: '账号名称', dataIndex: ['data', 'pro_account_name'], width: 180 },
    { title: '客户来源', dataIndex: ['data', 'customer_source'], width: 120 },
    { title: '当前状态', dataIndex: ['data', 'current_status'], width: 130 },
    { title: '优先级', dataIndex: ['data', 'priority'], width: 80 },
    {
      title: '错误信息',
      dataIndex: 'error',
      width: 300,
      render: (v: string) => (v ? <Text type="danger">{v}</Text> : '—'),
    },
  ]

  return (
    <Modal
      open={open}
      title="表格批量上传"
      onCancel={handleCancel}
      width={1000}
      destroyOnClose
      footer={
        <Space>
          <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>
            下载模板
          </Button>
          <Button onClick={handleCancel}>取消</Button>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            loading={busy}
            disabled={validRows.length === 0}
            onClick={handleImport}
          >
            导入 {validRows.length} 条
          </Button>
        </Space>
      }
    >
      <Alert
        type="info"
        showIcon
        message="批量导入说明"
        description={
          <div>
            <Paragraph style={{ margin: 0 }}>
              1. 支持 xlsx / xls / csv 格式；首行必须是中文字段名（可下载模板）
              <br />
              2. 上传的数据自动标记为「表格上传」，受数据保护，不支持删除
              <br />
              3. 账号 ID 为唯一识别，与已有数据或本文件内重复都会被标记为错误
              <br />
              4. 状态、优先级、体量等字段必须使用预设枚举值
            </Paragraph>
          </div>
        }
        style={{ marginBottom: 16 }}
      />

      {rows.length === 0 ? (
        <Dragger {...uploadProps} style={{ padding: 20 }}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此上传</p>
          <p className="ant-upload-hint">支持 xlsx / xls / csv 格式</p>
        </Dragger>
      ) : (
        <>
          <Space style={{ marginBottom: 12 }}>
            <Text>
              📄 {fileName}
            </Text>
            <Tag color="success">可导入 {validRows.length}</Tag>
            {errorRows.length > 0 && <Tag color="red">错误 {errorRows.length}</Tag>}
            <Button size="small" onClick={reset}>
              重新选择文件
            </Button>
          </Space>
          <Divider style={{ margin: '8px 0' }} />
          <Table<ParsedRow>
            rowKey="key"
            columns={previewColumns}
            dataSource={rows}
            size="small"
            scroll={{ x: 1200, y: 380 }}
            pagination={{ pageSize: 20 }}
          />
        </>
      )}
    </Modal>
  )
}
