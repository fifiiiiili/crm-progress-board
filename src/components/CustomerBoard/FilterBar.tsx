import { Input, Select, DatePicker, Space, Button, Row, Col } from 'antd'
import { SearchOutlined, ClearOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import {
  STATUS_OPTIONS,
  BLOCK_TYPE_OPTIONS,
  SOURCE_TYPE_OPTIONS,
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
  current_status: string[]
  block_type: string[]
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
  current_status: [],
  block_type: [],
  source_type: [],
  last_follow_up_range: null,
}

interface Props {
  value: FilterState
  onChange: (next: FilterState) => void
  /** 用于生成动态下拉选项 */
  distinctValues: {
    customer_source: string[]
    country_region: string[]
    industry_l1: string[]
    industry_l2: string[]
    channel_manager: string[]
  }
}

function toOpts(vals: string[]) {
  return vals.filter(Boolean).map((v) => ({ value: v, label: v }))
}

export default function FilterBar({ value, onChange, distinctValues }: Props) {
  const patch = (partial: Partial<FilterState>) => onChange({ ...value, ...partial })
  const clear = () => onChange(EMPTY_FILTER)

  return (
    <div className="filter-bar">
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} md={8} lg={7}>
          <Input
            allowClear
            size="middle"
            prefix={<SearchOutlined style={{ color: '#8c9098' }} />}
            placeholder="按 专业号 ID / 名称 / 渠道经理 模糊搜索"
            value={value.keyword}
            onChange={(e) => patch({ keyword: e.target.value })}
          />
        </Col>
        <Col xs={24} md={16} lg={17}>
          <Space size={8} wrap>
            <Select
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              placeholder="客户来源"
              value={value.customer_source}
              onChange={(v) => patch({ customer_source: v })}
              style={{ minWidth: 140 }}
              options={toOpts(distinctValues.customer_source)}
            />
            <Select
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              placeholder="国家/地区"
              value={value.country_region}
              onChange={(v) => patch({ country_region: v })}
              style={{ minWidth: 140 }}
              options={toOpts(distinctValues.country_region)}
            />
            <Select
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              placeholder="一级行业"
              value={value.industry_l1}
              onChange={(v) => patch({ industry_l1: v })}
              style={{ minWidth: 140 }}
              options={toOpts(distinctValues.industry_l1)}
            />
            <Select
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              placeholder="二级行业"
              value={value.industry_l2}
              onChange={(v) => patch({ industry_l2: v })}
              style={{ minWidth: 140 }}
              options={toOpts(distinctValues.industry_l2)}
            />
            <Select
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              placeholder="渠道经理"
              value={value.channel_manager}
              onChange={(v) => patch({ channel_manager: v })}
              style={{ minWidth: 140 }}
              options={toOpts(distinctValues.channel_manager)}
            />
            <Select
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              placeholder="当前状态"
              value={value.current_status}
              onChange={(v) => patch({ current_status: v })}
              style={{ minWidth: 140 }}
              options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.value }))}
            />
            <Select
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              placeholder="卡点类型"
              value={value.block_type}
              onChange={(v) => patch({ block_type: v })}
              style={{ minWidth: 140 }}
              options={BLOCK_TYPE_OPTIONS.map((s) => ({ value: s.value, label: s.value }))}
            />
            <Select
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              placeholder="数据来源"
              value={value.source_type}
              onChange={(v) => patch({ source_type: v })}
              style={{ minWidth: 130 }}
              options={SOURCE_TYPE_OPTIONS.map((s) => ({ value: s.value, label: s.value }))}
            />
            <RangePicker
              placeholder={['最近跟进 从', '至']}
              value={value.last_follow_up_range || undefined}
              onChange={(range) =>
                patch({
                  last_follow_up_range: range && range[0] && range[1] ? [range[0], range[1]] : null,
                })
              }
            />
            <Button icon={<ClearOutlined />} onClick={clear}>
              清空筛选
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
  )
}
