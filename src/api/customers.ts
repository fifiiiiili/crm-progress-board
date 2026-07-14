/**
 * localStorage 数据后端 — Demo 版
 * 保留与原 Builder 客户端相同的 API 形态，让上层业务组件零改动。
 */

import type { CustomerRecord } from '../components/CustomerBoard/constants'
import { SEED_CUSTOMERS } from './seed'

const STORAGE_KEY = 'crm-progress-board:customers:v1'
const SEED_MARK_KEY = 'crm-progress-board:seeded:v1'
const ID_COUNTER_KEY = 'crm-progress-board:id-counter:v1'

interface Storage {
  rows: CustomerRecord[]
}

function readStore(): Storage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { rows: [] }
    const parsed = JSON.parse(raw) as Storage
    return { rows: Array.isArray(parsed?.rows) ? parsed.rows : [] }
  } catch {
    return { rows: [] }
  }
}

function writeStore(store: Storage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function nextId(): number {
  const raw = localStorage.getItem(ID_COUNTER_KEY)
  const cur = raw ? Number.parseInt(raw, 10) : 0
  const next = (Number.isFinite(cur) ? cur : 0) + 1
  localStorage.setItem(ID_COUNTER_KEY, String(next))
  return next
}

function ensureSeed(): void {
  if (localStorage.getItem(SEED_MARK_KEY) === '1') return
  const store = readStore()
  if (store.rows.length > 0) {
    localStorage.setItem(SEED_MARK_KEY, '1')
    return
  }
  const seeded: CustomerRecord[] = SEED_CUSTOMERS.map((r) => ({
    ...r,
    id: nextId(),
  }))
  writeStore({ rows: seeded })
  localStorage.setItem(SEED_MARK_KEY, '1')
}

/**
 * 手动重置为初始演示数据
 */
export function resetDemoData(): void {
  localStorage.removeItem(SEED_MARK_KEY)
  localStorage.removeItem(ID_COUNTER_KEY)
  localStorage.removeItem(STORAGE_KEY)
  ensureSeed()
}

/**
 * 拉取全量客户数据
 */
export async function fetchAllCustomers(): Promise<CustomerRecord[]> {
  ensureSeed()
  await mockLatency()
  const { rows } = readStore()
  return [...rows].sort((a, b) => (b.id || 0) - (a.id || 0))
}

/**
 * 按 pro_account_id 查询是否已存在
 */
export async function existsByProAccountId(pro_account_id: string): Promise<boolean> {
  ensureSeed()
  const { rows } = readStore()
  return rows.some((r) => r.pro_account_id === pro_account_id)
}

/**
 * 批量按 pro_account_id 查询已存在的 IDs
 */
export async function existingProAccountIds(ids: string[]): Promise<Set<string>> {
  ensureSeed()
  const { rows } = readStore()
  const idSet = new Set(ids)
  const result = new Set<string>()
  for (const r of rows) {
    if (r.pro_account_id && idSet.has(r.pro_account_id)) {
      result.add(r.pro_account_id)
    }
  }
  return result
}

/**
 * 插入新客户
 */
export async function insertCustomer(
  record: Omit<CustomerRecord, 'id'>,
): Promise<CustomerRecord> {
  ensureSeed()
  await mockLatency()
  const store = readStore()
  const now = new Date().toISOString()
  const row: CustomerRecord = {
    ...record,
    id: nextId(),
    created_at: record.created_at || now,
    updated_at: record.updated_at || now,
  }
  store.rows.push(row)
  writeStore(store)
  return row
}

/**
 * 批量插入
 */
export async function bulkInsertCustomers(
  records: Omit<CustomerRecord, 'id'>[],
): Promise<CustomerRecord[]> {
  ensureSeed()
  await mockLatency()
  const store = readStore()
  const now = new Date().toISOString()
  const created: CustomerRecord[] = records.map((r) => ({
    ...r,
    id: nextId(),
    created_at: r.created_at || now,
    updated_at: r.updated_at || now,
  }))
  store.rows.push(...created)
  writeStore(store)
  return created
}

const FOLLOW_UP_TRIGGER_FIELDS = new Set([
  'current_status',
  'block_type',
  'follow_up_note',
  'next_action',
])

/**
 * 更新客户
 */
export async function updateCustomerById(
  id: number,
  values: Partial<CustomerRecord>,
): Promise<void> {
  ensureSeed()
  await mockLatency()
  const store = readStore()
  const idx = store.rows.findIndex((r) => r.id === id)
  if (idx < 0) throw new Error(`未找到 id=${id} 的客户`)
  const now = new Date().toISOString()
  const patch: Partial<CustomerRecord> = { ...values, updated_at: now }
  if (Object.keys(values).some((k) => FOLLOW_UP_TRIGGER_FIELDS.has(k))) {
    patch.last_follow_up_at = now
  }
  store.rows[idx] = { ...store.rows[idx], ...patch }
  writeStore(store)
}

/**
 * 按 id 删除
 */
export async function deleteCustomerById(id: number): Promise<void> {
  ensureSeed()
  await mockLatency()
  const store = readStore()
  store.rows = store.rows.filter((r) => r.id !== id)
  writeStore(store)
}

/**
 * 模拟一点点网络延迟，让 loading 动画能被看到
 */
function mockLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 80 + Math.random() * 120))
}
