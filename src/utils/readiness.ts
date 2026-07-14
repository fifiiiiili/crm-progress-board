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
