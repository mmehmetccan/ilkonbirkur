// main.jsx veya index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// 👈 BU ÖNEMLİ: BrowserRouter'ı içe aktarın
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 🔑 ÇÖZÜM: App bileşenini BrowserRouter ile sarmalayın */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);