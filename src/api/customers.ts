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

function mockLatency() {
  return new Promise<void>((r) => setTimeout(r, 30 + Math.floor(Math.random() * 50)))
}

function markUpdated() {
  try {
    localStorage.setItem(UPDATED_AT_KEY, new Date().toISOString())
  } catch {
    /* ignore */
  }
}

export function getDataUpdatedAt(): string | null {
  try {
    return localStorage.getItem(UPDATED_AT_KEY)
  } catch {
    return null
  }
}

// ============== 内部 helpers ==============
function readCustomers(): CustomerRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CustomerRecord[]
  } catch {
    return []
  }
}
function writeCustomers(list: CustomerRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  markUpdated()
}

function readRetros(): RetroRecord[] {
  try {
    const raw = localStorage.getItem(RETRO_KEY)
    if (!raw) return []
    return JSON.parse(raw) as RetroRecord[]
  } catch {
    return []
  }
}
function writeRetros(list: RetroRecord[]) {
  localStorage.setItem(RETRO_KEY, JSON.stringify(list))
  markUpdated()
}

function nextId(key: string): number {
  const cur = Number(localStorage.getItem(key) || '0')
  const next = cur + 1
  localStorage.setItem(key, String(next))
  return next
}

function ensureSeed() {
  if (localStorage.getItem(SEED_MARK_KEY) === '1') return
  const now = new Date().toISOString()
  const seeded: CustomerRecord[] = SEED_CUSTOMERS.map((r) => ({
    ...r,
    id: nextId(ID_COUNTER_KEY),
    created_at: r.created_at || now,
    updated_at: r.updated_at || now,
  }))
  writeCustomers(seeded)
  const retros: RetroRecord[] = SEED_RETRO_CASES.map((c) => ({
    ...c,
    id: nextId(RETRO_ID_COUNTER_KEY),
  }))
  writeRetros(retros)
  localStorage.setItem(SEED_MARK_KEY, '1')
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
    id: nextId(ID_COUNTER_KEY),
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
      id: nextId(ID_COUNTER_KEY),
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
  // 重算评分
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
    id: nextId(RETRO_ID_COUNTER_KEY),
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

// ============== 重置演示 ==============
export function resetDemoData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(RETRO_KEY)
    localStorage.removeItem(ID_COUNTER_KEY)
    localStorage.removeItem(RETRO_ID_COUNTER_KEY)
    localStorage.removeItem(SEED_MARK_KEY)
    localStorage.removeItem(UPDATED_AT_KEY)
  } catch {
    /* ignore */
  }
}
