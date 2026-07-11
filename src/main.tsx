/**
 * @fileoverview Application entry point for Setu — FIFA World Cup 2026 AI Stadium Concierge.
 *
 * Bootstraps the React 18 root in StrictMode, which double-invokes effects in
 * development to surface side-effect bugs early. The singleton Firebase app and
 * AI Logic model are lazily initialized on first use in src/lib/gemini.ts.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
