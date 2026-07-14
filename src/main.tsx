import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './main.css'

const container = document.getElementById('app-root')
if (!container) throw new Error('找不到挂载点 #app-root')

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
