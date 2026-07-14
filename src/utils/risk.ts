import dayjs from 'dayjs'
import type { CustomerRecord } from '../components/CustomerBoard/constants'

export type RiskLevel = '高风险' | '中风险' | '低风险'

export interface RiskAlert {
  type: string
  level: RiskLevel
  reason: string
  suggestion: string
}

/**
 * 判断一条记录触发的所有预警
 */
export function detectRisks(r: CustomerRecord): RiskAlert[] {
  const alerts: RiskAlert[] = []
  const now = dayjs()

  // 1. 跟进超时
  const lastFollow = r.last_follow_up_at ? dayjs(r.last_follow_up_at) : null
  const staleDays = lastFollow ? now.diff(lastFollow, 'day') : 999
  if (staleDays > 7 && r.current_status !== '已开通' && r.current_status !== '无效线索') {
    alerts.push({
      type: '跟进超时',
      level: '中风险',
      reason: '该账号最近跟进时间已超过 7 天，存在推进停滞风险。',
      suggestion: '建议负责人尽快更新最新进展，或调整跟进策略。',
    })
  }

  // 2. 高预算卡住
  const budget = Number(r.monthly_budget || 0)
  if (budget >= 50000 && r.current_status !== '已开通') {
    alerts.push({
      type: '高预算卡住',
      level: '高风险',
      reason: '该账号预估月预算较高，但当前仍未开通，可能影响后续投放消耗。',
      suggestion: '建议启动高预算客户专项跟进，缩短开通周期。',
    })
  }

  // 3. 高优客户未推进
  if (
    (r.priority === 'P0' || r.priority === 'P1') &&
    (r.current_status === '未跟进' || r.current_status === '暂停推进')
  ) {
    alerts.push({
      type: '高优客户未推进',
      level: '高风险',
      reason: '该账号为 P0/P1 高优客户，但当前仍处于未跟进或暂停推进状态。',
      suggestion: '建议立即分配责任人并制定推进计划。',
    })
  }

  // 4. 素材审核失败
  if (r.creative_status === '审核拒绝') {
    alerts.push({
      type: '素材审核失败',
      level: '高风险',
      reason: '该账号素材状态为审核拒绝，需要尽快定位拒审原因并调整素材。',
      suggestion: '建议获取拒审详情、调整素材内容，重新提交审核。',
    })
  }

  // 5. 账户开通失败
  if (r.account_status === '开户失败') {
    alerts.push({
      type: '账户开通失败',
      level: '高风险',
      reason: '该账号广告账户状态为开户失败，需要排查开户资料或平台审核问题。',
      suggestion: '建议核对主体资质、开户材料，必要时联系平台侧协助。',
    })
  }

  // 6. 低准备度
  const score = r.readiness_score ?? 0
  if (score > 0 && score < 60) {
    alerts.push({
      type: '低准备度',
      level: '中风险',
      reason: '该账号投放准备度评分低于 60，暂不具备稳定进入测试投放的条件。',
      suggestion: '建议对照评分维度补齐短板（资料/账户/素材/预算）。',
    })
  }

  // 7. 已开户但素材未准备
  if (
    r.account_status === '已开户' &&
    (r.creative_status === '未准备' || r.creative_status === '制作中')
  ) {
    alerts.push({
      type: '已开户但素材未准备',
      level: '中风险',
      reason: '账户已开通，但素材尚未准备完成，投放启动存在延迟风险。',
      suggestion: '建议同步素材团队优先加急该账号素材制作与审核。',
    })
  }

  // 8. 高意向但未触达
  if (r.intent === '高' && r.current_status === '未跟进') {
    alerts.push({
      type: '高意向但未触达',
      level: '低风险',
      reason: '客户投放意向为高，但当前仍处于未跟进状态，存在意向流失风险。',
      suggestion: '建议渠道经理 24 小时内完成首次触达。',
    })
  }

  // 9. 高优客户未具备投放条件
  if (
    (r.priority === 'P0' || r.priority === 'P1') &&
    r.readiness_status &&
    r.readiness_status !== '可进入测试投放'
  ) {
    alerts.push({
      type: '高优未具备投放条件',
      level: '高风险',
      reason: `${r.priority} 高优客户当前投放准备状态为「${r.readiness_status}」，尚未具备进入测试投放的条件。`,
      suggestion: '建议对照投放准备检查逐项补齐，优先解决账户/素材/预算维度短板。',
    })
  }

  // 10. 预算明确但账户未开通
  const testBudget = Number(r.test_budget || 0)
  if (testBudget > 0 && r.account_status && r.account_status !== '已开户') {
    alerts.push({
      type: '预算明确但账户未开通',
      level: '中风险',
      reason: `已确认测试预算 ${testBudget.toLocaleString()} 元，但广告账户仍处于「${r.account_status}」状态，无法进入投放。`,
      suggestion: '建议加速开户流程，避免预算已确认却因账户未开通而错过投放窗口。',
    })
  }

  // 11. 高预算 + 审核卡住/资质卡审（增强现有规则）
  if (
    budget >= 50000 &&
    (r.current_status === '审核卡住' || r.block_type === '资质卡审')
  ) {
    alerts.push({
      type: '高预算卡在审核',
      level: '高风险',
      reason: `预估月预算 ${budget.toLocaleString()} 元，但当前${r.current_status === '审核卡住' ? '状态为「审核卡住」' : '卡点为「资质卡审」'}，投放启动被阻塞。`,
      suggestion: '建议启动跨部门专项，协同资质、审核团队优先处理。',
    })
  }

  return alerts
}

/**
 * 计算记录的最高预警等级
 */
export function highestRiskLevel(alerts: RiskAlert[]): RiskLevel | null {
  if (alerts.length === 0) return null
  if (alerts.some((a) => a.level === '高风险')) return '高风险'
  if (alerts.some((a) => a.level === '中风险')) return '中风险'
  return '低风险'
}

/**
 * 根据卡点/状态生成建议动作（用于待办中心）
 */
export function buildSuggestedAction(r: CustomerRecord): string {
  const alerts = detectRisks(r)

  // 优先按预警给建议
  if (alerts.length > 0) {
    return alerts[0].suggestion
  }

  // 按卡点类型
  if (r.block_type === '客户未回复') return '建议二次触达客户并记录反馈。'
  if (r.block_type === '材料缺失') return '建议同步材料清单并设置下一次跟进时间。'
  if (r.block_type === '资质卡审') return '建议补充资质说明或截图留痕。'
  if (r.block_type === '内部审核待处理') return '建议同步审核负责人并补充背景信息。'
  if (r.block_type === '素材准备问题') return '建议确认素材制作进度和审核要求。'
  if (r.block_type === '广告账户开通问题') return '建议排查开户资料、主体信息或平台审核问题。'

  // 按投放准备状态
  if (r.readiness_status === '可进入测试投放')
    return '建议进入小预算测试，并记录首轮测试结果。'

  return '建议按标准跟进流程继续推进。'
}

/**
 * AI 跟进建议生成（规则版，80-150 字）
 * 结构：客户画像 → 当前状态 → 投放准备结论 → 建议动作
 */
export function generateAiAdvice(r: CustomerRecord): string {
  const parts: string[] = []

  // 起手：优先级 + 预算
  const budget = Number(r.monthly_budget || 0)
  const budgetTxt =
    budget >= 100000 ? '预算规模较高' : budget >= 30000 ? '预算规模中等' : '预算规模偏小'

  parts.push(
    `该账号为 ${r.priority || '未定优先级'} 客户（${r.customer_scale || '体量未标注'}），${budgetTxt}（预估月预算约 ${budget.toLocaleString()} 元）。`,
  )

  // 投放准备摘要（引用 checkReadiness 结论）
  const summary: string[] = []
  if (r.account_status) summary.push(`账户${r.account_status}`)
  if (r.creative_status) summary.push(`素材${r.creative_status}`)
  const testBudget = Number(r.test_budget || 0)
  if (testBudget > 0) summary.push(`测试预算 ${testBudget.toLocaleString()} 元`)
  if (summary.length > 0) {
    parts.push(`当前状态：${r.current_status}，${summary.join('、')}。`)
  } else {
    parts.push(
      `当前状态：${r.current_status}${r.block_type && r.block_type !== '无卡点' ? `，卡点为「${r.block_type}」` : ''}。`,
    )
  }

  // 投放准备度
  const score = r.readiness_score ?? 0
  parts.push(
    `投放准备度评分 ${score} 分（${r.readiness_status || '未评估'}）。`,
  )

  // 具体建议
  const alerts = detectRisks(r)
  if (alerts.length > 0) {
    const top = alerts[0]
    parts.push(`建议：${top.suggestion}`)
  } else if (r.readiness_status === '可进入测试投放') {
    parts.push('建议：可进入小预算测试环节，控制单日预算并记录首轮测试数据以指导后续放量。')
  } else if (r.account_status === '开户中' && r.creative_status === '制作中') {
    parts.push(
      '建议：优先跟进开户进度，并同步素材制作与审核节奏，待账户开通且素材审核通过后，再进入小预算测试阶段。',
    )
  } else if (r.current_status === '跟进中') {
    parts.push('建议：保持每 2-3 个工作日更新一次进展，同步下一步动作和预期时间。')
  } else {
    parts.push('建议：按常规节奏推进，重点关注预算落地和素材筹备。')
  }

  // 兜底：加一句预警补充
  if (alerts.length > 1) {
    parts.push(
      `另需关注：${alerts
        .slice(1, 3)
        .map((a) => a.type)
        .join('、')}。`,
    )
  }

  return parts.join(' ')
}
