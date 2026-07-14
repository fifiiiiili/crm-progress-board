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
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
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
import TodoCenter from './TodoCenter'
import RiskAlerts from './RiskAlerts'
import RetroPage from './RetroPage'
import AccountDetailDrawer from './AccountDetailDrawer'
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
  appendFollowUpRecord,
  onStorageModeChange,
  recalcAllReadiness,
} from '../../api'
import { detectRisks } from '../../utils/risk'
import dayjsPluginRelative from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import './index.css'

dayjs.extend(dayjsPluginRelative)
dayjs.locale('zh-cn')

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
  'platform',
  'account_status',
  'creative_status',
  'creative_count',
  'creative_review',
  'test_budget',
  'launch_stage',
  'first_test_date',
  'readiness_score',
  'readiness_status',
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
        f === 'lead_created_at' ||
        f === 'first_test_date'
      ) {
        obj[label] = v ? dayjs(v as string).format('YYYY-MM-DD HH:mm') : ''
      } else if (typeof v === 'number') {
        obj[label] = v
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
  const [activeTab, setActiveTab] = useState<'overview' | 'detail' | 'todo' | 'risk' | 'retro'>(
    'overview',
  )
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add')
  const [editing, setEditing] = useState<CustomerRecord | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [previewRecord, setPreviewRecord] = useState<CustomerRecord | null>(null)
  const [detailRecord, setDetailRecord] = useState<CustomerRecord | null>(null)
  const [followUpModal, setFollowUpModal] = useState<CustomerRecord | null>(null)
  const [followUpForm] = Form.useForm()
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [storageMode, setStorageMode] = useState<'localStorage' | 'memory'>('localStorage')
  const [storageReason, setStorageReason] = useState<string | null>(null)

  const currentUser = 'Demo User'

  useEffect(() => {
    const unsub = onStorageModeChange((mode, reason) => {
      setStorageMode(mode)
      setStorageReason(reason)
    })
    return unsub
  }, [])

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
      if (!inList(filter.platform, r.platform)) return false
      if (!inList(filter.account_status, r.account_status)) return false
      if (!inList(filter.creative_status, r.creative_status)) return false
      if (!inList(filter.launch_stage, r.launch_stage)) return false
      if (!inList(filter.readiness_status, r.readiness_status)) return false
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
        ...values,
        pro_account_id: proId,
        current_status: values.current_status || '未跟进',
        source_type: '手动新增',
        creator: currentUser,
        author_name: currentUser,
        last_follow_up_at: values.last_follow_up_at || now,
        lead_created_at: values.lead_created_at || now,
      } as Omit<CustomerRecord, 'id'>)
      message.success('新增成功')
    } else if (editing?.id != null) {
      await updateCustomerById(editing.id, values)
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

  const handleViewDetail = (r: CustomerRecord) => setDetailRecord(r)

  const handleAddFollowUp = (r: CustomerRecord) => {
    setFollowUpModal(r)
    followUpForm.resetFields()
    followUpForm.setFieldsValue({
      time: dayjs(),
      operator: currentUser,
      action: '客户触达',
    })
  }

  const handleFollowUpSubmit = async () => {
    if (!followUpModal?.id) return
    const v = await followUpForm.validateFields()
    await appendFollowUpRecord(followUpModal.id, {
      time: v.time.toISOString(),
      operator: v.operator,
      action: v.action,
      note: v.note,
    })
    message.success('跟进记录已添加')
    setFollowUpModal(null)
    await load()
    // 更新 drawer 里的数据
    if (detailRecord?.id === followUpModal.id) {
      const rows = await fetchAllCustomers()
      const found = rows.find((r) => r.id === followUpModal.id)
      if (found) setDetailRecord(found)
    }
  }

  // 导出预筛选列表
  const highPriorityList = useMemo(
    () =>
      filtered.filter(
        (r) =>
          (r.priority === 'P0' || r.priority === 'P1') &&
          r.current_status !== '已开通' &&
          r.current_status !== '无效线索',
      ),
    [filtered],
  )
  const staleList = useMemo(() => {
    const sevenDaysAgo = dayjs().subtract(7, 'day')
    return filtered.filter((r) => {
      if (r.current_status === '已开通' || r.current_status === '无效线索') return false
      const t = r.last_follow_up_at || r.updated_at || r.created_at
      if (!t) return true
      return dayjs(t).isBefore(sevenDaysAgo)
    })
  }, [filtered])
  const blockedList = useMemo(
    () =>
      filtered.filter(
        (r) =>
          r.current_status === '审核卡住' ||
          r.block_type === '资质卡审' ||
          r.block_type === '内部审核待处理',
      ),
    [filtered],
  )
  const riskList = useMemo(() => filtered.filter((r) => detectRisks(r).length > 0), [filtered])

  const handleExport = (
    scope: 'filtered' | 'all' | 'highPriority' | 'stale' | 'blocked' | 'risk',
  ) => {
    let rows: CustomerRecord[] = []
    let prefix = ''
    if (scope === 'filtered') { rows = filtered; prefix = '客户明细_筛选结果' }
    else if (scope === 'all') { rows = data; prefix = '客户明细_全部' }
    else if (scope === 'highPriority') { rows = highPriorityList; prefix = '高优先级待跟进客户' }
    else if (scope === 'stale') { rows = staleList; prefix = '超7天未更新客户' }
    else if (scope === 'blocked') { rows = blockedList; prefix = '审核卡住客户' }
    else { rows = riskList; prefix = '异常预警客户' }
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
    { key: 'highPriority', label: `高优先级待跟进（${highPriorityList.length}）` },
    { key: 'stale', label: `超 7 天未更新（${staleList.length}）` },
    { key: 'blocked', label: `审核卡住（${blockedList.length}）` },
    { key: 'risk', label: `异常预警客户（${riskList.length}）` },
  ]

  const handleRefreshBoard = useCallback(async () => {
    setLoading(true)
    try {
      const changed = await recalcAllReadiness()
      const rows = await fetchAllCustomers()
      setData(rows)
      setUpdatedAt(getDataUpdatedAt())
      if (changed > 0) {
        message.success(`刷新完成，重算了 ${changed} 个账号的准备度评分`)
      } else {
        message.success('刷新完成，看板已重新计算')
      }
    } catch (e) {
      message.error('刷新失败：' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setLoading(false)
    }
  }, [message])

  const handleResetDemo = () => {
    modal.confirm({
      title: '确认恢复演示数据吗？',
      content: (
        <div>
          <div>
            该操作会清空当前浏览器中保存的手动新增和编辑记录，并重新加载 2000 条模拟数据。
          </div>
          <div style={{ color: '#8c9098', fontSize: 12, marginTop: 6 }}>
            仅影响你自己的浏览器，不影响其他访客。
          </div>
        </div>
      ),
      okText: '确认恢复',
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
      {storageMode === 'memory' && (
        <Alert
          type="warning"
          showIcon
          banner
          message={
            <span>
              <strong>⚠️ 当前浏览器存储空间不足，已进入演示模式</strong>
              &nbsp;·&nbsp;{storageReason || '数据仅在本次会话内有效，刷新页面会重新加载初始 2000 条模拟数据；你所做的新增、编辑、删除操作在本次会话内可见，但不会持久化到浏览器。'}
              &nbsp;建议使用 Chrome / Edge 桌面版访问以获得完整体验。
            </span>
          }
          style={{ marginBottom: 12 }}
        />
      )}

      <Alert
        type="info"
        showIcon
        banner
        message={
          <span>
            <strong>Demo 演示版</strong>
            &nbsp;·&nbsp;本项目使用模拟数据，模拟广告业务中客户开通、账户准备、资料审核、素材准备、状态跟进、异常预警和过程复盘的管理场景，不包含任何真实客户或平台内部信息。
            数据仅保存在你当前浏览器的 localStorage 中，不同浏览器互相隔离。
          </span>
        }
        action={
          <Space>
            <Button size="small" icon={<RedoOutlined />} onClick={handleResetDemo}>
              恢复演示数据
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
            模拟广告业务场景下的多客户、多账户、多行业并行推进：统一查看客户状态、识别重点客户、发现异常风险、生成跟进建议、沉淀复盘经验
          </Paragraph>
        </div>
        <Space wrap>
          <Tooltip
            title={
              updatedAt
                ? `数据最后更新：${dayjs(updatedAt).format('YYYY-MM-DD HH:mm:ss')}`
                : '尚未更新'
            }
          >
            <Tag
              icon={<ClockCircleOutlined />}
              color="default"
              style={{ padding: '4px 10px' }}
            >
              数据更新时间：{updatedAt ? dayjs(updatedAt).format('YYYY-MM-DD HH:mm:ss') : '—'}
              {updatedAt ? ` · ${dayjs(updatedAt).fromNow()}` : ''}
            </Tag>
          </Tooltip>
          <Button icon={<ReloadOutlined />} onClick={handleRefreshBoard} loading={loading}>
            刷新看板
          </Button>
          <Button icon={<RedoOutlined />} onClick={handleResetDemo}>
            恢复演示数据
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>
            批量上传
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增客户
          </Button>
          <Dropdown
            menu={{ items: exportMenuItems, onClick: ({ key }) => handleExport(key as never) }}
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
        onChange={(k) => setActiveTab(k as never)}
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
                          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                            新增客户
                          </Button>
                          <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>
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
                  onViewDetail={handleViewDetail}
                />
              ),
          },
          {
            key: 'todo',
            label: <span>✅ 待办中心</span>,
            children: <TodoCenter records={filtered} onViewDetail={handleViewDetail} />,
          },
          {
            key: 'risk',
            label: <span>🚨 异常预警</span>,
            children: <RiskAlerts records={filtered} onViewDetail={handleViewDetail} />,
          },
          {
            key: 'retro',
            label: <span>📚 复盘沉淀</span>,
            children: <RetroPage currentUser={currentUser} />,
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

      <AccountDetailDrawer
        open={!!detailRecord}
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
        onEdit={(r) => {
          setDetailRecord(null)
          handleEdit(r)
        }}
        onAddFollowUp={handleAddFollowUp}
      />

      <Modal
        open={!!followUpModal}
        title={`更新跟进 - ${followUpModal?.pro_account_name || ''}`}
        onCancel={() => setFollowUpModal(null)}
        onOk={handleFollowUpSubmit}
        okText="保存"
        cancelText="取消"
        width={560}
        destroyOnClose
      >
        <Form form={followUpForm} layout="vertical" preserve={false}>
          <Form.Item
            label="跟进时间"
            name="time"
            rules={[{ required: true }]}
          >
            <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
          </Form.Item>
          <Form.Item label="跟进人" name="operator" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="跟进动作" name="action" rules={[{ required: true }]}>
            <Select
              options={[
                '客户触达',
                '材料跟进',
                '素材沟通',
                '账户跟进',
                '内部同步',
                '风险提醒',
                '其他',
              ].map((v) => ({ label: v, value: v }))}
            />
          </Form.Item>
          <Form.Item label="跟进说明" name="note" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="简述本次跟进内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
