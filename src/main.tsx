import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { captureAttribution, initAnalytics } from './lib/analytics'
if (window.location.hostname === 'pivothub.lovable.app') {
  window.location.replace('https://pivothub.io' + window.location.pathname + window.location.search + window.location.hash);
}


// Save UTM/referrer attribution before the router can redirect, then load GA4.
captureAttribution();
initAnalytics();

createRoot(document.getElementById("root")!).render(<App />);
