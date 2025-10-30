import React from 'react'
import ReactDOM from 'react-dom/client'
import { VisualTipsScreen } from './screens/VisualTipsScreen'
import '../tailwind.css'

ReactDOM.createRoot(document.getElementById('visual-tips-root')!).render(
  <React.StrictMode>
    <VisualTipsScreen />
  </React.StrictMode>,
)
