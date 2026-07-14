import type { CustomerRecord, RetroRecord } from '../components/CustomerBoard/constants'
import { SEED_CUSTOMERS, SEED_RETRO_CASES } from './seed'
import { calcReadinessScore, scoreToStatus } from '../utils/readiness'

// ============== v3 存储 key ==============
const STORAGE_KEY = 'crm-progress-board:customers:v3'
const RETRO_KEY = 'crm-progress-board:retro:v3'
const ID_COUNTER_KEY = 'crm-progress-board:id-counter:v3'
const RETRO_ID_COUNTER_KEY = 'crm-progress-board:retro-id-counter:v3'
const SEED_MARK_KEY = 'crm-progress-board:seeded:v3'
const UPDATED_AT_KEY = 'crm-progress-board:data-updated-at:v3'

const FOLLOW_UP_TRIGGER_FIELDS = new Set([
  'current_status',
  'block_type',
  'follow_up_note',
  'next_action',
])

// ============== 存储降级模式 ==============
// 当 localStorage 写入失败（QuotaExceeded / Safari 隐私模式等）时，
// 自动降级为内存模式：数据仍能加载和交互，但不持久化。
let storageMode: 'localStorage' | 'memory' = 'localStorage'
let storageDegradeReason: string | null = null
const memoryStore = new Map<string, string>()
let memoryIdCounters = { customer: 0, retro: 0 }

const listeners = new Set<(mode: 'localStorage' | 'memory', reason: string | null) => void>()

export function onStorageModeChange(
  cb: (mode: 'localStorage' | 'memory', reason: string | null) => void,
): () => void {
  listeners.add(cb)
  // 立即触发一次，同步当前状态
  cb(storageMode, storageDegradeReason)
  return () => listeners.delete(cb)
}

export function getStorageMode(): { mode: 'localStorage' | 'memory'; reason: string | null } {
  return { mode: storageMode, reason: storageDegradeReason }
}

function degradeToMemory(reason: string) {
  if (storageMode === 'memory') return
  storageMode = 'memory'
  storageDegradeReason = reason
  console.warn('[storage] 降级为内存模式:', reason)
  // 通知 UI
  listeners.forEach((cb) => cb(storageMode, storageDegradeReason))
}

// ============== 统一读写：兼容内存模式 ==============
function safeGetItem(key: string): string | null {
  if (storageMode === 'memory') return memoryStore.get(key) ?? null
  try {
    return localStorage.getItem(key)
  } catch (e) {
    degradeToMemory('localStorage 读取失败')
    return memoryStore.get(key) ?? null
  }
}

function safeSetItem(key: string, val: string): boolean {
  if (storageMode === 'memory') {
    memoryStore.set(key, val)
    return true
  }
  try {
    localStorage.setItem(key, val)
    return true
  } catch (e) {
    // 触发降级：把已有的 localStorage 全部数据迁移到内存
    const err = e as Error
    const isQuota =
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      /quota/i.test(err.message || '')
    degradeToMemory(isQuota ? '浏览器存储配额不足' : `写入失败：${err.message}`)
    // 迁移当前 localStorage 中已有的 key 到内存
    try {
      const keysToMigrate = [
        STORAGE_KEY,
        RETRO_KEY,
        ID_COUNTER_KEY,
        RETRO_ID_COUNTER_KEY,
        SEED_MARK_KEY,
        UPDATED_AT_KEY,
      ]
      for (const k of keysToMigrate) {
        const v = localStorage.getItem(k)
        if (v !== null) memoryStore.set(k, v)
      }
    } catch {
      /* ignore */
    }
    // 在内存里重试写入
    memoryStore.set(key, val)
    return true
  }
}

function safeRemoveItem(key: string) {
  if (storageMode === 'memory') {
    memoryStore.delete(key)
    return
  }
  try {
    localStorage.removeItem(key)
  } catch {
    memoryStore.delete(key)
  }
}

// ============== 基础工具 ==============
function mockLatency() {
  return new Promise<void>((r) => setTimeout(r, 30 + Math.floor(Math.random() * 50)))
}

function markUpdated() {
  safeSetItem(UPDATED_AT_KEY, new Date().toISOString())
}

export function getDataUpdatedAt(): string | null {
  return safeGetItem(UPDATED_AT_KEY)
}

// ============== 内部 helpers ==============
function readCustomers(): CustomerRecord[] {
  const raw = safeGetItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as CustomerRecord[]
  } catch {
    return []
  }
}
function writeCustomers(list: CustomerRecord[]) {
  // 剔除 null 字段以压缩体积
  safeSetItem(STORAGE_KEY, JSON.stringify(list, (_k, v) => (v === null ? undefined : v)))
  markUpdated()
}

function readRetros(): RetroRecord[] {
  const raw = safeGetItem(RETRO_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as RetroRecord[]
  } catch {
    return []
  }
}
function writeRetros(list: RetroRecord[]) {
  safeSetItem(RETRO_KEY, JSON.stringify(list))
  markUpdated()
}

function nextCustomerId(): number {
  if (storageMode === 'memory') {
    memoryIdCounters.customer += 1
    return memoryIdCounters.customer
  }
  const cur = Number(safeGetItem(ID_COUNTER_KEY) || '0')
  const next = cur + 1
  safeSetItem(ID_COUNTER_KEY, String(next))
  return next
}

function nextRetroId(): number {
  if (storageMode === 'memory') {
    memoryIdCounters.retro += 1
    return memoryIdCounters.retro
  }
  const cur = Number(safeGetItem(RETRO_ID_COUNTER_KEY) || '0')
  const next = cur + 1
  safeSetItem(RETRO_ID_COUNTER_KEY, String(next))
  return next
}

// ============== seed 灌入 ==============
// 关键：seed 一次性写完 2000 条，如果 localStorage 装不下，会自动触发降级
function ensureSeed() {
  if (safeGetItem(SEED_MARK_KEY) === '1') return
  const now = new Date().toISOString()

  // 计算 seed 数据（内存里生成，不持久化）
  let customerIdBase = 0
  const seeded: CustomerRecord[] = SEED_CUSTOMERS.map((r) => {
    customerIdBase += 1
    return {
      ...r,
      id: customerIdBase,
      chat_screenshots: null, // 强制：模拟数据不带截图
      created_at: r.created_at || now,
      updated_at: r.updated_at || now,
    }
  })
  let retroIdBase = 0
  const retros: RetroRecord[] = SEED_RETRO_CASES.map((c) => {
    retroIdBase += 1
    return { ...c, id: retroIdBase }
  })

  // 写入前先同步 id 计数器（后续新增基于此累加）
  if (storageMode === 'memory') {
    memoryIdCounters.customer = customerIdBase
    memoryIdCounters.retro = retroIdBase
  } else {
    // 先尝试写 seed（这一步可能触发降级）
    try {
      const stripNull = (_k: string, v: unknown) => (v === null ? undefined : v)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded, stripNull))
      localStorage.setItem(RETRO_KEY, JSON.stringify(retros, stripNull))
      localStorage.setItem(ID_COUNTER_KEY, String(customerIdBase))
      localStorage.setItem(RETRO_ID_COUNTER_KEY, String(retroIdBase))
      localStorage.setItem(SEED_MARK_KEY, '1')
      localStorage.setItem(UPDATED_AT_KEY, now)
      return
    } catch (e) {
      const err = e as Error
      const isQuota =
        err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        /quota/i.test(err.message || '')
      degradeToMemory(
        isQuota
          ? '当前浏览器存储空间不足，已进入演示模式（数据仅在本次会话有效）'
          : `本地存储不可用：${err.message}，已进入演示模式`,
      )
      // 清理可能残留的半写状态
      try {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(RETRO_KEY)
      } catch {
        /* ignore */
      }
    }
  }

  // 降级路径：直接写内存
  const stripNull2 = (_k: string, v: unknown) => (v === null ? undefined : v)
  memoryStore.set(STORAGE_KEY, JSON.stringify(seeded, stripNull2))
  memoryStore.set(RETRO_KEY, JSON.stringify(retros, stripNull2))
  memoryStore.set(SEED_MARK_KEY, '1')
  memoryStore.set(UPDATED_AT_KEY, now)
  memoryIdCounters.customer = customerIdBase
  memoryIdCounters.retro = retroIdBase
}

// ============== 客户 CRUD ==============

export async function fetchAllCustomers(): Promise<CustomerRecord[]> {
  await mockLatency()
  ensureSeed()
  return readCustomers()
}

export async function insertCustomer(record: Omit<CustomerRecord, 'id'>): Promise<CustomerRecord> {
  await mockLatency()
  ensureSeed()
  const list = readCustomers()
  const now = new Date().toISOString()
  const score = calcReadinessScore(record)
  const newRecord: CustomerRecord = {
    ...record,
    id: nextCustomerId(),
    created_at: record.created_at || now,
    updated_at: now,
    readiness_score: score,
    readiness_status: scoreToStatus(score),
  }
  list.push(newRecord)
  writeCustomers(list)
  return newRecord
}

export async function bulkInsertCustomers(
  records: Omit<CustomerRecord, 'id'>[],
): Promise<number> {
  await mockLatency()
  ensureSeed()
  const list = readCustomers()
  const now = new Date().toISOString()
  for (const record of records) {
    const score = calcReadinessScore(record)
    list.push({
      ...record,
      id: nextCustomerId(),
      created_at: record.created_at || now,
      updated_at: now,
      readiness_score: score,
      readiness_status: scoreToStatus(score),
    })
  }
  writeCustomers(list)
  return records.length
}

export async function updateCustomerById(
  id: number,
  patch: Partial<CustomerRecord>,
): Promise<void> {
  await mockLatency()
  const list = readCustomers()
  const idx = list.findIndex((r) => r.id === id)
  if (idx < 0) throw new Error('记录不存在')
  const now = new Date().toISOString()
  const shouldRefreshFollowUp = Object.keys(patch).some((k) =>
    FOLLOW_UP_TRIGGER_FIELDS.has(k),
  )
  const merged = { ...list[idx], ...patch, updated_at: now }
  if (shouldRefreshFollowUp && patch.last_follow_up_at === undefined) {
    merged.last_follow_up_at = now
  }
  const score = calcReadinessScore(merged)
  merged.readiness_score = score
  merged.readiness_status = scoreToStatus(score)
  list[idx] = merged
  writeCustomers(list)
}

export async function deleteCustomerById(id: number): Promise<void> {
  await mockLatency()
  const list = readCustomers()
  const target = list.find((r) => r.id === id)
  if (!target) return
  if (target.source_type === '表格上传' || target.source_type === '模拟数据') {
    throw new Error('该数据为受保护数据，不支持删除。')
  }
  const filtered = list.filter((r) => r.id !== id)
  writeCustomers(filtered)
}

export async function existsByProAccountId(proAccountId: string): Promise<boolean> {
  await mockLatency()
  return readCustomers().some((r) => r.pro_account_id === proAccountId)
}

export async function existingProAccountIds(ids: string[]): Promise<Set<string>> {
  await mockLatency()
  const set = new Set(ids)
  const found = readCustomers()
    .filter((r) => set.has(r.pro_account_id))
    .map((r) => r.pro_account_id)
  return new Set(found)
}

// ============== 跟进记录追加 ==============
export async function appendFollowUpRecord(
  customerId: number,
  record: {
    time?: string
    operator: string
    action: string
    note: string
  },
): Promise<void> {
  await mockLatency()
  const list = readCustomers()
  const idx = list.findIndex((r) => r.id === customerId)
  if (idx < 0) throw new Error('记录不存在')
  const now = new Date().toISOString()
  const cur = list[idx]
  const arr = Array.isArray(cur.follow_up_records) ? [...cur.follow_up_records] : []
  arr.push({
    time: record.time || now,
    operator: record.operator,
    action: record.action,
    note: record.note,
  })
  list[idx] = {
    ...cur,
    follow_up_records: arr,
    last_follow_up_at: now,
    updated_at: now,
  }
  writeCustomers(list)
}

// ============== 复盘沉淀 CRUD ==============

export async function fetchAllRetros(): Promise<RetroRecord[]> {
  await mockLatency()
  ensureSeed()
  return readRetros()
}

export async function insertRetro(record: Omit<RetroRecord, 'id'>): Promise<RetroRecord> {
  await mockLatency()
  ensureSeed()
  const list = readRetros()
  const now = new Date().toISOString()
  const newR: RetroRecord = {
    ...record,
    id: nextRetroId(),
    recorded_at: record.recorded_at || now,
  }
  list.push(newR)
  writeRetros(list)
  return newR
}

export async function updateRetroById(
  id: number,
  patch: Partial<RetroRecord>,
): Promise<void> {
  await mockLatency()
  const list = readRetros()
  const idx = list.findIndex((r) => r.id === id)
  if (idx < 0) throw new Error('复盘记录不存在')
  list[idx] = { ...list[idx], ...patch }
  writeRetros(list)
}

export async function deleteRetroById(id: number): Promise<void> {
  await mockLatency()
  const list = readRetros().filter((r) => r.id !== id)
  writeRetros(list)
}

// ============== 重新计算所有客户的准备度评分 ==============
// "刷新看板" 时调用：不清数据，只重算评分和状态，然后刷新更新时间
export async function recalcAllReadiness(): Promise<number> {
  await mockLatency()
  const list = readCustomers()
  let changed = 0
  const now = new Date().toISOString()
  for (let i = 0; i < list.length; i++) {
    const r = list[i]
    const score = calcReadinessScore(r)
    const status = scoreToStatus(score)
    if (r.readiness_score !== score || r.readiness_status !== status) {
      list[i] = { ...r, readiness_score: score, readiness_status: status, updated_at: now }
      changed += 1
    }
  }
  // 无论有没有变化，都刷新一下时间戳，让用户看到"刷新过"
  writeCustomers(list)
  return changed
}

// ============== 重置演示 ==============
export function resetDemoData(): void {
  // 内存和 localStorage 都清
  const keys = [
    STORAGE_KEY,
    RETRO_KEY,
    ID_COUNTER_KEY,
    RETRO_ID_COUNTER_KEY,
    SEED_MARK_KEY,
    UPDATED_AT_KEY,
  ]
  for (const k of keys) {
    safeRemoveItem(k)
    memoryStore.delete(k)
  }
  memoryIdCounters = { customer: 0, retro: 0 }
  // 如果之前降级过，重置后回归 localStorage 模式尝试
  storageMode = 'localStorage'
  storageDegradeReason = null
  listeners.forEach((cb) => cb(storageMode, storageDegradeReason))
}
