import { ConfigProvider, App as AntdApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import CustomerBoard from './components/CustomerBoard'

/**
 * CRM 客户跟进进度管理面板 - 根组件（Demo 版）
 */
export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#0D9488',
          borderRadius: 6,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
      }}
      getPopupContainer={(node) => node?.parentElement || document.body}
    >
      <AntdApp>
        <div className="miniapp-root">
          <CustomerBoard />
        </div>
      </AntdApp>
    </ConfigProvider>
  )
}
