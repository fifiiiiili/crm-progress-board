/**
 * 演示种子数据 —— 2000 条模拟广告客户数据
 * 全部为虚构公司名/账号/负责人，不含任何真实业务数据。
 */

import type { CustomerRecord } from '../components/CustomerBoard/constants'

// —— 基础字典 ——
const CUSTOMER_SOURCES = [
  '销售自拓',
  'AM推荐',
  '客户主动咨询',
  '存量迁移',
  '代理商推荐',
  '市场活动',
  '官网表单',
  '合作伙伴引入',
]

const COUNTRIES = [
  '日本',
  '韩国',
  '美国',
  '英国',
  '德国',
  '法国',
  '加拿大',
  '澳大利亚',
  '新加坡',
  '马来西亚',
  '泰国',
  '越南',
  '印度尼西亚',
  '菲律宾',
  '阿联酋',
]

// 一级行业 → 二级行业
const INDUSTRIES: Record<string, string[]> = {
  美妆个护: ['护肤', '彩妆', '香氛', '洗护', '美容仪器'],
  服饰鞋包: ['女装', '男装', '童装', '鞋履', '箱包', '内衣'],
  '3C数码': ['手机数码', '智能穿戴', '电脑办公', '影音娱乐', '智能家居'],
  食品饮料: ['休闲零食', '生鲜水果', '茶饮咖啡', '保健食品', '酒类'],
  家居家装: ['家具', '家纺', '厨具', '装饰摆件', '家电'],
  母婴亲子: ['奶粉辅食', '玩具', '孕产用品', '童装童鞋', '早教'],
  珠宝配饰: ['黄金珠宝', '时尚饰品', '手表', '眼镜'],
  运动户外: ['运动装备', '户外装备', '骑行', '健身'],
  汽车配件: ['汽车用品', '车载电子', '改装配件'],
  游戏娱乐: ['手游', '主机游戏', '电竞外设'],
  教育培训: ['语言学习', '兴趣培训', '职业教育'],
  文化传媒: ['图书', '影视', '动漫周边'],
}

const INDUSTRY_L1_LIST = Object.keys(INDUSTRIES)

// 渠道经理（虚构姓名 15 人）
const CHANNEL_MANAGERS = [
  '林岚',
  '苏眠',
  '陈奕',
  '周砚',
  '沈明',
  '顾禾',
  '许知',
  '简书',
  '路遥',
  '闻星',
  '柳青',
  '白鹿',
  '云舒',
  '南栀',
  '木槿',
]

const SCALES = ['大客户', '中客户', '小客户', '长尾客户'] as const
const PRIORITIES = ['P0', 'P1', 'P2', 'P3'] as const
const INTENTS = ['高', '中', '低', '暂无明确意向'] as const

const STATUSES = [
  '未跟进',
  '已触达',
  '跟进中',
  '待客户补充材料',
  '待内部审核',
  '审核卡住',
  '已开通',
  '暂停推进',
  '无效线索',
] as const

const BLOCK_TYPES = [
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
] as const

// 品牌前缀 + 后缀（组合成 2000 个虚构品牌名）
const BRAND_PREFIXES = [
  'Aurora',
  'Nova',
  'Zenith',
  'Lumina',
  'Vertex',
  'Kaleido',
  'Origami',
  'Meridian',
  'Solstice',
  'Cascade',
  'Ember',
  'Prism',
  'Verve',
  'Halcyon',
  'Sable',
  'Marlow',
  'Kestrel',
  'Onyx',
  'Ivory',
  'Mica',
  'Terra',
  'Lyra',
  'Cyra',
  'Elara',
  'Nyra',
  'Ophira',
  'Selene',
  'Thalia',
  'Vela',
  'Zara',
]

const BRAND_SUFFIXES = [
  'Studio',
  'Lab',
  'Craft',
  'Works',
  'House',
  'Collective',
  'Atelier',
  'Group',
  'Global',
  'Bureau',
  'Society',
  'Union',
  'Circle',
  'Guild',
  'Kitchen',
  'Home',
  'Living',
  'Life',
  'World',
  'Space',
]

// 跟进情况模板
const FOLLOW_UP_TEMPLATES = [
  '首次触达完成，客户表达合作意向',
  '客户希望了解更多投放案例',
  '正在准备开户资料，预计本周完成',
  '客户内部审批中，等待反馈',
  '资质材料已提交平台审核',
  '客户对投放预算有疑虑，仍在评估',
  '已发送方案 PPT，等待客户回复',
  '客户询问最低起投金额',
  '正在协调技术侧对接',
  '客户内部换人，重新对齐需求',
  '暂时搁置，Q3 再跟进',
  '已开通账户，等待素材上传',
  '客户测试期效果不理想，正在优化',
  '需要补充营业执照最新版本',
]

const NEXT_ACTION_TEMPLATES = [
  '本周内完成开户资料收集',
  '发送最新版本合作方案',
  '协调平台侧加急审核',
  '安排下周三线上会议',
  '拉群同步进度',
  '发送投放案例参考',
  '协助客户完成素材制作',
  '推动内部审核加快节奏',
  '与客户沟通调整预算',
  '待客户回复后进一步跟进',
  '协助补齐认证材料',
  '首次投放策略沟通',
]

const REMARK_TEMPLATES = [
  '',
  '',
  '',
  '客户关系良好，续约可能性高',
  '需要重点关注',
  '有跨境电商背景',
  '客户重视 ROI，需精细化投放',
  '此前有合作历史',
  '客户对内容营销更感兴趣',
  '注意行业合规要求',
  '需协调本地化落地方案',
  '预算宽松，可尝试多种形式',
]

// —— 工具函数 ——
function pick<T>(arr: readonly T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)]
}

// Mulberry32 —— 可复现的伪随机
function seedRandom(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 加权选择
function weightedPick<T>(items: readonly (readonly [T, number])[], rnd: () => number): T {
  const total = items.reduce((s, [, w]) => s + w, 0)
  let r = rnd() * total
  for (const [item, w] of items) {
    r -= w
    if (r <= 0) return item
  }
  return items[items.length - 1][0]
}

/**
 * 生成 2000 条模拟数据
 */
export function generateMockCustomers(count = 2000): Omit<CustomerRecord, 'id'>[] {
  const rnd = seedRandom(20260714)
  const rows: Omit<CustomerRecord, 'id'>[] = []
  const usedIds = new Set<string>()

  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000

  for (let i = 0; i < count; i++) {
    // 品牌名（保证唯一）
    let name = ''
    let accountId = ''
    for (let tryTimes = 0; tryTimes < 20; tryTimes++) {
      const prefix = pick(BRAND_PREFIXES, rnd)
      const suffix = pick(BRAND_SUFFIXES, rnd)
      const suffixNum = Math.floor(rnd() * 900) + 100
      name = `${prefix} ${suffix} ${suffixNum}`
      accountId = `MK${String(100000 + i).padStart(7, '0')}`
      if (!usedIds.has(accountId)) {
        usedIds.add(accountId)
        break
      }
    }

    // 一级行业 + 对应二级行业
    const industryL1 = pick(INDUSTRY_L1_LIST, rnd)
    const industryL2 = pick(INDUSTRIES[industryL1], rnd)

    const country = pick(COUNTRIES, rnd)
    const source = pick(CUSTOMER_SOURCES, rnd)
    const manager = pick(CHANNEL_MANAGERS, rnd)

    // 客户体量（加权：长尾多，大客户少）
    const scale = weightedPick<typeof SCALES[number]>(
      [
        ['大客户', 1],
        ['中客户', 2.5],
        ['小客户', 4],
        ['长尾客户', 5],
      ],
      rnd,
    )

    // 预估月预算（按体量分档）
    let monthlyBudget = 0
    if (scale === '大客户') monthlyBudget = 200000 + Math.floor(rnd() * 800000)
    else if (scale === '中客户') monthlyBudget = 50000 + Math.floor(rnd() * 150000)
    else if (scale === '小客户') monthlyBudget = 10000 + Math.floor(rnd() * 40000)
    else monthlyBudget = 2000 + Math.floor(rnd() * 8000)
    // 取整到 1000
    monthlyBudget = Math.round(monthlyBudget / 1000) * 1000

    // 优先级（跟体量相关，加噪音）
    let priority: typeof PRIORITIES[number]
    if (scale === '大客户') {
      priority = weightedPick(
        [
          ['P0', 3],
          ['P1', 4],
          ['P2', 2],
          ['P3', 1],
        ],
        rnd,
      )
    } else if (scale === '中客户') {
      priority = weightedPick(
        [
          ['P0', 1],
          ['P1', 3],
          ['P2', 4],
          ['P3', 2],
        ],
        rnd,
      )
    } else if (scale === '小客户') {
      priority = weightedPick(
        [
          ['P0', 0.3],
          ['P1', 1],
          ['P2', 3],
          ['P3', 4],
        ],
        rnd,
      )
    } else {
      priority = weightedPick(
        [
          ['P1', 0.5],
          ['P2', 2],
          ['P3', 5],
        ],
        rnd,
      )
    }

    // 投放意向
    const intent = weightedPick<typeof INTENTS[number]>(
      [
        ['高', 2],
        ['中', 4],
        ['低', 3],
        ['暂无明确意向', 2],
      ],
      rnd,
    )

    // 当前状态（加权，实际业务分布类似）
    const currentStatus = weightedPick<typeof STATUSES[number]>(
      [
        ['未跟进', 1.5],
        ['已触达', 2],
        ['跟进中', 4],
        ['待客户补充材料', 2],
        ['待内部审核', 1.5],
        ['审核卡住', 0.8],
        ['已开通', 3],
        ['暂停推进', 0.7],
        ['无效线索', 0.5],
      ],
      rnd,
    )

    // 卡点类型（跟状态相关）
    let blockType: typeof BLOCK_TYPES[number]
    if (currentStatus === '已开通') {
      blockType = '无卡点'
    } else if (currentStatus === '审核卡住') {
      blockType = weightedPick<typeof BLOCK_TYPES[number]>(
        [
          ['资质卡审', 3],
          ['内部审核待处理', 3],
          ['行业准入限制', 2],
          ['账号认证问题', 1],
        ],
        rnd,
      )
    } else if (currentStatus === '待客户补充材料') {
      blockType = weightedPick<typeof BLOCK_TYPES[number]>(
        [
          ['材料缺失', 5],
          ['账号认证问题', 2],
        ],
        rnd,
      )
    } else if (currentStatus === '待内部审核') {
      blockType = weightedPick<typeof BLOCK_TYPES[number]>(
        [
          ['内部审核待处理', 5],
          ['广告账户开通问题', 2],
        ],
        rnd,
      )
    } else if (currentStatus === '暂停推进' || currentStatus === '无效线索') {
      blockType = weightedPick<typeof BLOCK_TYPES[number]>(
        [
          ['客户未回复', 4],
          ['其他', 2],
        ],
        rnd,
      )
    } else if (currentStatus === '未跟进') {
      blockType = '渠道经理待跟进'
    } else {
      blockType = weightedPick<typeof BLOCK_TYPES[number]>(
        [
          ['无卡点', 3],
          ['客户未回复', 2],
          ['素材准备问题', 1.5],
          ['其他', 1],
        ],
        rnd,
      )
    }

    // 线索创建时间（近 90 天内随机）
    const leadDaysAgo = Math.floor(rnd() * 90)
    const leadCreatedAt = new Date(now - leadDaysAgo * dayMs - Math.floor(rnd() * dayMs)).toISOString()

    // 最近跟进时间（在线索创建之后，一部分故意超过 7 天不更新）
    let followUpAt: string | null = null
    if (currentStatus !== '未跟进') {
      const staleChance = rnd()
      // 20% 概率超过 7 天没更新（模拟"卡在那儿"）
      const followDaysAgo =
        staleChance < 0.2
          ? 8 + Math.floor(rnd() * 30) // 8-38 天前
          : Math.floor(rnd() * 6) // 0-6 天前
      followUpAt = new Date(
        Math.max(now - followDaysAgo * dayMs, new Date(leadCreatedAt).getTime() + dayMs),
      ).toISOString()
    }

    const followNote =
      currentStatus === '未跟进' ? null : pick(FOLLOW_UP_TEMPLATES, rnd)
    const nextAction =
      currentStatus === '已开通' || currentStatus === '无效线索'
        ? null
        : pick(NEXT_ACTION_TEMPLATES, rnd)
    const remark = pick(REMARK_TEMPLATES, rnd) || null

    // 创建时间 = 线索创建时间
    const createdAt = leadCreatedAt
    const updatedAt = followUpAt || createdAt

    rows.push({
      pro_account_id: accountId,
      customer_source: source,
      pro_account_name: name,
      country_region: country,
      industry_l1: industryL1,
      industry_l2: industryL2,
      channel_manager: manager,
      customer_scale: scale,
      monthly_budget: monthlyBudget,
      priority,
      intent,
      current_status: currentStatus,
      block_type: blockType,
      follow_up_note: followNote,
      next_action: nextAction,
      last_follow_up_at: followUpAt,
      lead_created_at: leadCreatedAt,
      chat_screenshots: null,
      remark,
      source_type: '模拟数据',
      creator: '系统模拟',
      author_name: '系统模拟',
      created_at: createdAt,
      updated_at: updatedAt,
    })
  }

  return rows
}

// 默认导出：2000 条
export const SEED_CUSTOMERS: Omit<CustomerRecord, 'id'>[] = generateMockCustomers(2000)
