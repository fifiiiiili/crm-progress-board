import { useMemo } from 'react'
import {
  Drawer,
  Space,
  Tag,
  Descriptions,
  Card,
  Timeline,
  Empty,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Button,
  Image,
} from 'antd'
import { EditOutlined, PlusOutlined, CloseOutlined, RobotOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  STATUS_COLOR_MAP,
  BLOCK_TYPE_COLOR_MAP,
  PRIORITY_COLOR_MAP,
  SCALE_COLOR_MAP,
  INTENT_COLOR_MAP,
  PLATFORM_COLOR_MAP,
  ACCOUNT_STATUS_COLOR_MAP,
  CREATIVE_STATUS_COLOR_MAP,
  LAUNCH_STAGE_COLOR_MAP,
  READINESS_COLOR_MAP,
  RISK_LEVEL_COLOR_MAP,
  SOURCE_COLOR_MAP,
  type CustomerRecord,
} from './constants'
import { detectRisks, highestRiskLevel, generateAiAdvice } from '../../utils/risk'
import ReadinessCheck from './ReadinessCheck'

const { Text, Paragraph } = Typography

interface AccountDetailDrawerProps {
  open: boolean
  record: CustomerRecord | null
  onClose: () => void
  onEdit?: (r: CustomerRecord) => void
  onAddFollowUp?: (r: CustomerRecord) => void
}

export default function AccountDetailDrawer({
  open,
  record,
  onClose,
  onEdit,
  onAddFollowUp,
}: AccountDetailDrawerProps) {
  const risks = useMemo(() => (record ? detectRisks(record) : []), [record])
  const topRiskLevel = useMemo(() => highestRiskLevel(risks), [risks])
  const aiAdvice = useMemo(() => (record ? generateAiAdvice(record) : ''), [record])

  if (!record) return null

  const screenshots = Array.isArray(record.chat_screenshots) ? record.chat_screenshots : []
  const followUps = Array.isArray(record.follow_up_records) ? [...record.follow_up_records] : []
  followUps.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={720}
      title={
        <Space>
          <Text strong>{record.pro_account_name}</Text>
          <Text type="secondary" className="mono-font">
            {record.pro_account_id}
          </Text>
        </Space>
      }
      extra={
        <Space>
          {onEdit && (
            <Button icon={<EditOutlined />} onClick={() => onEdit(record)}>
              编辑
            </Button>
          )}
          {onAddFollowUp && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => onAddFollowUp(record)}>
              更新跟进
            </Button>
          )}
          <Button icon={<CloseOutlined />} onClick={onClose}>
            关闭
          </Button>
        </Space>
      }
    >
      {/* 模块一：顶部摘要 */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <Row gutter={[16, 12]}>
          <Col span={12}>
            <Statistic
              title="投放准备度评分"
              value={record.readiness_score ?? 0}
              suffix="/ 100"
              valueStyle={{
                color:
                  (record.readiness_score ?? 0) >= 80
                    ? '#52c41a'
                    : (record.readiness_score ?? 0) >= 60
                    ? '#1677ff'
                    : (record.readiness_score ?? 0) >= 40
                    ? '#faad14'
                    : '#f5222d',
              }}
            />
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 6 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>准备状态</Text>
            </div>
            {record.readiness_status ? (
              <Tag color={READINESS_COLOR_MAP[record.readiness_status]}>
                {record.readiness_status}
              </Tag>
            ) : (
              '—'
            )}
          </Col>
          <Col span={24}>
            <Space wrap>
              <Tag color={STATUS_COLOR_MAP[record.current_status]}>{record.current_status}</Tag>
              {record.priority && (
                <Tag color={PRIORITY_COLOR_MAP[record.priority]}>{record.priority}</Tag>
              )}
              {record.customer_scale && (
                <Tag color={SCALE_COLOR_MAP[record.customer_scale]}>{record.customer_scale}</Tag>
              )}
              {topRiskLevel && (
                <Tag color={RISK_LEVEL_COLOR_MAP[topRiskLevel]}>{topRiskLevel}</Tag>
              )}
              <Tag color={SOURCE_COLOR_MAP[record.source_type]}>{record.source_type}</Tag>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 模块二：基础信息 */}
      <Card size="small" title="基础信息" style={{ marginBottom: 12 }}>
        <Descriptions size="small" column={2}>
          <Descriptions.Item label="客户来源">{record.customer_source || '—'}</Descriptions.Item>
          <Descriptions.Item label="国家/地区">{record.country_region || '—'}</Descriptions.Item>
          <Descriptions.Item label="一级行业">{record.industry_l1 || '—'}</Descriptions.Item>
          <Descriptions.Item label="二级行业">{record.industry_l2 || '—'}</Descriptions.Item>
          <Descriptions.Item label="渠道经理">{record.channel_manager || '—'}</Descriptions.Item>
          <Descriptions.Item label="投放意向">
            {record.intent ? (
              <Tag color={INTENT_COLOR_MAP[record.intent]}>{record.intent}</Tag>
            ) : (
              '—'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="预估月预算">
            {record.monthly_budget ? `¥ ${record.monthly_budget.toLocaleString()}` : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="创建人">{record.creator || '—'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 模块三：当前推进状态 */}
      <Card size="small" title="当前推进状态" style={{ marginBottom: 12 }}>
        <Descriptions size="small" column={2}>
          <Descriptions.Item label="当前状态">
            <Tag color={STATUS_COLOR_MAP[record.current_status]}>{record.current_status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="卡点类型">
            {record.block_type ? (
              <Tag color={BLOCK_TYPE_COLOR_MAP[record.block_type]}>{record.block_type}</Tag>
            ) : (
              '—'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="最近跟进时间">
            {record.last_follow_up_at
              ? dayjs(record.last_follow_up_at).format('YYYY-MM-DD HH:mm')
              : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="线索创建时间">
            {record.lead_created_at
              ? dayjs(record.lead_created_at).format('YYYY-MM-DD HH:mm')
              : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="跟进情况" span={2}>
            {record.follow_up_note || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="下一步动作" span={2}>
            {record.next_action || '—'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 模块四：投放准备信息 */}
      <Card size="small" title="投放准备信息" style={{ marginBottom: 12 }}>
        <Descriptions size="small" column={2}>
          <Descriptions.Item label="投放平台">
            {record.platform ? (
              <Tag color={PLATFORM_COLOR_MAP[record.platform]}>{record.platform}</Tag>
            ) : (
              '—'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="账户状态">
            {record.account_status ? (
              <Tag color={ACCOUNT_STATUS_COLOR_MAP[record.account_status]}>
                {record.account_status}
              </Tag>
            ) : (
              '—'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="素材状态">
            {record.creative_status ? (
              <Tag color={CREATIVE_STATUS_COLOR_MAP[record.creative_status]}>
                {record.creative_status}
              </Tag>
            ) : (
              '—'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="素材数量">{record.creative_count ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="素材审核结果">
            {record.creative_review || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="测试预算">
            {record.test_budget ? `¥ ${record.test_budget.toLocaleString()}` : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="投放阶段">
            {record.launch_stage ? (
              <Tag color={LAUNCH_STAGE_COLOR_MAP[record.launch_stage]}>
                {record.launch_stage}
              </Tag>
            ) : (
              '—'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="首轮测试日期">
            {record.first_test_date ? dayjs(record.first_test_date).format('YYYY-MM-DD') : '—'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 模块 4.5：投放准备检查 */}
      <Card size="small" title={<Space>🎯 投放准备检查</Space>} style={{ marginBottom: 12 }}>
        <ReadinessCheck record={record} compact />
      </Card>

      {/* 模块五：风险预警信息 */}
      {risks.length > 0 && (
        <Card size="small" title={<Space>🚨 风险预警</Space>} style={{ marginBottom: 12 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {risks.map((rsk, i) => (
              <Alert
                key={i}
                type={
                  rsk.level === '高风险' ? 'error' : rsk.level === '中风险' ? 'warning' : 'info'
                }
                message={
                  <Space>
                    <Tag color={RISK_LEVEL_COLOR_MAP[rsk.level]}>{rsk.level}</Tag>
                    <Text strong>{rsk.type}</Text>
                  </Space>
                }
                description={
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      风险原因：{rsk.reason}
                    </Text>
                    <br />
                    <Text style={{ fontSize: 12 }}>建议动作：{rsk.suggestion}</Text>
                  </div>
                }
                showIcon
              />
            ))}
          </Space>
        </Card>
      )}

      {/* 模块六：AI 跟进建议 */}
      <Card
        size="small"
        title={
          <Space>
            <RobotOutlined style={{ color: '#722ed1' }} />
            AI 跟进建议
          </Space>
        }
        style={{ marginBottom: 12 }}
      >
        <Paragraph style={{ marginBottom: 8 }}>{aiAdvice}</Paragraph>
        <Text type="secondary" style={{ fontSize: 12 }}>
          💡 当前建议由规则生成，用于模拟 AI 辅助跟进场景；后续可接入大模型，根据历史跟进记录生成更完整的处理建议。
        </Text>
      </Card>

      {/* 模块七：跟进记录时间线 */}
      <Card size="small" title="跟进记录时间线" style={{ marginBottom: 12 }}>
        {followUps.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无跟进记录" />
        ) : (
          <Timeline
            items={followUps.map((f) => ({
              children: (
                <div>
                  <Space size={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(f.time).format('YYYY-MM-DD HH:mm')}
                    </Text>
                    <Tag>{f.operator}</Tag>
                    <Text strong style={{ fontSize: 13 }}>
                      {f.action}
                    </Text>
                  </Space>
                  <div style={{ marginTop: 2 }}>
                    <Text style={{ fontSize: 13 }}>{f.note}</Text>
                  </div>
                </div>
              ),
            }))}
          />
        )}
      </Card>

      {/* 模块八：截图/附件留痕 */}
      <Card size="small" title="截图 / 附件留痕">
        {screenshots.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无截图留痕" />
        ) : (
          <Image.PreviewGroup>
            <Space wrap>
              {screenshots.map((s, i) => (
                <div key={i} style={{ width: 140, textAlign: 'center' }}>
                  <Image
                    src={s.url}
                    width={140}
                    height={140}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                  />
                  {s.caption && (
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 12,
                        display: 'block',
                        marginTop: 4,
                        maxWidth: 140,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.caption}
                    </Text>
                  )}
                </div>
              ))}
            </Space>
          </Image.PreviewGroup>
        )}
      </Card>
    </Drawer>
  )
}
