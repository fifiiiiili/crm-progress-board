import type {
  AccountStatusValue,
  CreativeReviewValue,
  CreativeStatusValue,
  CustomerRecord,
  CustomerScaleValue,
  FollowUpRecord,
  IntentValue,
  LaunchStageValue,
  PlatformValue,
  PriorityValue,
  StatusValue,
} from '../components/CustomerBoard/constants'
import { calcReadinessScore, scoreToStatus } from '../utils/readiness'

// ========== Mulberry32 可复现伪随机 ==========
function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260714)
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
const chance = (p: number) => rand() < p

function weightedPick<T>(items: { value: T; weight: number }[]): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0)
  let r = rand() * total
  for (const it of items) {
    r -= it.weight
    if (r <= 0) return it.value
  }
  return items[items.length - 1].value
}

// ========== 虚构字典 ==========
const BRAND_PREFIX = [
  '星河', '海岛', '云途', '光年', '蓝鲸', '橙风', '青柠', '雪原', '木棉', '流萤',
  '磐石', '灯塔', '苍穹', '晨曦', '锦绣', '晴川', '沐野', '砚台', '拾光', '半岛',
  '虹霓', '瓷心', '鹿岛', '南栀', '北屿', '风信', '未名', '知遇', '归野', '拾贝',
]

const BRAND_SUFFIX = [
  '科技', '互娱', '文化', '游戏', '数字', '智造', '时代', '媒体', '生活', '优选',
  '优品', '国际', '出海', '云智', '创想', '实验室', '工场', '甄选', '零售', '快消',
]

const CUSTOMER_SOURCES = [
  '销售BD推荐',
  '客户主动咨询',
  '代理商引荐',
  '合作伙伴推荐',
  '线上活动获客',
  '行业展会',
  '公司战略客户',
  '老客户复购',
  '其他',
]

const COUNTRIES = [
  '中国大陆', '中国香港', '中国台湾', '新加坡', '马来西亚', '印度尼西亚',
  '越南', '泰国', '菲律宾', '日本', '韩国', '美国', '加拿大', '德国', '英国',
]

const INDUSTRIES: { l1: string; l2: string[] }[] = [
  { l1: '游戏', l2: ['SLG', 'MMO', '休闲', '棋牌', '模拟经营', '二次元', '独立游戏'] },
  { l1: '电商', l2: ['服饰', '美妆个护', '3C数码', '家居家纺', '食品生鲜', '母婴玩具'] },
  { l1: '教育', l2: ['K12', '语言学习', '职业教育', '素质教育', '留学'] },
  { l1: '金融', l2: ['支付', '证券', '保险', '投资理财', '数字资产'] },
  { l1: '本地生活', l2: ['餐饮', '出行', '住宿', '休闲娱乐', '本地服务'] },
  { l1: '文化娱乐', l2: ['短视频', '直播', '影视', '音乐', '阅读'] },
  { l1: '汽车', l2: ['新能源', '燃油车', '汽车服务', '汽车周边'] },
  { l1: '快消', l2: ['个护清洁', '食品饮料', '宠物用品', '家居清洁'] },
  { l1: '工具软件', l2: ['效率工具', '社交通讯', '摄影美化', '安全工具'] },
  { l1: '医疗健康', l2: ['医美', '健康管理', '医药电商', '在线问诊'] },
  { l1: '旅游出行', l2: ['境外游', '境内游', '机票酒店', '本地玩乐'] },
  { l1: '房产家居', l2: ['房产服务', '家装设计', '智能家居', '家居建材'] },
]

const CHANNEL_MANAGERS = [
  '模拟经理A', '模拟经理B', '模拟经理C', '模拟经理D', '模拟经理E',
  '模拟经理F', '模拟经理G', '模拟经理H', '模拟经理I', '模拟经理J',
  '模拟经理K', '模拟经理L', '模拟经理M', '模拟经理N', '模拟经理O',
]

const PLATFORMS: PlatformValue[] = ['巨量引擎', '腾讯广告', '快手', 'B站', '小红书', '其他']

// ========== 具体生成 ==========
function generateOne(index: number): Omit<CustomerRecord, 'id'> {
  const proId = `AD_${(100000 + index).toString()}`
  const brandName = `${pick(BRAND_PREFIX)}${pick(BRAND_SUFFIX)}${(rand() * 999 | 0).toString().padStart(3, '0')}`

  const scale = weightedPick<CustomerScaleValue>([
    { value: '大客户', weight: 8 },
    { value: '中客户', weight: 22 },
    { value: '小客户', weight: 35 },
    { value: '长尾客户', weight: 35 },
  ])

  const priority = weightedPick<PriorityValue>(
    scale === '大客户'
      ? [{ value: 'P0', weight: 45 }, { value: 'P1', weight: 35 }, { value: 'P2', weight: 15 }, { value: 'P3', weight: 5 }]
      : scale === '中客户'
      ? [{ value: 'P0', weight: 10 }, { value: 'P1', weight: 30 }, { value: 'P2', weight: 40 }, { value: 'P3', weight: 20 }]
      : [{ value: 'P0', weight: 2 }, { value: 'P1', weight: 10 }, { value: 'P2', weight: 35 }, { value: 'P3', weight: 53 }],
  )

  const intent = weightedPick<IntentValue>(
    priority === 'P0' || priority === 'P1'
      ? [{ value: '高', weight: 55 }, { value: '中', weight: 30 }, { value: '低', weight: 10 }, { value: '暂无明确意向', weight: 5 }]
      : [{ value: '高', weight: 15 }, { value: '中', weight: 35 }, { value: '低', weight: 30 }, { value: '暂无明确意向', weight: 20 }],
  )

  // 预算按体量分档
  const budgetBase = {
    大客户: [200000, 800000],
    中客户: [80000, 300000],
    小客户: [20000, 80000],
    长尾客户: [3000, 20000],
  }[scale]
  const monthly_budget = Math.round(budgetBase[0] + rand() * (budgetBase[1] - budgetBase[0]))

  // 状态分布
  const current_status = weightedPick<StatusValue>([
    { value: '未跟进', weight: 8 },
    { value: '已触达', weight: 12 },
    { value: '跟进中', weight: 24 },
    { value: '待客户补充材料', weight: 12 },
    { value: '待内部审核', weight: 10 },
    { value: '审核卡住', weight: 6 },
    { value: '已开通', weight: 22 },
    { value: '暂停推进', weight: 4 },
    { value: '无效线索', weight: 2 },
  ])

  // 卡点与状态相关
  const block_type =
    current_status === '已开通' || current_status === '未跟进'
      ? '无卡点'
      : current_status === '待客户补充材料'
      ? pick(['材料缺失', '客户未回复'] as const)
      : current_status === '审核卡住'
      ? pick(['资质卡审', '内部审核待处理', '行业准入限制'] as const)
      : current_status === '待内部审核'
      ? '内部审核待处理'
      : current_status === '跟进中'
      ? weightedPick([
          { value: '无卡点', weight: 3 },
          { value: '客户未回复', weight: 4 },
          { value: '材料缺失', weight: 3 },
          { value: '素材准备问题', weight: 3 },
          { value: '广告账户开通问题', weight: 2 },
          { value: '账号认证问题', weight: 1 },
          { value: '其他', weight: 2 },
        ])
      : '其他'

  // 广告账户状态与整体状态相关
  const account_status: AccountStatusValue =
    current_status === '已开通'
      ? weightedPick([{ value: '已开户' as const, weight: 90 }, { value: '开户中' as const, weight: 10 }])
      : current_status === '审核卡住' || current_status === '暂停推进'
      ? weightedPick([
          { value: '开户中' as const, weight: 40 },
          { value: '开户失败' as const, weight: 30 },
          { value: '未开户' as const, weight: 30 },
        ])
      : current_status === '未跟进' || current_status === '已触达'
      ? '未开户'
      : weightedPick([
          { value: '未开户' as const, weight: 30 },
          { value: '开户中' as const, weight: 50 },
          { value: '已开户' as const, weight: 15 },
          { value: '开户失败' as const, weight: 5 },
        ])

  // 素材状态与账户相关
  const creative_status: CreativeStatusValue =
    account_status === '已开户'
      ? weightedPick([
          { value: '审核通过' as const, weight: 35 },
          { value: '已上传' as const, weight: 25 },
          { value: '部分通过' as const, weight: 15 },
          { value: '制作中' as const, weight: 15 },
          { value: '审核拒绝' as const, weight: 5 },
          { value: '未准备' as const, weight: 5 },
        ])
      : weightedPick([
          { value: '未准备' as const, weight: 50 },
          { value: '制作中' as const, weight: 30 },
          { value: '已上传' as const, weight: 15 },
          { value: '审核拒绝' as const, weight: 5 },
        ])

  const creative_review: CreativeReviewValue =
    creative_status === '审核通过'
      ? '通过'
      : creative_status === '审核拒绝'
      ? '拒绝'
      : creative_status === '部分通过'
      ? '部分通过'
      : creative_status === '已上传'
      ? '未提交'
      : '未提交'

  const creative_count =
    creative_status === '未准备' ? 0 : (rand() * 30 | 0) + 3

  const test_budget = Math.round(monthly_budget * (0.1 + rand() * 0.2))

  const launch_stage: LaunchStageValue =
    current_status === '已开通' && creative_status === '审核通过'
      ? weightedPick([
          { value: '小预算测试' as const, weight: 25 },
          { value: '放量中' as const, weight: 30 },
          { value: '待测试' as const, weight: 20 },
          { value: '暂停' as const, weight: 10 },
          { value: '复盘中' as const, weight: 15 },
        ])
      : current_status === '已开通'
      ? '待测试'
      : '待准备'

  const platform: PlatformValue = pick(PLATFORMS)

  // 时间
  const now = Date.now()
  const daysAgo = (n: number) => new Date(now - n * 86400000).toISOString()
  const lead_created_at = daysAgo(1 + Math.floor(rand() * 60))
  const created_at = lead_created_at
  // 20% 客户故意超过 7 天未更新
  const staleFlag = chance(0.2)
  const followDaysAgo = staleFlag ? 8 + Math.floor(rand() * 20) : Math.floor(rand() * 6)
  const last_follow_up_at = daysAgo(followDaysAgo)
  const updated_at = last_follow_up_at

  const first_test_date =
    launch_stage === '待准备' || launch_stage === '待测试'
      ? null
      : daysAgo(Math.floor(rand() * 30))

  const ind = pick(INDUSTRIES)

  // 生成模拟跟进记录（3-5 条）
  const followRecordCount = 2 + Math.floor(rand() * 3)
  const follow_up_records: FollowUpRecord[] = []
  for (let i = 0; i < followRecordCount; i++) {
    const daysBack = Math.floor((followRecordCount - i) * 3 + rand() * 4)
    follow_up_records.push({
      time: daysAgo(daysBack),
      operator: pick(CHANNEL_MANAGERS),
      action: pick(['客户触达', '材料跟进', '素材沟通', '账户跟进', '内部同步', '系统预警']),
      note: pick([
        '已联系客户确认开户材料，客户预计本周内补充。',
        '客户已补充部分材料，仍缺少资质证明。',
        '素材制作进度过半，预计 3 个工作日完成。',
        '与内部审核团队同步进展，等待反馈。',
        '客户表达明确投放意向，进入下一步。',
        '系统提示该账号超过 7 天未完成状态更新。',
        '完成首次触达，客户对方案表示感兴趣。',
        '已提交材料至平台审核，等待结果。',
      ]),
    })
  }

  const raw: Omit<CustomerRecord, 'id' | 'readiness_score' | 'readiness_status'> = {
    customer_source: pick(CUSTOMER_SOURCES),
    pro_account_id: proId,
    pro_account_name: brandName,
    country_region: pick(COUNTRIES),
    industry_l1: ind.l1,
    industry_l2: pick(ind.l2),
    channel_manager: pick(CHANNEL_MANAGERS),
    customer_scale: scale,
    monthly_budget,
    priority,
    intent,
    current_status,
    block_type: block_type as never,
    follow_up_note:
      current_status === '未跟进'
        ? null
        : pick([
            '客户表达明确投放意向，正在推进材料收集。',
            '已发送开户资料模板，等待客户补齐。',
            '正在协调内部审核加急处理。',
            '与客户约定下周沟通新一轮素材方向。',
            '客户暂时决策放缓，需要重新对齐时间表。',
          ]),
    next_action:
      current_status === '已开通' || current_status === '无效线索'
        ? null
        : pick([
            '本周内完成材料补齐',
            '下周约客户面谈',
            '推进素材制作和审核',
            '协调开户资料复核',
            '同步内部审核团队',
          ]),
    last_follow_up_at,
    lead_created_at,
    chat_screenshots: null,
    remark: chance(0.15) ? '模拟备注：客户对整体方案反馈积极。' : null,
    source_type: '模拟数据',
    creator: 'DemoSeed',
    author_name: 'DemoSeed',
    created_at,
    updated_at,
    platform,
    account_status,
    creative_status,
    creative_count,
    creative_review,
    test_budget,
    launch_stage,
    first_test_date,
    follow_up_records,
  }

  const score = calcReadinessScore(raw as CustomerRecord)
  return {
    ...raw,
    readiness_score: score,
    readiness_status: scoreToStatus(score),
  }
}

export function generateMockCustomers(count = 2000): Omit<CustomerRecord, 'id'>[] {
  return Array.from({ length: count }, (_, i) => generateOne(i))
}

export const SEED_CUSTOMERS = generateMockCustomers(2000)

// ========== 复盘沉淀预置数据 ==========
export const SEED_RETRO_CASES = [
  {
    case_type: '成功开通案例',
    related_account_id: 'AD_100003',
    related_account_name: '模拟品牌案例001',
    industry: '游戏 / SLG',
    problem_bg: '客户为出海 SLG 游戏，主体资质需要海外营业执照公证，流程较长。',
    action_taken: '提前介入协助客户准备公证材料，同步平台审核进度。',
    result: '开户周期缩短 40%，客户 15 天内完成首轮小预算测试。',
    reusable_experience: '出海游戏客户建议在触达后 3 天内启动资质材料清单同步。',
    recorder: '模拟经理A',
    recorded_at: '2026-06-10T10:00:00.000Z',
  },
  {
    case_type: '审核卡住案例',
    related_account_id: 'AD_100017',
    related_account_name: '模拟品牌案例002',
    industry: '金融 / 支付',
    problem_bg: '客户主营境外支付业务，行业准入审核未通过。',
    action_taken: '补充业务合规说明、境外牌照复印件，多轮沟通平台风控。',
    result: '最终未通过审核，客户暂缓推进。',
    reusable_experience: '境外金融类客户需提前评估行业准入政策，避免无效投入。',
    recorder: '模拟经理B',
    recorded_at: '2026-06-15T10:00:00.000Z',
  },
  {
    case_type: '高预算客户推进案例',
    related_account_id: 'AD_100025',
    related_account_name: '模拟品牌案例003',
    industry: '电商 / 服饰',
    problem_bg: '客户月预算 80 万，因素材效果反复调整导致首测延期。',
    action_taken: '联合素材团队进入客户会议，明确素材验收标准和交付时间。',
    result: '素材验收周期缩短，客户按计划进入放量阶段。',
    reusable_experience: '高预算客户素材验收建议在开户前完成对齐，避免拖延首测。',
    recorder: '模拟经理C',
    recorded_at: '2026-06-20T10:00:00.000Z',
  },
  {
    case_type: '客户流失案例',
    related_account_id: 'AD_100042',
    related_account_name: '模拟品牌案例004',
    industry: '教育 / K12',
    problem_bg: '客户在跟进过程中因行业政策变化转向其他渠道，中途放弃。',
    action_taken: '定期回访保持关系，无实质推进动作。',
    result: '客户转向竞品，流失。',
    reusable_experience: '政策敏感行业需前置识别风险信号，及时调整跟进优先级。',
    recorder: '模拟经理D',
    recorded_at: '2026-06-22T10:00:00.000Z',
  },
  {
    case_type: '素材审核失败案例',
    related_account_id: 'AD_100058',
    related_account_name: '模拟品牌案例005',
    industry: '医疗健康 / 医美',
    problem_bg: '首批素材因宣称问题被平台拒审。',
    action_taken: '重新调整宣称口径，参考合规话术模板重新提交。',
    result: '第二批素材审核通过，进入小预算测试。',
    reusable_experience: '医美类行业建议提前对齐平台合规话术，减少反复。',
    recorder: '模拟经理E',
    recorded_at: '2026-06-25T10:00:00.000Z',
  },
  {
    case_type: '低意向客户转化案例',
    related_account_id: 'AD_100073',
    related_account_name: '模拟品牌案例006',
    industry: '本地生活 / 餐饮',
    problem_bg: '客户对广告投放持观望态度，初期意向标为「低」。',
    action_taken: '通过定期分享成功案例、同城客户效果数据，逐步建立信任。',
    result: '3 个月后客户主动申请开户，进入中意向阶段。',
    reusable_experience: '低意向客户建议每月至少 1 次价值型触达，逐步建立信任。',
    recorder: '模拟经理F',
    recorded_at: '2026-06-28T10:00:00.000Z',
  },
  {
    case_type: '账户开通失败案例',
    related_account_id: 'AD_100091',
    related_account_name: '模拟品牌案例007',
    industry: '快消 / 食品饮料',
    problem_bg: '客户主体信息与营业执照不一致，导致开户失败。',
    action_taken: '协助客户变更公司注册信息后重新提交。',
    result: '第二次提交成功开户。',
    reusable_experience: '开户前建议做主体信息一致性检查，减少失败率。',
    recorder: '模拟经理G',
    recorded_at: '2026-07-01T10:00:00.000Z',
  },
  {
    case_type: '可进入测试投放案例',
    related_account_id: 'AD_100108',
    related_account_name: '模拟品牌案例008',
    industry: '游戏 / 二次元',
    problem_bg: '客户完成开户和素材准备，进入测试投放阶段。',
    action_taken: '按 3000/日 预算启动小测，A/B 素材验证。',
    result: 'ROI 达到预期，进入放量阶段。',
    reusable_experience: '二次元游戏建议至少准备 3 组差异化素材做首测。',
    recorder: '模拟经理H',
    recorded_at: '2026-07-03T10:00:00.000Z',
  },
  {
    case_type: '成功开通案例',
    related_account_id: 'AD_100125',
    related_account_name: '模拟品牌案例009',
    industry: '汽车 / 新能源',
    problem_bg: '新能源汽车客户，行业新，需教育客户和内部团队。',
    action_taken: '组织内部行业分享，同步客户完成合规和素材筹备。',
    result: '开户和首测均顺利，月消耗稳定增长。',
    reusable_experience: '新兴行业建议先做内部知识对齐再启动客户跟进。',
    recorder: '模拟经理I',
    recorded_at: '2026-07-05T10:00:00.000Z',
  },
  {
    case_type: '审核卡住案例',
    related_account_id: 'AD_100147',
    related_account_name: '模拟品牌案例010',
    industry: '工具软件 / 效率工具',
    problem_bg: '海外主体资质审核多轮补件仍未通过。',
    action_taken: '协助客户重新组织材料结构，增加业务说明附件。',
    result: '第 3 次提交后审核通过。',
    reusable_experience: '海外主体建议直接使用平台推荐的材料模板结构。',
    recorder: '模拟经理J',
    recorded_at: '2026-07-08T10:00:00.000Z',
  },
  {
    case_type: '高预算客户推进案例',
    related_account_id: 'AD_100163',
    related_account_name: '模拟品牌案例011',
    industry: '电商 / 美妆个护',
    problem_bg: '月预算 120 万高优客户，客户对投放策略有强诉求。',
    action_taken: '组建专项对接小组，投放策略提前 2 周做详细方案沟通。',
    result: '客户满意度高，首月消耗超预期 20%。',
    reusable_experience: '大 R 客户建议前置组建专项对接小组。',
    recorder: '模拟经理K',
    recorded_at: '2026-07-10T10:00:00.000Z',
  },
  {
    case_type: '素材审核失败案例',
    related_account_id: 'AD_100185',
    related_account_name: '模拟品牌案例012',
    industry: '教育 / 职业教育',
    problem_bg: '素材中出现绝对化用语，被平台批量拒审。',
    action_taken: '统一审核所有素材文案，替换敏感表述。',
    result: '重新提交后全部通过。',
    reusable_experience: '教育类素材需建立自审词库，前置排查敏感表述。',
    recorder: '模拟经理L',
    recorded_at: '2026-07-11T10:00:00.000Z',
  },
]
