import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler for debugging
window.onerror = function(message) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="color: white; padding: 40px; background: #0a0a0a; font-family: sans-serif; text-align: center;">
      <h1 style="color: #D4AF37;">Ops! Algo deu errado.</h1>
      <p style="color: #888;">${message}</p>
      <button onclick="location.reload()" style="background: #D4AF37; color: #001F3F; border: none; padding: 10px 20px; border-radius: 20px; font-weight: bold; cursor: pointer; margin-top: 20px;">Tentar Novamente</button>
    </div>`;
  }
  return false;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
