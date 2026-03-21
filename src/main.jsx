// Yeh file hamare app ka "Main Darwaza" (Entry point) hai.
// Jab bhi React app run hota hai, sabse pehle yahi file chalti hai.

// 1. React ke core libraries import kar rahe hain
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// 2. Hamara banaya hua "WeatherApp" component import kar rahe hain
import WeatherApp from './WeatherApp'

// 3. createRoot: Yeh HTML file me < div id="root"> dhundhta hai aur usme hamara pura React App (WeatherApp) daal deta hai.
createRoot(document.getElementById('root')).render(
  // StrictMode: Yeh development ke time kuch bad coding practices ke against warning deta hai. (UI pe kuch change nahi hota)
  <StrictMode>
    <WeatherApp />
  </StrictMode>
)