import { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Dashboard from './views/Dashboard.jsx';
import RunDetail from './views/RunDetail.jsx';
import ConnectPrompt from './views/ConnectPrompt.jsx';
import { getStatus } from './lib/api.js';

export default function App() {
  const [status, setStatus] = useState({ loading: true });
  const [authError, setAuthError] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(location.search);
    const authParam = params.get('auth');

    getStatus()
      .then((s) => {
        if (cancelled) return;
        setStatus({ loading: false, ...s });
        // Clean the ?auth= param from the URL once we've handled it
        if (authParam) {
          navigate('/', { replace: true });
        }
        // If we came back from OAuth but still not connected, surface the error
        if (authParam === 'ok' && !s.connected) {
          setAuthError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setStatus({ loading: false, connected: false });
      });
    return () => { cancelled = true; };
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status.loading) {
    return <div className="app"><div className="empty-state">Loading…</div></div>;
  }

  if (!status.connected) {
    return <ConnectPrompt authError={authError} />;
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
