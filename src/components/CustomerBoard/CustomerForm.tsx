import { useEffect } from 'react'
import { Modal, Form, Input, Select, DatePicker, Row, Col, InputNumber } from 'antd'
import dayjs from 'dayjs'
import {
  STATUS_OPTIONS,
  BLOCK_TYPE_OPTIONS,
  CUSTOMER_SCALE_OPTIONS,
  PRIORITY_OPTIONS,
  INTENT_OPTIONS,
  PLATFORM_OPTIONS,
  ACCOUNT_STATUS_OPTIONS,
  CREATIVE_STATUS_OPTIONS,
  CREATIVE_REVIEW_OPTIONS,
  LAUNCH_STAGE_OPTIONS,
  type CustomerRecord,
} from './constants'
import ScreenshotUpload from './ScreenshotUpload'
import type { ChatScreenshot } from './constants'

const toOpts = (arr: readonly string[]) => arr.map((v) => ({ label: v, value: v }))

interface CustomerFormProps {
  open: boolean
  mode: 'add' | 'edit'
  initial: CustomerRecord | null
  onCancel: () => void
  onSubmit: (values: Partial<CustomerRecord>) => Promise<void>
}

export default function CustomerForm({
  open,
  mode,
  initial,
  onCancel,
  onSubmit,
}: CustomerFormProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initial) {
      form.setFieldsValue({
        ...initial,
        last_follow_up_at: initial.last_follow_up_at ? dayjs(initial.last_follow_up_at) : null,
        lead_created_at: initial.lead_created_at ? dayjs(initial.lead_created_at) : null,
        first_test_date: initial.first_test_date ? dayjs(initial.first_test_date) : null,
      })
    } else {
      form.resetFields()
      form.setFieldsValue({
        current_status: '未跟进',
        priority: 'P2',
        intent: '中',
      })
    }
  }, [open, mode, initial, form])

  const handleOk = async () => {
    const values = await form.validateFields()
    const payload: Partial<CustomerRecord> = {
      ...values,
      last_follow_up_at: values.last_follow_up_at
        ? values.last_follow_up_at.toISOString()
        : null,
      lead_created_at: values.lead_created_at ? values.lead_created_at.toISOString() : null,
      first_test_date: values.first_test_date ? values.first_test_date.toISOString() : null,
    }
    await onSubmit(payload)
  }

  return (
    <Modal
      open={open}
      title={mode === 'add' ? '新增客户' : '编辑客户'}
      onCancel={onCancel}
      onOk={handleOk}
      okText="保存"
      cancelText="取消"
      width={960}
      destroyOnClose
      maskClosable={false}
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="客户来源"
              name="customer_source"
              rules={[{ required: true, message: '请输入客户来源' }]}
            >
              <Input placeholder="如：销售BD推荐 / 客户主动咨询" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="账号 ID"
              name="pro_account_id"
              rules={[{ required: true, message: '请输入账号 ID' }]}
            >
              <Input placeholder="填写账号 ID" disabled={mode === 'edit'} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="账号名称"
              name="pro_account_name"
              rules={[{ required: true, message: '请输入账号名称' }]}
            >
              <Input placeholder="填写账号名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="对应渠道经理"
              name="channel_manager"
              rules={[{ required: true, message: '请输入对应渠道经理' }]}
            >
              <Input placeholder="填写渠道经理" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="国家/地区" name="country_region">
              <Input placeholder="如：中国大陆 / 新加坡" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="一级行业" name="industry_l1">
              <Input placeholder="如：游戏 / 电商" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="二级行业" name="industry_l2">
              <Input placeholder="如：SLG / 服饰" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="客户体量" name="customer_scale">
              <Select allowClear placeholder="请选择" options={toOpts(CUSTOMER_SCALE_OPTIONS)} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="客户优先级"
              name="priority"
              rules={[{ required: true, message: '请选择客户优先级' }]}
            >
              <Select placeholder="请选择" options={toOpts(PRIORITY_OPTIONS)} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="投放意向"
              name="intent"
              rules={[{ required: true, message: '请选择投放意向' }]}
            >
              <Select placeholder="请选择" options={toOpts(INTENT_OPTIONS)} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="预估月预算（元）" name="monthly_budget">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={1000}
                placeholder="如：50000"
                formatter={(v) => (v ? `¥ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                parser={(v) => Number((v || '').replace(/[¥,\s]/g, '')) as never}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="当前状态"
              name="current_status"
              rules={[{ required: true, message: '请选择当前状态' }]}
            >
              <Select placeholder="请选择" options={toOpts(STATUS_OPTIONS)} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="卡点类型" name="block_type">
              <Select allowClear placeholder="请选择" options={toOpts(BLOCK_TYPE_OPTIONS)} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="投放平台" name="platform">
              <Select allowClear placeholder="请选择" options={toOpts(PLATFORM_OPTIONS)} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="广告账户状态" name="account_status">
              <Select allowClear placeholder="请选择" options={toOpts(ACCOUNT_STATUS_OPTIONS)} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="素材状态" name="creative_status">
              <Select
                allowClear
                placeholder="请选择"
                options={toOpts(CREATIVE_STATUS_OPTIONS)}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="素材数量" name="creative_count">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="素材审核结果" name="creative_review">
              <Select
                allowClear
                placeholder="请选择"
                options={toOpts(CREATIVE_REVIEW_OPTIONS)}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="测试预算（元）" name="test_budget">
              <InputNumber style={{ width: '100%' }} min={0} step={1000} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="投放阶段" name="launch_stage">
              <Select allowClear placeholder="请选择" options={toOpts(LAUNCH_STAGE_OPTIONS)} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="首轮测试日期" name="first_test_date">
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="最近跟进时间" name="last_follow_up_at">
              <DatePicker
                showTime
                style={{ width: '100%' }}
                format="YYYY-MM-DD HH:mm"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="线索创建时间" name="lead_created_at">
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="跟进情况" name="follow_up_note">
              <Input.TextArea rows={2} placeholder="简述客户当前跟进情况" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="下一步动作" name="next_action">
              <Input.TextArea rows={2} placeholder="记录下一步计划" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="remark">
              <Input.TextArea rows={2} placeholder="其他补充信息" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="跟进聊天截图" name="chat_screenshots">
              <ScreenshotUploadField />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

// —— 桥接组件：让 ScreenshotUpload 兼容 Form.Item ——
function ScreenshotUploadField({
  value,
  onChange,
}: {
  value?: ChatScreenshot[]
  onChange?: (v: ChatScreenshot[]) => void
}) {
  return <ScreenshotUpload value={value || []} onChange={onChange || (() => {})} />
}
