// Entry point of the ADMIN website (port 8001). Separate bundle: no phone wallet, no payment screens, no service worker.
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Admin } from '../src/admin/Admin';
import './admin.css';

const route = () => location.hash.slice(2).split(/[/?]/)[0] || 'overview';
function Site() {
  const [, setHash] = useState(location.hash); // re-render on any hash change, including ?q= search parameters
  useEffect(() => { const f = () => setHash(location.hash); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return <Admin page={route()} />;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Site /></StrictMode>);
