import React from 'react'
import ReactDOM from 'react-dom/client'
import { SplitChatView } from './components/SplitChatView/SplitChatView'
import '../tailwind.css'

ReactDOM.createRoot(document.getElementById('split-chat')!).render(
  <React.StrictMode>
    <SplitChatView />
  </React.StrictMode>,
)
