// ===============================================
// PASO 9.23 - frontend/src/index.tsx
// PUNTO DE ENTRADA PRINCIPAL
// ===============================================

import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// ===============================================
// RENDERIZAR APLICACIÓN
// ===============================================
const container = document.getElementById('root');
if (!container) {
  throw new Error('No se pudo encontrar el elemento root');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ===============================================
// MÉTRICAS DE RENDIMIENTO
// ===============================================
// Si quieres empezar a medir el rendimiento en tu app, pasa una función
// para registrar los resultados (por ejemplo: reportWebVitals(console.log))
// o envía a un endpoint de analíticas. Aprende más: https://bit.ly/CRA-vitals
reportWebVitals();