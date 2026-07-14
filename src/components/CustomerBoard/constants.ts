// 广告客户开通与投放准备进度管理面板 - 常量定义
// 所有数据均为模拟数据，不含真实客户或平台内部信息

// ============== 枚举类型 ==============

export type StatusValue =
  | '未跟进'
  | '已触达'
  | '跟进中'
  | '待客户补充材料'
  | '待内部审核'
  | '审核卡住'
  | '已开通'
  | '暂停推进'
  | '无效线索'

export type BlockTypeValue =
  | '无卡点'
  | '客户未回复'
  | '材料缺失'
  | '资质卡审'
  | '行业准入限制'
  | '账号认证问题'
  | '广告账户开通问题'
  | '素材准备问题'
  | '渠道经理待跟进'
  | '内部审核待处理'
  | '其他'

export type SourceTypeValue = '表格上传' | '手动新增' | '模拟数据'

export type CustomerScaleValue = '大客户' | '中客户' | '小客户' | '长尾客户'

export type PriorityValue = 'P0' | 'P1' | 'P2' | 'P3'

export type IntentValue = '高' | '中' | '低' | '暂无明确意向'

export type PlatformValue = '巨量引擎' | '腾讯广告' | '快手' | 'B站' | '小红书' | '其他'

export type AccountStatusValue = '未开户' | '开户中' | '已开户' | '开户失败'

export type CreativeStatusValue =
  | '未准备'
  | '制作中'
  | '已上传'
  | '审核通过'
  | '审核拒绝'
  | '部分通过'

export type CreativeReviewValue = '未提交' | '通过' | '拒绝' | '部分通过'

export type LaunchStageValue = '待准备' | '待测试' | '小预算测试' | '放量中' | '暂停' | '复盘中'

export type ReadinessStatusValue =
  | '可进入测试投放'
  | '基本就绪，仍需补充'
  | '准备不足'
  | '暂不适合推进'

// ============== 选项列表 ==============

export const STATUS_OPTIONS: StatusValue[] = [
  '未跟进',
  '已触达',
  '跟进中',
  '待客户补充材料',
  '待内部审核',
  '审核卡住',
  '已开通',
  '暂停推进',
  '无效线索',
]

export const BLOCK_TYPE_OPTIONS: BlockTypeValue[] = [
  '无卡点',
  '客户未回复',
  '材料缺失',
  '资质卡审',
  '行业准入限制',
  '账号认证问题',
  '广告账户开通问题',
  '素材准备问题',
  '渠道经理待跟进',
  '内部审核待处理',
  '其他',
]

export const SOURCE_TYPE_OPTIONS: SourceTypeValue[] = ['表格上传', '手动新增', '模拟数据']

export const CUSTOMER_SCALE_OPTIONS: CustomerScaleValue[] = ['大客户', '中客户', '小客户', '长尾客户']

export const PRIORITY_OPTIONS: PriorityValue[] = ['P0', 'P1', 'P2', 'P3']

export const INTENT_OPTIONS: IntentValue[] = ['高', '中', '低', '暂无明确意向']

export const PLATFORM_OPTIONS: PlatformValue[] = ['巨量引擎', '腾讯广告', '快手', 'B站', '小红书', '其他']

export const ACCOUNT_STATUS_OPTIONS: AccountStatusValue[] = ['未开户', '开户中', '已开户', '开户失败']

export const CREATIVE_STATUS_OPTIONS: CreativeStatusValue[] = [
  '未准备',
  '制作中',
  '已上传',
  '审核通过',
  '审核拒绝',
  '部分通过',
]

export const CREATIVE_REVIEW_OPTIONS: CreativeReviewValue[] = ['未提交', '通过', '拒绝', '部分通过']

export const LAUNCH_STAGE_OPTIONS: LaunchStageValue[] = [
  '待准备',
  '待测试',
  '小预算测试',
  '放量中',
  '暂停',
  '复盘中',
]

export const READINESS_STATUS_OPTIONS: ReadinessStatusValue[] = [
  '可进入测试投放',
  '基本就绪，仍需补充',
  '准备不足',
  '暂不适合推进',
]

// ============== 颜色映射 ==============

export const STATUS_COLOR_MAP: Record<StatusValue, string> = {
  未跟进: 'default',
  已触达: 'blue',
  跟进中: 'processing',
  待客户补充材料: 'orange',
  待内部审核: 'purple',
  审核卡住: 'red',
  已开通: 'success',
  暂停推进: 'warning',
  无效线索: 'default',
}

export const BLOCK_TYPE_COLOR_MAP: Record<BlockTypeValue, string> = {
  无卡点: 'success',
  客户未回复: 'orange',
  材料缺失: 'gold',
  资质卡审: 'red',
  行业准入限制: 'volcano',
  账号认证问题: 'magenta',
  广告账户开通问题: 'red',
  素材准备问题: 'gold',
  渠道经理待跟进: 'blue',
  内部审核待处理: 'purple',
  其他: 'default',
}

export const SOURCE_COLOR_MAP: Record<SourceTypeValue, string> = {
  表格上传: 'blue',
  手动新增: 'green',
  模拟数据: 'purple',
}

export const SCALE_COLOR_MAP: Record<CustomerScaleValue, string> = {
  大客户: 'red',
  中客户: 'orange',
  小客户: 'blue',
  长尾客户: 'default',
}

export const PRIORITY_COLOR_MAP: Record<PriorityValue, string> = {
  P0: 'red',
  P1: 'volcano',
  P2: 'blue',
  P3: 'default',
}

export const INTENT_COLOR_MAP: Record<IntentValue, string> = {
  高: 'red',
  中: 'orange',
  低: 'blue',
  暂无明确意向: 'default',
}

export const PLATFORM_COLOR_MAP: Record<PlatformValue, string> = {
  巨量引擎: 'volcano',
  腾讯广告: 'blue',
  快手: 'gold',
  B站: 'magenta',
  小红书: 'red',
  其他: 'default',
}

export const ACCOUNT_STATUS_COLOR_MAP: Record<AccountStatusValue, string> = {
  未开户: 'default',
  开户中: 'processing',
  已开户: 'success',
  开户失败: 'error',
}

export const CREATIVE_STATUS_COLOR_MAP: Record<CreativeStatusValue, string> = {
  未准备: 'default',
  制作中: 'processing',
  已上传: 'blue',
  审核通过: 'success',
  审核拒绝: 'error',
  部分通过: 'orange',
}

export const LAUNCH_STAGE_COLOR_MAP: Record<LaunchStageValue, string> = {
  待准备: 'default',
  待测试: 'blue',
  小预算测试: 'processing',
  放量中: 'success',
  暂停: 'warning',
  复盘中: 'purple',
}

export const READINESS_COLOR_MAP: Record<ReadinessStatusValue, string> = {
  可进入测试投放: 'success',
  '基本就绪，仍需补充': 'processing',
  准备不足: 'warning',
  暂不适合推进: 'default',
}

export const RISK_LEVEL_COLOR_MAP: Record<string, string> = {
  高风险: 'red',
  中风险: 'orange',
  低风险: 'blue',
}

// ============== 数据接口 ==============

export interface ChatScreenshot {
  url: string
  caption?: string
  uploadedAt?: string
}

export interface FollowUpRecord {
  time: string
  operator: string
  action: string
  note: string
}

export interface CustomerRecord {
  id?: number
  // 基础信息
  customer_source: string
  pro_account_id: string
  pro_account_name: string
  country_region?: string | null
  industry_l1?: string | null
  industry_l2?: string | null
  channel_manager: string
  customer_scale?: CustomerScaleValue | null
  monthly_budget?: number | null
  priority?: PriorityValue | null
  intent?: IntentValue | null
  // 状态
  current_status: StatusValue
  block_type?: BlockTypeValue | null
  follow_up_note?: string | null
  next_action?: string | null
  last_follow_up_at?: string | null
  lead_created_at?: string | null
  chat_screenshots?: ChatScreenshot[] | null
  remark?: string | null
  // 元数据
  source_type: SourceTypeValue
  creator: string
  author_name?: string
  created_at?: string
  updated_at?: string
  // 投放准备
  platform?: PlatformValue | null
  account_status?: AccountStatusValue | null
  creative_status?: CreativeStatusValue | null
  creative_count?: number | null
  creative_review?: CreativeReviewValue | null
  test_budget?: number | null
  launch_stage?: LaunchStageValue | null
  first_test_date?: string | null
  readiness_score?: number | null
  readiness_status?: ReadinessStatusValue | null
  // 跟进记录
  follow_up_records?: FollowUpRecord[] | null
}

export interface RetroRecord {
  id?: number
  case_type: string
  related_account_id?: string | null
  related_account_name?: string | null
  industry?: string | null
  problem_bg: string
  action_taken: string
  result: string
  reusable_experience: string
  recorder: string
  recorded_at?: string
}

// ============== Excel 表头映射 ==============

export const EXCEL_HEADER_MAP: Record<string, keyof CustomerRecord> = {
  客户来源: 'customer_source',
  '账号ID': 'pro_account_id',
  '账号 ID': 'pro_account_id',
  账号名称: 'pro_account_name',
  '国家/地区': 'country_region',
  一级行业: 'industry_l1',
  二级行业: 'industry_l2',
  对应渠道经理: 'channel_manager',
  客户体量: 'customer_scale',
  预估月预算: 'monthly_budget',
  客户优先级: 'priority',
  投放意向: 'intent',
  当前状态: 'current_status',
  卡点类型: 'block_type',
  跟进情况: 'follow_up_note',
  下一步动作: 'next_action',
  最近跟进时间: 'last_follow_up_at',
  线索创建时间: 'lead_created_at',
  备注: 'remark',
  投放平台: 'platform',
  广告账户状态: 'account_status',
  素材状态: 'creative_status',
  素材数量: 'creative_count',
  素材审核结果: 'creative_review',
  测试预算: 'test_budget',
  投放阶段: 'launch_stage',
  首轮测试日期: 'first_test_date',
}

export const FIELD_TO_LABEL: Partial<Record<keyof CustomerRecord, string>> = {
  customer_source: '客户来源',
  pro_account_id: '账号ID',
  pro_account_name: '账号名称',
  country_region: '国家/地区',
  industry_l1: '一级行业',
  industry_l2: '二级行业',
  channel_manager: '对应渠道经理',
  customer_scale: '客户体量',
  monthly_budget: '预估月预算',
  priority: '客户优先级',
  intent: '投放意向',
  current_status: '当前状态',
  block_type: '卡点类型',
  follow_up_note: '跟进情况',
  next_action: '下一步动作',
  last_follow_up_at: '最近跟进时间',
  lead_created_at: '线索创建时间',
  remark: '备注',
  source_type: '数据来源类型',
  creator: '创建人',
  created_at: '创建时间',
  updated_at: '更新时间',
  platform: '投放平台',
  account_status: '广告账户状态',
  creative_status: '素材状态',
  creative_count: '素材数量',
  creative_review: '素材审核结果',
  test_budget: '测试预算',
  launch_stage: '投放阶段',
  first_test_date: '首轮测试日期',
  readiness_score: '投放准备度评分',
  readiness_status: '投放准备状态',
}
