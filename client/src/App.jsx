import { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Dashboard from './views/Dashboard.jsx';
import RunDetail from './views/RunDetail.jsx';
import ConnectPrompt from './views/ConnectPrompt.jsx';
import { getStatus } from './lib/api.js';

export default function App() {
  const [status, setStatus] = useState({ loading: true });
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    getStatus()
      .then((s) => !cancelled && setStatus({ loading: false, ...s }))
      .catch(() => !cancelled && setStatus({ loading: false, connected: false }));
    return () => { cancelled = true; };
    // Re-check status if we just came back from /auth/callback
  }, [location.search]);

  if (status.loading) {
    return <div className="app"><div className="empty-state">Loading…</div></div>;
  }

  if (!status.connected) {
    return <ConnectPrompt />;
  }

  return (
    <div className="app">
      <header className="header">
        <h1><Link to="/">Run Dashboard</Link></h1>
        <div className="athlete">
          <span className="dot">●</span>{' '}
          Connected as{' '}
          {status.athlete ? `${status.athlete.firstname ?? ''} ${status.athlete.lastname ?? ''}`.trim() : 'athlete'}
        </div>
      </header>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/run/:id" element={<RunDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
