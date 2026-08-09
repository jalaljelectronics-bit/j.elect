import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Fallback signal for the prerenderer (see vite.config.js, which waits
// for the 'prerender-ready' event before capturing each page's HTML).
// BlogPost.jsx and ProjectDetail.jsx fire this event themselves, right
// when their fetched data is ready. Every OTHER page (Home, Products,
// Blog list, Projects list, About, Contact, Policies) never calls it —
// so without this fallback, the prerenderer would hang on those pages
// until its timeout. This fires the event automatically after a short
// delay UNLESS a page has already fired it itself, so fast pages don't
// wait unnecessarily and slow data-fetching pages still get to signal
// "ready" precisely when they actually are.
setTimeout(() => {
  if (!window.__prerenderReadyFired) {
    window.__prerenderReadyFired = true;
    document.dispatchEvent(new Event('prerender-ready'));
  }
}, 3000);