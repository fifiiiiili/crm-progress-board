/**
 * 客开进度看板 — 常量与配置
 */

export const STATUS_OPTIONS = [
  { value: '未跟进', color: 'default' },
  { value: '已触达', color: 'blue' },
  { value: '跟进中', color: 'processing' },
  { value: '待客户补充材料', color: 'gold' },
  { value: '待内部审核', color: 'geekblue' },
  { value: '审核卡住', color: 'volcano' },
  { value: '已开通', color: 'success' },
  { value: '暂停推进', color: 'default' },
  { value: '无效线索', color: 'error' },
] as const

export const BLOCK_TYPE_OPTIONS = [
  { value: '无卡点', color: 'success' },
  { value: '客户未回复', color: 'default' },
  { value: '材料缺失', color: 'gold' },
  { value: '资质卡审', color: 'orange' },
  { value: '行业准入限制', color: 'red' },
  { value: '专业号认证问题', color: 'volcano' },
  { value: '聚光开户问题', color: 'volcano' },
  { value: '渠道经理待跟进', color: 'blue' },
  { value: '内部审核待处理', color: 'geekblue' },
  { value: '其他', color: 'default' },
] as const

export const SOURCE_TYPE_OPTIONS = [
  { value: '表格上传', color: 'processing' },
  { value: '手动新增', color: 'success' },
] as const

export type StatusValue = (typeof STATUS_OPTIONS)[number]['value']
export type BlockTypeValue = (typeof BLOCK_TYPE_OPTIONS)[number]['value']
export type SourceTypeValue = (typeof SOURCE_TYPE_OPTIONS)[number]['value']

// 状态显色
export const STATUS_COLOR_MAP = Object.fromEntries(
  STATUS_OPTIONS.map((s) => [s.value, s.color]),
) as Record<string, string>

export const BLOCK_COLOR_MAP = Object.fromEntries(
  BLOCK_TYPE_OPTIONS.map((s) => [s.value, s.color]),
) as Record<string, string>

// Excel 批量上传字段映射（表头 → 数据字段）
export const EXCEL_HEADER_MAP: Record<string, string> = {
  客户来源: 'customer_source',
  专业号ID: 'pro_account_id',
  '专业号 ID': 'pro_account_id',
  专业号名称: 'pro_account_name',
  '国家/地区': 'country_region',
  国家地区: 'country_region',
  一级行业: 'industry_l1',
  二级行业: 'industry_l2',
  对应渠道经理: 'channel_manager',
  渠道经理: 'channel_manager',
  当前状态: 'current_status',
  卡点类型: 'block_type',
  跟进情况: 'follow_up_note',
  下一步动作: 'next_action',
  最近跟进时间: 'last_follow_up_at',
  备注: 'remark',
}

// 反向映射（导出用）
export const FIELD_TO_LABEL: Record<string, string> = {
  customer_source: '客户来源',
  pro_account_id: '专业号ID',
  pro_account_name: '专业号名称',
  country_region: '国家/地区',
  industry_l1: '一级行业',
  industry_l2: '二级行业',
  channel_manager: '对应渠道经理',
  current_status: '当前状态',
  block_type: '卡点类型',
  follow_up_note: '跟进情况',
  next_action: '下一步动作',
  last_follow_up_at: '最近跟进时间',
  remark: '备注',
  source_type: '数据来源类型',
  creator: '创建人',
  created_at: '创建时间',
  updated_at: '更新时间',
}

export interface CustomerRecord {
  id?: number
  pro_account_id: string
  customer_source: string
  pro_account_name: string
  country_region?: string | null
  industry_l1?: string | null
  industry_l2?: string | null
  channel_manager: string
  current_status: string
  block_type?: string | null
  follow_up_note?: string | null
  next_action?: string | null
  last_follow_up_at?: string | null
  chat_screenshots?: ChatScreenshot[] | null
  remark?: string | null
  source_type: '表格上传' | '手动新增'
  creator?: string | null
  author_name?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface ChatScreenshot {
  /** base64 dataURL 或 http URL */
  url: string
  /** 简短说明 */
  caption?: string
  /** 上传时间 */
  uploadedAt?: string
}
