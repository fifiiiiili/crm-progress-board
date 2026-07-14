import { useState } from 'react'
import { Modal, Upload, Button, Table, Alert, Space, message, Tag } from 'antd'
import { UploadOutlined, DownloadOutlined, FileExcelOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import {
  EXCEL_HEADER_MAP,
  STATUS_OPTIONS,
  BLOCK_TYPE_OPTIONS,
  type CustomerRecord,
} from './constants'
import { existingProAccountIds } from '../../api'

interface Props {
  open: boolean
  currentUser: string
  onCancel: () => void
  onSubmit: (records: Omit<CustomerRecord, 'id'>[]) => Promise<void>
}

interface ParsedRow {
  raw: Record<string, unknown>
  record: Partial<CustomerRecord>
  errors: string[]
  isDuplicate?: boolean
}

const VALID_STATUS = new Set<string>(STATUS_OPTIONS.map((s) => s.value))
const VALID_BLOCK = new Set<string>(BLOCK_TYPE_OPTIONS.map((s) => s.value))

export default function BulkImportModal({ open, currentUser, onCancel, onSubmit }: Props) {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState<string>('')
  const [importing, setImporting] = useState(false)

  const reset = () => {
    setParsedRows([])
    setFileName('')
  }

  const handleClose = () => {
    reset()
    onCancel()
  }

  const parseValue = (row: Record<string, unknown>, cnKey: string): string => {
    const v = row[cnKey]
    if (v === undefined || v === null) return ''
    return String(v).trim()
  }

  const parseTime = (v: unknown): string | null => {
    if (!v) return null
    if (typeof v === 'number') {
      // Excel 序列号
      const d = XLSX.SSF.parse_date_code(v)
      if (d) {
        return dayjs(new Date(d.y, d.m - 1, d.d, d.H, d.M, d.S)).toISOString()
      }
    }
    const s = String(v).trim()
    if (!s) return null
    const d = dayjs(s)
    return d.isValid() ? d.toISOString() : null
  }

  const handleFile = async (file: File) => {
    try {
      setFileName(file.name)
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array', cellDates: false })
      const firstSheet = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' })

      if (!rows.length) {
        message.warning('文件为空或未识别到有效行')
        return false
      }

      // 检查表头
      const headers = Object.keys(rows[0])
      const knownHeaders = headers.filter((h) => EXCEL_HEADER_MAP[h])
      if (!knownHeaders.length) {
        message.error(
          '未识别到有效字段，请下载模板参考。识别字段：' +
            Object.keys(EXCEL_HEADER_MAP).slice(0, 5).join('、'),
        )
        return false
      }

      // 拼数据
      const parsed: ParsedRow[] = rows.map((raw) => {
        const record: Partial<CustomerRecord> = {}
        const errors: string[] = []

        for (const [cnKey, fieldKey] of Object.entries(EXCEL_HEADER_MAP)) {
          if (raw[cnKey] === undefined) continue
          const val = parseValue(raw, cnKey)
          if (!val) continue
          if (fieldKey === 'last_follow_up_at') {
            const t = parseTime(raw[cnKey])
            if (t) (record as Record<string, unknown>)[fieldKey] = t
          } else {
            ;(record as Record<string, unknown>)[fieldKey] = val
          }
        }

        // 必填校验
        if (!record.pro_account_id) errors.push('专业号 ID 为空')
        if (!record.customer_source) errors.push('客户来源为空')
        if (!record.pro_account_name) errors.push('专业号名称为空')
        if (!record.channel_manager) errors.push('渠道经理为空')
        if (!record.current_status) errors.push('当前状态为空')
        else if (!VALID_STATUS.has(record.current_status)) {
          errors.push(`当前状态「${record.current_status}」不在允许范围`)
        }
        if (record.block_type && !VALID_BLOCK.has(record.block_type)) {
          errors.push(`卡点类型「${record.block_type}」不在允许范围`)
        }

        return { raw, record, errors }
      })

      // 去重检查
      const validIds = parsed
        .filter((p) => !p.errors.length && p.record.pro_account_id)
        .map((p) => p.record.pro_account_id!)
      const existingIds = await existingProAccountIds(validIds)
      // 文件内自己也可能重复
      const seenInFile = new Set<string>()
      for (const p of parsed) {
        const id = p.record.pro_account_id
        if (!id) continue
        if (existingIds.has(id)) {
          p.isDuplicate = true
          p.errors.push('专业号 ID 在系统中已存在')
        } else if (seenInFile.has(id)) {
          p.isDuplicate = true
          p.errors.push('文件内重复的专业号 ID')
        } else {
          seenInFile.add(id)
        }
      }

      setParsedRows(parsed)
    } catch (e) {
      message.error('解析失败：' + (e instanceof Error ? e.message : String(e)))
    }
    return false // 阻止默认上传
  }

  const downloadTemplate = () => {
    const headers = Object.keys(EXCEL_HEADER_MAP)
    const sample: Record<string, string> = {}
    for (const h of headers) sample[h] = ''
    sample['客户来源'] = 'AM推荐'
    sample['专业号 ID'] = 'XHS_12345678'
    sample['专业号名称'] = '示例品牌'
    sample['国家/地区'] = '日本'
    sample['一级行业'] = '美妆个护'
    sample['二级行业'] = '护肤'
    sample['对应渠道经理'] = '张三'
    sample['当前状态'] = '未跟进'
    sample['卡点类型'] = '无卡点'
    sample['跟进情况'] = '首次触达'
    sample['下一步动作'] = '发送开通材料'
    sample['最近跟进时间'] = '2026-07-10 15:00'
    sample['备注'] = ''
    const ws = XLSX.utils.json_to_sheet([sample], { header: headers })
    // 设置列宽
    ;(ws['!cols'] as unknown as XLSX.ColInfo[]) = headers.map(() => ({ wch: 15 }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '客开进度')
    XLSX.writeFile(wb, '客开进度模板.xlsx')
  }

  const handleImport = async () => {
    const validRows = parsedRows.filter((p) => !p.errors.length)
    if (!validRows.length) {
      message.warning('没有可导入的有效行')
      return
    }
    setImporting(true)
    try {
      const records: Omit<CustomerRecord, 'id'>[] = validRows.map((p) => ({
        pro_account_id: p.record.pro_account_id!,
        customer_source: p.record.customer_source!,
        pro_account_name: p.record.pro_account_name!,
        country_region: p.record.country_region || null,
        industry_l1: p.record.industry_l1 || null,
        industry_l2: p.record.industry_l2 || null,
        channel_manager: p.record.channel_manager!,
        current_status: p.record.current_status!,
        block_type: p.record.block_type || null,
        follow_up_note: p.record.follow_up_note || null,
        next_action: p.record.next_action || null,
        last_follow_up_at: p.record.last_follow_up_at || null,
        chat_screenshots: null,
        remark: p.record.remark || null,
        source_type: '表格上传',
        creator: currentUser,
        author_name: currentUser,
      }))
      await onSubmit(records)
      message.success(`已导入 ${records.length} 条数据`)
      reset()
      onCancel()
    } catch (e) {
      message.error('导入失败：' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setImporting(false)
    }
  }

  const validCount = parsedRows.filter((p) => !p.errors.length).length
  const errorCount = parsedRows.length - validCount

  return (
    <Modal
      open={open}
      title={
        <span>
          <FileExcelOutlined /> 表格批量上传
        </span>
      }
      width={1000}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          取消
        </Button>,
        <Button
          key="import"
          type="primary"
          disabled={!validCount}
          loading={importing}
          onClick={handleImport}
        >
          导入 {validCount} 条有效数据
        </Button>,
      ]}
      destroyOnClose
      maskClosable={false}
      getContainer={() => document.body}
    >
      <Alert
        type="info"
        showIcon
        message="表格上传的数据将开启数据保护，导入后无法在页面删除，请仔细核对。"
        style={{ marginBottom: 12 }}
      />

      <Space style={{ marginBottom: 12 }} wrap>
        <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>
          下载模板
        </Button>
        <Upload
          accept=".xlsx,.xls,.csv"
          beforeUpload={handleFile}
          showUploadList={false}
          maxCount={1}
        >
          <Button icon={<UploadOutlined />} type="primary">
            选择文件 (.xlsx / .xls / .csv)
          </Button>
        </Upload>
        {fileName && <span style={{ color: '#55606b' }}>已选：{fileName}</span>}
      </Space>

      {parsedRows.length > 0 && (
        <>
          <Space style={{ marginBottom: 8 }}>
            <Tag color="success">有效：{validCount}</Tag>
            {errorCount > 0 && <Tag color="error">异常：{errorCount}</Tag>}
            <span style={{ color: '#8c9098' }}>共 {parsedRows.length} 行</span>
          </Space>

          <Table
            size="small"
            rowKey={(_r, i) => String(i)}
            dataSource={parsedRows}
            scroll={{ y: 320, x: 900 }}
            pagination={{ pageSize: 50, showSizeChanger: false }}
            columns={[
              {
                title: '状态',
                width: 70,
                render: (_, r) =>
                  r.errors.length ? (
                    <Tag color="error">异常</Tag>
                  ) : (
                    <Tag color="success">有效</Tag>
                  ),
              },
              {
                title: '专业号ID',
                dataIndex: ['record', 'pro_account_id'],
                width: 130,
                ellipsis: true,
              },
              {
                title: '专业号名称',
                dataIndex: ['record', 'pro_account_name'],
                width: 140,
                ellipsis: true,
              },
              {
                title: '客户来源',
                dataIndex: ['record', 'customer_source'],
                width: 110,
                ellipsis: true,
              },
              {
                title: '渠道经理',
                dataIndex: ['record', 'channel_manager'],
                width: 100,
                ellipsis: true,
              },
              {
                title: '当前状态',
                dataIndex: ['record', 'current_status'],
                width: 100,
                ellipsis: true,
              },
              {
                title: '异常原因',
                dataIndex: 'errors',
                render: (errs: string[]) =>
                  errs.length ? (
                    <span style={{ color: '#d4380d', fontSize: 12 }}>{errs.join('；')}</span>
                  ) : (
                    <span style={{ color: '#8c9098' }}>—</span>
                  ),
              },
            ]}
          />
        </>
      )}
    </Modal>
  )
}
