import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../../rental-web-scraper/src/components/App/App'
import '../../rental-web-scraper/src/styles/styles.scss'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
