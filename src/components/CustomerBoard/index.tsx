import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Space,
  App as AntdAppCtx,
  Typography,
  Divider,
  Empty,
  Alert,
  Tabs,
  Tag,
  Dropdown,
  Tooltip,
} from 'antd'
import {
  ReloadOutlined,
  UploadOutlined,
  PlusOutlined,
  ExportOutlined,
  RedoOutlined,
  GithubOutlined,
  ClockCircleOutlined,
  DownOutlined,
} from '@ant-design/icons'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import FilterBar, { EMPTY_FILTER, type FilterState } from './FilterBar'
import CustomerTable, { ScreenshotPreviewModal } from './CustomerTable'
import CustomerForm from './CustomerForm'
import BulkImportModal from './BulkImportModal'
import Overview from './Overview'
import { FIELD_TO_LABEL, type CustomerRecord } from './constants'
import {
  fetchAllCustomers,
  insertCustomer,
  bulkInsertCustomers,
  updateCustomerById,
  deleteCustomerById,
  existsByProAccountId,
  resetDemoData,
  getDataUpdatedAt,
} from '../../api'
import './index.css'

const { Title, Text, Paragraph } = Typography

const GITHUB_URL = 'https://github.com/fifiiiiili/crm-progress-board'

const EXPORT_FIELDS = [
  'customer_source',
  'pro_account_id',
  'pro_account_name',
  'country_region',
  'industry_l1',
  'industry_l2',
  'channel_manager',
  'customer_scale',
  'monthly_budget',
  'priority',
  'intent',
  'current_status',
  'block_type',
  'follow_up_note',
  'next_action',
  'last_follow_up_at',
  'lead_created_at',
  'remark',
  'source_type',
  'creator',
  'created_at',
  'updated_at',
] as const

function exportToExcel(rows: CustomerRecord[], fileNamePrefix: string) {
  if (!rows.length) return false
  const exportRows = rows.map((r) => {
    const obj: Record<string, string | number> = {}
    for (const f of EXPORT_FIELDS) {
      const label = FIELD_TO_LABEL[f] || f
      const v = r[f as keyof CustomerRecord]
      if (v == null) {
        obj[label] = ''
      } else if (
        f === 'last_follow_up_at' ||
        f === 'created_at' ||
        f === 'updated_at' ||
        f === 'lead_created_at'
      ) {
        obj[label] = v ? dayjs(v as string).format('YYYY-MM-DD HH:mm') : ''
      } else if (f === 'monthly_budget') {
        obj[label] = typeof v === 'number' ? v : String(v)
      } else {
        obj[label] = String(v)
      }
    }
    return obj
  })
  const ws = XLSX.utils.json_to_sheet(exportRows)
  ;(ws['!cols'] as unknown as XLSX.ColInfo[]) = Object.keys(exportRows[0] || {}).map(() => ({
    wch: 16,
  }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '客户明细')
  const fname = `${fileNamePrefix}_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`
  XLSX.writeFile(wb, fname)
  return true
}

export default function CustomerBoard() {
  const { modal, message } = AntdAppCtx.useApp()
  const [data, setData] = useState<CustomerRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER)
  const [activeTab, setActiveTab] = useState<'overview' | 'detail'>('overview')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add')
  const [editing, setEditing] = useState<CustomerRecord | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [previewRecord, setPreviewRecord] = useState<CustomerRecord | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  const currentUser = 'Demo User'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await fetchAllCustomers()
      setData(rows)
      setUpdatedAt(getDataUpdatedAt())
    } catch (e) {
      message.error('数据加载失败：' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    load()
  }, [load])

  // 动态下拉选项 = 现有数据 distinct
  const distinctValues = useMemo(() => {
    const uniq = (arr: (string | null | undefined)[]) =>
      Array.from(new Set(arr.filter((v): v is string => !!v))).sort()
    return {
      customer_source: uniq(data.map((r) => r.customer_source)),
      country_region: uniq(data.map((r) => r.country_region)),
      industry_l1: uniq(data.map((r) => r.industry_l1)),
      industry_l2: uniq(data.map((r) => r.industry_l2)),
      channel_manager: uniq(data.map((r) => r.channel_manager)),
    }
  }, [data])

  // 前端应用筛选
  const filtered = useMemo(() => {
    const kw = filter.keyword.trim().toLowerCase()
    return data.filter((r) => {
      if (kw) {
        const hay = [r.pro_account_id, r.pro_account_name, r.channel_manager]
          .map((v) => (v || '').toLowerCase())
          .join(' | ')
        if (!hay.includes(kw)) return false
      }

      const inList = (list: string[], value?: string | null) =>
        list.length === 0 || (value ? list.includes(value) : false)

      if (!inList(filter.customer_source, r.customer_source)) return false
      if (!inList(filter.country_region, r.country_region)) return false
      if (!inList(filter.industry_l1, r.industry_l1)) return false
      if (!inList(filter.industry_l2, r.industry_l2)) return false
      if (!inList(filter.channel_manager, r.channel_manager)) return false
      if (!inList(filter.customer_scale, r.customer_scale)) return false
      if (!inList(filter.priority, r.priority)) return false
      if (!inList(filter.intent, r.intent)) return false
      if (!inList(filter.current_status, r.current_status)) return false
      if (!inList(filter.block_type, r.block_type)) return false
      if (!inList(filter.source_type, r.source_type)) return false

      if (filter.last_follow_up_range) {
        const [start, end] = filter.last_follow_up_range
        const t = r.last_follow_up_at ? dayjs(r.last_follow_up_at) : null
        if (!t) return false
        if (t.isBefore(start.startOf('day'))) return false
        if (t.isAfter(end.endOf('day'))) return false
      }

      return true
    })
  }, [data, filter])

  const handleAdd = () => {
    setFormMode('add')
    setEditing(null)
    setFormOpen(true)
  }

  const handleEdit = (record: CustomerRecord) => {
    setFormMode('edit')
    setEditing(record)
    setFormOpen(true)
  }

  const handleFormSubmit = async (values: Partial<CustomerRecord>) => {
    if (formMode === 'add') {
      const proId = values.pro_account_id?.trim() || ''
      if (!proId) {
        message.error('账号 ID 不能为空')
        return
      }
      const exists = await existsByProAccountId(proId)
      if (exists) {
        message.error('该账号 ID 已存在，请勿重复添加。如需更新信息，请在原记录中编辑。')
        return
      }
      const now = new Date().toISOString()
      await insertCustomer({
        pro_account_id: proId,
        customer_source: values.customer_source || '',
        pro_account_name: values.pro_account_name || '',
        country_region: values.country_region || null,
        industry_l1: values.industry_l1 || null,
        industry_l2: values.industry_l2 || null,
        channel_manager: values.channel_manager || '',
        customer_scale: values.customer_scale || null,
        monthly_budget: values.monthly_budget ?? null,
        priority: values.priority || null,
        intent: values.intent || null,
        current_status: values.current_status || '未跟进',
        block_type: values.block_type || null,
        follow_up_note: values.follow_up_note || null,
        next_action: values.next_action || null,
        last_follow_up_at: values.last_follow_up_at || now,
        lead_created_at: values.lead_created_at || now,
        chat_screenshots: values.chat_screenshots || null,
        remark: values.remark || null,
        source_type: '手动新增',
        creator: currentUser,
        author_name: currentUser,
      })
      message.success('新增成功')
    } else if (editing?.id != null) {
      const editable: Partial<CustomerRecord> = {
        pro_account_name: values.pro_account_name,
        country_region: values.country_region ?? null,
        industry_l1: values.industry_l1 ?? null,
        industry_l2: values.industry_l2 ?? null,
        channel_manager: values.channel_manager,
        customer_scale: values.customer_scale ?? null,
        monthly_budget: values.monthly_budget ?? null,
        priority: values.priority ?? null,
        intent: values.intent ?? null,
        current_status: values.current_status,
        block_type: values.block_type ?? null,
        follow_up_note: values.follow_up_note ?? null,
        next_action: values.next_action ?? null,
        last_follow_up_at: values.last_follow_up_at ?? null,
        lead_created_at: values.lead_created_at ?? null,
        chat_screenshots: values.chat_screenshots ?? null,
        remark: values.remark ?? null,
      }
      await updateCustomerById(editing.id, editable)
      message.success('保存成功')
    }
    setFormOpen(false)
    await load()
  }

  const handleDelete = (record: CustomerRecord) => {
    if (record.source_type === '表格上传' || record.source_type === '模拟数据') {
      message.error('该数据为受保护数据，不支持删除。')
      return
    }
    modal.confirm({
      title: '确认删除该条手动新增数据吗？',
      content: (
        <div>
          <div>账号名称：{record.pro_account_name}</div>
          <div style={{ color: '#8c9098', fontSize: 12, marginTop: 4 }}>
            账号 ID：{record.pro_account_id}
          </div>
        </div>
      ),
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        if (record.id == null) return
        try {
          await deleteCustomerById(record.id)
          message.success('已删除')
          await load()
        } catch (e) {
          message.error('删除失败：' + (e instanceof Error ? e.message : String(e)))
        }
      },
    })
  }

  const handleBulkImport = async (records: Omit<CustomerRecord, 'id'>[]) => {
    await bulkInsertCustomers(records)
    await load()
  }

  // —— 重点客户列表（用于导出）——
  const highPriorityList = useMemo(() => {
    return filtered.filter(
      (r) =>
        (r.priority === 'P0' || r.priority === 'P1') &&
        r.current_status !== '已开通' &&
        r.current_status !== '无效线索',
    )
  }, [filtered])

  const staleList = useMemo(() => {
    const sevenDaysAgo = dayjs().subtract(7, 'day')
    return filtered.filter((r) => {
      if (r.current_status === '已开通' || r.current_status === '无效线索') return false
      const t = r.last_follow_up_at || r.updated_at || r.created_at
      if (!t) return true
      return dayjs(t).isBefore(sevenDaysAgo)
    })
  }, [filtered])

  const blockedList = useMemo(() => {
    return filtered.filter(
      (r) =>
        r.current_status === '审核卡住' ||
        r.block_type === '资质卡审' ||
        r.block_type === '内部审核待处理',
    )
  }, [filtered])

  const handleExport = (
    scope: 'filtered' | 'all' | 'highPriority' | 'stale' | 'blocked',
  ) => {
    let rows: CustomerRecord[] = []
    let prefix = ''
    if (scope === 'filtered') {
      rows = filtered
      prefix = '客户明细_筛选结果'
    } else if (scope === 'all') {
      rows = data
      prefix = '客户明细_全部'
    } else if (scope === 'highPriority') {
      rows = highPriorityList
      prefix = '高优先级待跟进客户'
    } else if (scope === 'stale') {
      rows = staleList
      prefix = '超7天未更新客户'
    } else {
      rows = blockedList
      prefix = '审核卡住客户'
    }
    if (!rows.length) {
      message.warning('没有可导出的数据')
      return
    }
    const ok = exportToExcel(rows, prefix)
    if (ok) message.success(`已导出 ${rows.length} 条 —— ${prefix}`)
  }

  const exportMenuItems = [
    { key: 'filtered', label: `导出当前筛选结果（${filtered.length}）` },
    { key: 'all', label: `导出全部数据（${data.length}）` },
    { type: 'divider' as const },
    { key: 'highPriority', label: `高优先级待跟进客户（${highPriorityList.length}）` },
    { key: 'stale', label: `超 7 天未更新客户（${staleList.length}）` },
    { key: 'blocked', label: `审核卡住客户（${blockedList.length}）` },
  ]

  const handleResetDemo = () => {
    modal.confirm({
      title: '确认重置为演示初始数据？',
      content: (
        <div>
          <div>这将删除你在本浏览器里所有的改动，恢复到初始 2000 条模拟数据。</div>
          <div style={{ color: '#8c9098', fontSize: 12, marginTop: 6 }}>
            仅影响你自己的浏览器，不影响其他访客。
          </div>
        </div>
      ),
      okText: '确认重置',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        resetDemoData()
        message.success('已恢复为演示初始数据')
        await load()
      },
    })
  }

  const filterCount =
    filtered.length !== data.length ? `筛选结果 ${filtered.length}` : `全部 ${data.length}`

  return (
    <div className="customer-board">
      <Alert
        type="info"
        showIcon
        banner
        message={
          <span>
            <strong>Demo 演示版</strong>
            &nbsp;·&nbsp;本项目使用模拟数据，不包含任何真实客户或平台内部信息。
            数据仅保存在你当前浏览器的 localStorage 中，不同浏览器互相隔离。
          </span>
        }
        action={
          <Space>
            <Button
              size="small"
              icon={<RedoOutlined />}
              onClick={handleResetDemo}
            >
              重置演示数据
            </Button>
            <Button
              size="small"
              type="link"
              icon={<GithubOutlined />}
              href={GITHUB_URL}
              target="_blank"
            >
              源码
            </Button>
          </Space>
        }
        style={{ marginBottom: 12 }}
      />

      <div className="board-header">
        <div className="header-left">
          <Title level={4} style={{ margin: 0 }}>
            广告客户开通与投放准备进度管理面板
          </Title>
          <Paragraph
            type="secondary"
            className="header-subtitle"
            style={{ margin: '4px 0 0' }}
          >
            用于模拟广告业务中客户开通、账户准备、状态跟进和过程留痕的统一管理场景
          </Paragraph>
        </div>
        <Space wrap>
          <Tooltip title={updatedAt ? `数据最后更新：${dayjs(updatedAt).format('YYYY-MM-DD HH:mm:ss')}` : '尚未更新'}>
            <Tag icon={<ClockCircleOutlined />} color="default" style={{ padding: '4px 10px' }}>
              数据更新时间：{updatedAt ? dayjs(updatedAt).format('YYYY-MM-DD HH:mm') : '—'}
            </Tag>
          </Tooltip>
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            刷新
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>
            表格批量上传
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增客户
          </Button>
          <Dropdown
            menu={{
              items: exportMenuItems,
              onClick: ({ key }) => handleExport(key as never),
            }}
          >
            <Button icon={<ExportOutlined />}>
              导出 <DownOutlined />
            </Button>
          </Dropdown>
        </Space>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <FilterBar value={filter} onChange={setFilter} distinctValues={distinctValues} />

      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as 'overview' | 'detail')}
        items={[
          {
            key: 'overview',
            label: <span>📊 数据概览</span>,
            children:
              data.length === 0 && !loading ? (
                <Empty description="暂无数据" />
              ) : (
                <Overview records={filtered} totalBeforeFilter={data.length} />
              ),
          },
          {
            key: 'detail',
            label: (
              <span>
                📋 客户明细 <Text type="secondary">（{filterCount}）</Text>
              </span>
            ),
            children:
              data.length === 0 && !loading ? (
                <div className="board-empty">
                  <Empty
                    description={
                      <div>
                        <div style={{ marginBottom: 12 }}>还没有客户数据</div>
                        <Space>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                          >
                            新增客户
                          </Button>
                          <Button
                            icon={<UploadOutlined />}
                            onClick={() => setImportOpen(true)}
                          >
                            批量上传
                          </Button>
                        </Space>
                      </div>
                    }
                  />
                </div>
              ) : (
                <CustomerTable
                  data={filtered}
                  loading={loading}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onPreviewScreenshots={setPreviewRecord}
                />
              ),
          },
        ]}
      />

      <CustomerForm
        open={formOpen}
        mode={formMode}
        initial={editing}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <BulkImportModal
        open={importOpen}
        currentUser={currentUser}
        onCancel={() => setImportOpen(false)}
        onSubmit={handleBulkImport}
      />

      <ScreenshotPreviewModal
        open={!!previewRecord}
        record={previewRecord}
        onClose={() => setPreviewRecord(null)}
      />
    </div>
  )
}
