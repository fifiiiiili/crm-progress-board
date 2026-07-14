import { Card, Statistic, Row, Col } from 'antd'
import { useMemo } from 'react'
import dayjs from 'dayjs'
import type { CustomerRecord } from './constants'
import './StatsCards.css'

interface Props {
  records: CustomerRecord[]
}

export default function StatsCards({ records }: Props) {
  const stats = useMemo(() => {
    const now = dayjs()
    const sevenDaysAgo = now.subtract(7, 'day')
    const count = (predicate: (r: CustomerRecord) => boolean) =>
      records.filter(predicate).length

    const staleCount = records.filter((r) => {
      const t = r.last_follow_up_at || r.updated_at || r.created_at
      if (!t) return true
      return dayjs(t).isBefore(sevenDaysAgo)
    }).length

    return {
      total: records.length,
      following: count((r) => r.current_status === '跟进中'),
      waitingSupplement: count((r) => r.current_status === '待客户补充材料'),
      waitingReview: count((r) => r.current_status === '待内部审核'),
      reviewBlocked: count((r) => r.current_status === '审核卡住'),
      opened: count((r) => r.current_status === '已开通'),
      stale: staleCount,
      manual: count((r) => r.source_type === '手动新增'),
      uploaded: count((r) => r.source_type === '表格上传'),
    }
  }, [records])

  const cards: Array<{
    key: string
    title: string
    value: number
    color: string
    highlight?: boolean
  }> = [
    { key: 'total', title: '客户总数', value: stats.total, color: '#0D9488' },
    { key: 'following', title: '跟进中', value: stats.following, color: '#1677ff' },
    {
      key: 'waitingSupplement',
      title: '待客户补充材料',
      value: stats.waitingSupplement,
      color: '#d4a017',
    },
    {
      key: 'waitingReview',
      title: '待内部审核',
      value: stats.waitingReview,
      color: '#5b6ab7',
    },
    {
      key: 'reviewBlocked',
      title: '审核卡住',
      value: stats.reviewBlocked,
      color: '#d4380d',
      highlight: stats.reviewBlocked > 0,
    },
    { key: 'opened', title: '已开通', value: stats.opened, color: '#52c41a' },
    {
      key: 'stale',
      title: '超过 7 天未更新',
      value: stats.stale,
      color: '#fa541c',
      highlight: stats.stale > 0,
    },
    { key: 'manual', title: '手动新增', value: stats.manual, color: '#722ed1' },
    { key: 'uploaded', title: '表格上传', value: stats.uploaded, color: '#0958d9' },
  ]

  return (
    <div className="stats-cards">
      <Row gutter={[12, 12]}>
        {cards.map((c) => (
          <Col key={c.key} xs={12} sm={8} md={6} lg={24 / 9} xl={24 / 9}>
            <Card
              size="small"
              className={c.highlight ? 'stat-card highlight' : 'stat-card'}
              styles={{ body: { padding: '12px 14px' } }}
            >
              <Statistic
                title={<span className="stat-title">{c.title}</span>}
                value={c.value}
                valueStyle={{
                  color: c.color,
                  fontSize: 22,
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
