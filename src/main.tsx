import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('Main.tsx starting...');

// Global error handler for debugging
window.onerror = function(message) {
  console.error('GLOBAL ERROR:', message);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="color: white; padding: 40px; background: #000; font-family: sans-serif; text-align: center; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <h1 style="color: #fbbf24;">Ops! Algo deu errado.</h1>
      <p style="color: #888;">${message}</p>
      <button onclick="location.reload()" style="background: #fbbf24; color: #000; border: none; padding: 10px 20px; border-radius: 20px; font-weight: bold; cursor: pointer; margin-top: 20px;">Tentar Novamente</button>
    </div>`;
  }
  return false;
};

try {
  console.log('Rendering App...');
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log('App rendered successfully');
} catch (err) {
  console.error('RENDER ERROR:', err);
}
