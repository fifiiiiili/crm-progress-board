import type {
  CustomerRecord,
  ReadinessStatusValue,
} from '../components/CustomerBoard/constants'

/**
 * 投放准备度评分算法
 * 5 个维度，各 20 分，总分 100
 */
export function calcReadinessScore(r: Partial<CustomerRecord>): number {
  let score = 0

  // 1. 客户基础信息完整
  if (
    r.pro_account_id &&
    r.pro_account_name &&
    r.country_region &&
    r.industry_l1 &&
    r.channel_manager
  ) {
    score += 20
  }

  // 2. 广告账户状态
  if (r.account_status === '已开户') score += 20
  else if (r.account_status === '开户中') score += 10

  // 3. 材料/资质状态
  const hasMaterialIssue =
    r.current_status === '待客户补充材料' || r.current_status === '审核卡住'
  const hasBlockIssue = r.block_type === '材料缺失' || r.block_type === '资质卡审'
  if (!hasMaterialIssue && !hasBlockIssue) score += 20
  else if (
    r.current_status === '待客户补充材料' &&
    r.block_type !== '资质卡审' &&
    r.block_type !== '材料缺失'
  )
    score += 10
  // 严重缺失 0

  // 4. 素材状态
  if (r.creative_status === '审核通过') score += 20
  else if (r.creative_status === '已上传' || r.creative_status === '部分通过') score += 10

  // 5. 预算明确度
  const budget = Number(r.monthly_budget || 0)
  if (budget > 0 && (r.intent === '高' || r.intent === '中')) score += 20
  else if (budget > 0 && r.intent === '低') score += 10

  return score
}

export function scoreToStatus(score: number): ReadinessStatusValue {
  if (score >= 80) return '可进入测试投放'
  if (score >= 60) return '基本就绪，仍需补充'
  if (score >= 40) return '准备不足'
  return '暂不适合推进'
}

/**
 * 计算并写回评分和状态到记录
 */
export function withReadiness<T extends Partial<CustomerRecord>>(r: T): T {
  const score = calcReadinessScore(r)
  return {
    ...r,
    readiness_score: score,
    readiness_status: scoreToStatus(score),
  }
}

// ============== 投放准备检查（7 项） ==============

export type CheckStatus = '已完成' | '未完成' | '需关注'
export type CheckConclusion = '可进入测试投放' | '准备中' | '暂不建议投放'

export interface ReadinessCheckItem {
  key: string
  label: string
  status: CheckStatus
  note: string
  suggestion: string
}

export interface ReadinessCheckResult {
  items: ReadinessCheckItem[]
  conclusion: CheckConclusion
  conclusionReason: string
  score: number
  scoreStatus: ReadinessStatusValue
  passedCount: number
  totalCount: number
}

export function checkReadiness(r: Partial<CustomerRecord>): ReadinessCheckResult {
  const items: ReadinessCheckItem[] = []

  // 1. 客户基础信息是否完整
  const baseOk = !!(
    r.pro_account_id &&
    r.pro_account_name &&
    r.country_region &&
    r.industry_l1 &&
    r.channel_manager
  )
  items.push({
    key: 'base_info',
    label: '客户基础信息完整',
    status: baseOk ? '已完成' : '未完成',
    note: baseOk
      ? '账号 ID、名称、国家/地区、行业、负责人均已登记'
      : '存在必填基础字段为空',
    suggestion: baseOk ? '' : '补齐国家/地区、行业、负责人等基础信息',
  })

  // 2. 广告账户是否已开通
  const accountStatus = r.account_status
  const accountOk = accountStatus === '已开户'
  const accountAttn = accountStatus === '开户中'
  items.push({
    key: 'account_open',
    label: '广告账户已开通',
    status: accountOk ? '已完成' : accountAttn ? '需关注' : '未完成',
    note: accountStatus ? `当前状态：${accountStatus}` : '未登记账户开通状态',
    suggestion: accountOk
      ? ''
      : accountAttn
      ? '跟进平台开户审核进度，预计完成时间同步给负责人'
      : accountStatus === '开户失败'
      ? '排查开户资料/主体信息，重新提交开户'
      : '尽快启动广告账户开通流程',
  })

  // 3. 是否存在材料或资质卡点
  const hasBlocker =
    r.block_type === '材料缺失' ||
    r.block_type === '资质卡审' ||
    r.current_status === '审核卡住'
  const partialBlocker = r.current_status === '待客户补充材料'
  items.push({
    key: 'no_material_block',
    label: '无材料/资质卡点',
    status: hasBlocker ? '未完成' : partialBlocker ? '需关注' : '已完成',
    note: hasBlocker
      ? `当前存在卡点：${r.block_type || r.current_status}`
      : partialBlocker
      ? '客户需补充材料，尚未阻断但需关注'
      : '无核心卡点',
    suggestion: hasBlocker
      ? '同步材料清单或资质说明给客户，缩短卡审周期'
      : partialBlocker
      ? '设置材料补充提醒和二次跟进节点'
      : '',
  })

  // 4. 素材是否已准备
  const cs = r.creative_status
  const creativePrepared =
    cs === '审核通过' || cs === '已上传' || cs === '已提交审核' || cs === '部分通过'
  const creativeInProgress = cs === '制作中'
  items.push({
    key: 'creative_ready',
    label: '素材已准备',
    status: creativePrepared ? '已完成' : creativeInProgress ? '需关注' : '未完成',
    note: cs ? `当前状态：${cs}` : '未登记素材状态',
    suggestion: creativePrepared
      ? ''
      : creativeInProgress
      ? '跟进素材制作进度，明确提交审核时间'
      : '启动素材制作或获取客户提供的原始素材',
  })

  // 5. 素材是否审核通过
  const creativeApproved = cs === '审核通过' || cs === '部分通过'
  const creativeRejected = cs === '审核拒绝'
  items.push({
    key: 'creative_approved',
    label: '素材审核通过',
    status: creativeApproved ? '已完成' : creativeRejected ? '未完成' : '需关注',
    note: creativeRejected
      ? '素材审核被拒绝，需调整后重新提交'
      : creativeApproved
      ? cs === '部分通过'
        ? '部分素材通过，可先用通过素材上线'
        : '素材已全部审核通过'
      : '素材尚未进入审核或审核中',
    suggestion: creativeRejected
      ? '获取拒审详情、调整素材后重新提交审核'
      : creativeApproved
      ? ''
      : '推进素材提交审核，跟进平台审核结果',
  })

  // 6. 测试预算是否明确
  const testBudget = Number(r.test_budget || 0)
  const monthlyBudget = Number(r.monthly_budget || 0)
  const budgetClear = testBudget > 0
  const budgetPartial = !budgetClear && monthlyBudget > 0
  items.push({
    key: 'budget_clear',
    label: '测试预算明确',
    status: budgetClear ? '已完成' : budgetPartial ? '需关注' : '未完成',
    note: budgetClear
      ? `测试预算：${testBudget.toLocaleString()} 元`
      : budgetPartial
      ? `暂未确认测试预算，但预估月预算约 ${monthlyBudget.toLocaleString()} 元`
      : '暂未确认预算',
    suggestion: budgetClear
      ? ''
      : budgetPartial
      ? '与客户确认首轮测试预算金额和测试周期'
      : '沟通预算规划并明确测试预算',
  })

  // 7. 下一步动作是否明确
  const nextAction = (r.next_action || '').trim()
  const nextActionClear = nextAction.length > 0
  items.push({
    key: 'next_action',
    label: '下一步动作明确',
    status: nextActionClear ? '已完成' : '未完成',
    note: nextActionClear ? nextAction : '未登记下一步动作',
    suggestion: nextActionClear ? '' : '在跟进记录中登记下一步动作和预期完成时间',
  })

  // 根据检查项自动生成结论
  const passedCount = items.filter((i) => i.status === '已完成').length
  const totalCount = items.length

  let conclusion: CheckConclusion
  let conclusionReason: string

  const criticalUnpaid =
    !accountOk || creativeRejected || hasBlocker || !budgetClear
  const almostReady =
    accountOk && !hasBlocker && (creativePrepared || creativeInProgress) && (budgetClear || budgetPartial)

  if (accountOk && !hasBlocker && creativeApproved && budgetClear && baseOk) {
    conclusion = '可进入测试投放'
    conclusionReason = '账户已开通、无核心资质卡点、素材审核通过、测试预算明确，具备进入测试投放的完整条件。'
  } else if (criticalUnpaid && (!accountOk || creativeRejected || hasBlocker)) {
    conclusion = '暂不建议投放'
    const blockers: string[] = []
    if (!accountOk) blockers.push(accountAttn ? '账户开户尚未完成' : '账户未开通/开户失败')
    if (creativeRejected) blockers.push('素材审核被拒绝')
    if (hasBlocker) blockers.push('存在资质/审核卡点')
    if (!budgetClear && !budgetPartial) blockers.push('测试预算未明确')
    conclusionReason = `存在关键卡点：${blockers.join('、')}。建议先解决关键卡点再评估投放。`
  } else if (almostReady) {
    conclusion = '准备中'
    conclusionReason = '大部分信息已完整，仍有素材、预算或审核事项待完成。'
  } else {
    conclusion = '准备中'
    conclusionReason = '推进中，尚有部分维度待完善，请对照检查项逐项补齐。'
  }

  const score = calcReadinessScore(r)
  return {
    items,
    conclusion,
    conclusionReason,
    score,
    scoreStatus: scoreToStatus(score),
    passedCount,
    totalCount,
  }
}
