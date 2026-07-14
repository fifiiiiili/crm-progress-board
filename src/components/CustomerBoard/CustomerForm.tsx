import { useEffect } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Row,
  Col,
  message,
} from 'antd'
import dayjs from 'dayjs'
import {
  STATUS_OPTIONS,
  BLOCK_TYPE_OPTIONS,
  CUSTOMER_SCALE_OPTIONS,
  PRIORITY_OPTIONS,
  INTENT_OPTIONS,
  type CustomerRecord,
  type ChatScreenshot,
} from './constants'
import ScreenshotUpload from './ScreenshotUpload'

const { TextArea } = Input

interface Props {
  open: boolean
  mode: 'add' | 'edit'
  initial?: CustomerRecord | null
  onCancel: () => void
  onSubmit: (values: Partial<CustomerRecord>) => Promise<void>
}

export default function CustomerForm({ open, mode, initial, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm()
  const isEdit = mode === 'edit'

  useEffect(() => {
    if (open) {
      if (initial) {
        form.setFieldsValue({
          ...initial,
          last_follow_up_at: initial.last_follow_up_at
            ? dayjs(initial.last_follow_up_at)
            : null,
          lead_created_at: initial.lead_created_at
            ? dayjs(initial.lead_created_at)
            : null,
        })
      } else {
        form.resetFields()
      }
    }
  }, [open, initial, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const payload: Partial<CustomerRecord> = {
        ...values,
        last_follow_up_at: values.last_follow_up_at
          ? (values.last_follow_up_at as dayjs.Dayjs).toISOString()
          : null,
        lead_created_at: values.lead_created_at
          ? (values.lead_created_at as dayjs.Dayjs).toISOString()
          : null,
      }
      await onSubmit(payload)
    } catch (err) {
      if ((err as { errorFields?: unknown }).errorFields) return // 表单校验
      const msg = err instanceof Error ? err.message : String(err)
      message.error(`保存失败：${msg}`)
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? '编辑客户' : '新增客户'}
      width={920}
      onCancel={onCancel}
      onOk={handleOk}
      okText={isEdit ? '保存' : '新增'}
      cancelText="取消"
      destroyOnClose
      maskClosable={false}
      getContainer={() => document.body}
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="客户来源"
              name="customer_source"
              rules={[{ required: true, message: '请填写客户来源' }]}
            >
              <Input placeholder="例：AM 推荐 / 客户主动咨询 / 存量迁移" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="账号 ID"
              name="pro_account_id"
              rules={[{ required: true, message: '请填写账号 ID' }]}
            >
              <Input placeholder="填写客户账号 ID（唯一）" disabled={isEdit} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="账号名称"
              name="pro_account_name"
              rules={[{ required: true, message: '请填写账号名称' }]}
            >
              <Input placeholder="账号显示名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="国家/地区" name="country_region">
              <Input placeholder="例：日本 / 韩国 / 美国" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="一级行业" name="industry_l1">
              <Input placeholder="例：美妆个护" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="二级行业" name="industry_l2">
              <Input placeholder="例：护肤" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="对应渠道经理"
              name="channel_manager"
              rules={[{ required: true, message: '请填写渠道经理' }]}
            >
              <Input placeholder="姓名 / 花名" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="客户体量" name="customer_scale">
              <Select
                placeholder="选择客户体量"
                allowClear
                options={CUSTOMER_SCALE_OPTIONS.map((s) => ({
                  value: s.value,
                  label: s.value,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="客户优先级" name="priority">
              <Select
                placeholder="选择优先级"
                allowClear
                options={PRIORITY_OPTIONS.map((s) => ({ value: s.value, label: s.value }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="预估月预算（元）" name="monthly_budget">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={1000}
                placeholder="例：50000"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="投放意向" name="intent">
              <Select
                placeholder="选择投放意向"
                allowClear
                options={INTENT_OPTIONS.map((s) => ({ value: s.value, label: s.value }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="线索创建时间" name="lead_created_at">
              <DatePicker
                style={{ width: '100%' }}
                placeholder="留空自动使用今天"
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="当前状态"
              name="current_status"
              rules={[{ required: true, message: '请选择当前状态' }]}
            >
              <Select
                placeholder="选择当前状态"
                options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.value }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="卡点类型" name="block_type">
              <Select
                placeholder="选择卡点类型"
                allowClear
                options={BLOCK_TYPE_OPTIONS.map((s) => ({ value: s.value, label: s.value }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="最近跟进时间" name="last_follow_up_at">
          <DatePicker
            showTime
            style={{ width: '100%' }}
            placeholder="留空将在保存时自动更新"
            format="YYYY-MM-DD HH:mm"
          />
        </Form.Item>

        <Form.Item label="跟进情况" name="follow_up_note">
          <TextArea rows={3} maxLength={500} showCount placeholder="描述当前跟进进展" />
        </Form.Item>

        <Form.Item label="下一步动作" name="next_action">
          <TextArea rows={2} maxLength={200} showCount placeholder="下一步计划做什么" />
        </Form.Item>

        <Form.Item label="跟进聊天截图" name="chat_screenshots">
          <ScreenshotUploadField />
        </Form.Item>

        <Form.Item label="备注" name="remark">
          <TextArea rows={2} maxLength={300} showCount placeholder="其他补充信息" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

function ScreenshotUploadField(props: {
  value?: ChatScreenshot[]
  onChange?: (v: ChatScreenshot[]) => void
}) {
  return <ScreenshotUpload value={props.value} onChange={props.onChange} />
}
