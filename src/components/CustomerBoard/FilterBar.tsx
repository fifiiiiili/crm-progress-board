import { Card, Input, Select, DatePicker, Space, Button, Row, Col } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import {
  STATUS_OPTIONS,
  BLOCK_TYPE_OPTIONS,
  SOURCE_TYPE_OPTIONS,
  CUSTOMER_SCALE_OPTIONS,
  PRIORITY_OPTIONS,
  INTENT_OPTIONS,
  PLATFORM_OPTIONS,
  ACCOUNT_STATUS_OPTIONS,
  CREATIVE_STATUS_OPTIONS,
  LAUNCH_STAGE_OPTIONS,
  READINESS_STATUS_OPTIONS,
} from './constants'
import './FilterBar.css'

const { RangePicker } = DatePicker

export interface FilterState {
  keyword: string
  customer_source: string[]
  country_region: string[]
  industry_l1: string[]
  industry_l2: string[]
  channel_manager: string[]
  customer_scale: string[]
  priority: string[]
  intent: string[]
  current_status: string[]
  block_type: string[]
  platform: string[]
  account_status: string[]
  creative_status: string[]
  launch_stage: string[]
  readiness_status: string[]
  source_type: string[]
  last_follow_up_range: [Dayjs, Dayjs] | null
}

export const EMPTY_FILTER: FilterState = {
  keyword: '',
  customer_source: [],
  country_region: [],
  industry_l1: [],
  industry_l2: [],
  channel_manager: [],
  customer_scale: [],
  priority: [],
  intent: [],
  current_status: [],
  block_type: [],
  platform: [],
  account_status: [],
  creative_status: [],
  launch_stage: [],
  readiness_status: [],
  source_type: [],
  last_follow_up_range: null,
}

interface FilterBarProps {
  value: FilterState
  onChange: (v: FilterState) => void
  distinctValues: {
    customer_source: string[]
    country_region: string[]
    industry_l1: string[]
    industry_l2: string[]
    channel_manager: string[]
  }
}

const toOpts = (arr: readonly string[]) => arr.map((v) => ({ label: v, value: v }))

export default function FilterBar({ value, onChange, distinctValues }: FilterBarProps) {
  const update = <K extends keyof FilterState>(k: K, v: FilterState[K]) => {
    onChange({ ...value, [k]: v })
  }
  const reset = () => onChange(EMPTY_FILTER)

  const sel = (placeholder: string) => ({
    mode: 'multiple' as const,
    allowClear: true,
    maxTagCount: 'responsive' as const,
    placeholder,
    style: { width: '100%' },
  })

  return (
    <Card size="small" className="filter-bar">
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索账号ID / 名称 / 渠道经理"
            value={value.keyword}
            onChange={(e) => update('keyword', e.target.value)}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            {...sel('客户来源')}
            options={toOpts(distinctValues.customer_source)}
            value={value.customer_source}
            onChange={(v) => update('customer_source', v)}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            {...sel('国家/地区')}
            options={toOpts(distinctValues.country_region)}
            value={value.country_region}
            onChange={(v) => update('country_region', v)}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            {...sel('一级行业')}
            options={toOpts(distinctValues.industry_l1)}
            value={value.industry_l1}
            onChange={(v) => update('industry_l1', v)}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            {...sel('二级行业')}
            options={toOpts(distinctValues.industry_l2)}
            value={value.industry_l2}
            onChange={(v) => update('industry_l2', v)}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            {...sel('渠道经理')}
            options={toOpts(distinctValues.channel_manager)}
            value={value.channel_manager}
            onChange={(v) => update('channel_manager', v)}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            {...sel('客户体量')}
            options={toOpts(CUSTOMER_SCALE_OPTIONS)}
            value={value.customer_scale}
            onChange={(v) => update('customer_scale', v)}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            {...sel('客户优先级')}
            options={toOpts(PRIORITY_OPTIONS)}
            value={value.priority}
            onChange={(v) => update('priority', v)}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            {...sel('投放意向')}
            options={toOpts(INTENT_OPTIONS)}
            value={value.intent}
            onChange={(v) => update('intent', v)}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            {...sel('当前状态')}
            options={toOpts(STATUS_OPTIONS)}
            value={value.current_status}
            onChange={(v) => update('current_status', v)}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            {...sel('卡点类型')}
            options={toOpts(BLOCK_TYPE_OPTIONS)}
            value={value.block_type}
            onChange={(v) => update('block_type', v)}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            {...sel('投放平台')}
            options={toOpts(PLATFORM_OPTIONS)}
            value={value.platform}
            onChange={(v) => update('platform', v)}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            {...sel('广告账户状态')}
            options={toOpts(ACCOUNT_STATUS_OPTIONS)}
            value={value.account_status}
            onChange={(v) => update('account_status', v)}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            {...sel('素材状态')}
            options={toOpts(CREATIVE_STATUS_OPTIONS)}
            value={value.creative_status}
            onChange={(v) => update('creative_status', v)}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            {...sel('投放阶段')}
            options={toOpts(LAUNCH_STAGE_OPTIONS)}
            value={value.launch_stage}
            onChange={(v) => update('launch_stage', v)}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            {...sel('投放准备状态')}
            options={toOpts(READINESS_STATUS_OPTIONS)}
            value={value.readiness_status}
            onChange={(v) => update('readiness_status', v)}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            {...sel('数据来源')}
            options={toOpts(SOURCE_TYPE_OPTIONS)}
            value={value.source_type}
            onChange={(v) => update('source_type', v)}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <RangePicker
            style={{ width: '100%' }}
            placeholder={['最近跟进 起', '止']}
            value={value.last_follow_up_range as [Dayjs, Dayjs] | null}
            onChange={(v) => update('last_follow_up_range', v as [Dayjs, Dayjs] | null)}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={reset}>
              重置筛选
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  )
}
