import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/global.css';

// 在 React 挂载前，先启动 HTML 加载器的淡出
const loader = document.getElementById('html-loader');
if (loader) {
  loader.style.transition = 'opacity 0.4s ease';
  loader.style.opacity = '0';
  setTimeout(() => loader.remove(), 400);
}

const root = document.getElementById('root');
if (!root) {throw new Error('Root element not found');}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
