import React, { useMemo } from 'react'
import { Card, Table, Tag, Alert, Progress, Space, Typography } from 'antd'
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { CustomerRecord } from './constants'
import {
  checkReadiness,
  type ReadinessCheckItem,
  type CheckConclusion,
} from '../../utils/readiness'

const { Text } = Typography

const STATUS_ICON: Record<string, React.ReactNode> = {
  已完成: <CheckCircleFilled style={{ color: '#52c41a' }} />,
  未完成: <CloseCircleFilled style={{ color: '#ff4d4f' }} />,
  需关注: <ExclamationCircleFilled style={{ color: '#faad14' }} />,
}

const STATUS_COLOR: Record<string, string> = {
  已完成: 'success',
  未完成: 'error',
  需关注: 'warning',
}

const CONCLUSION_TYPE: Record<CheckConclusion, 'success' | 'warning' | 'error'> = {
  可进入测试投放: 'success',
  准备中: 'warning',
  暂不建议投放: 'error',
}

const CONCLUSION_TAG_COLOR: Record<CheckConclusion, string> = {
  可进入测试投放: 'green',
  准备中: 'orange',
  暂不建议投放: 'red',
}

interface Props {
  record: CustomerRecord
  compact?: boolean // 抽屉里用紧凑模式
}

const ReadinessCheck: React.FC<Props> = ({ record, compact }) => {
  const result = useMemo(() => checkReadiness(record), [record])

  const columns: ColumnsType<ReadinessCheckItem> = [
    {
      title: '检查项',
      dataIndex: 'label',
      key: 'label',
      width: 180,
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => (
        <Space size={4}>
          {STATUS_ICON[v]}
          <Tag color={STATUS_COLOR[v]} style={{ margin: 0 }}>
            {v}
          </Tag>
        </Space>
      ),
    },
    {
      title: '说明',
      dataIndex: 'note',
      key: 'note',
      render: (v: string) => <Text type="secondary">{v}</Text>,
    },
    {
      title: '建议动作',
      dataIndex: 'suggestion',
      key: 'suggestion',
      width: 260,
      render: (v: string) =>
        v ? <Text>{v}</Text> : <Text type="secondary" style={{ opacity: 0.5 }}>—</Text>,
    },
  ]

  return (
    <div>
      {/* 结论 Alert */}
      <Alert
        type={CONCLUSION_TYPE[result.conclusion]}
        showIcon
        message={
          <Space>
            <span>投放准备结论：</span>
            <Tag color={CONCLUSION_TAG_COLOR[result.conclusion]} style={{ fontSize: 13, padding: '2px 8px' }}>
              {result.conclusion}
            </Tag>
            <Text type="secondary">
              （检查通过 {result.passedCount} / {result.totalCount} 项）
            </Text>
          </Space>
        }
        description={result.conclusionReason}
        style={{ marginBottom: 12 }}
      />

      {/* 评分条 */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space size="large" wrap>
          <Space direction="vertical" size={2}>
            <Text type="secondary">投放准备度评分</Text>
            <Space>
              <Progress
                type="circle"
                percent={result.score}
                size={compact ? 48 : 64}
                strokeColor={
                  result.score >= 80
                    ? '#52c41a'
                    : result.score >= 60
                    ? '#1890ff'
                    : result.score >= 40
                    ? '#faad14'
                    : '#ff4d4f'
                }
              />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{result.score} 分</div>
                <Tag color={CONCLUSION_TAG_COLOR[result.conclusion]} style={{ marginTop: 4 }}>
                  {result.scoreStatus}
                </Tag>
              </div>
            </Space>
          </Space>
        </Space>
      </Card>

      {/* 7 项检查表 */}
      <Table
        columns={columns}
        dataSource={result.items}
        rowKey="key"
        pagination={false}
        size="small"
        bordered
      />
    </div>
  )
}

export default ReadinessCheck
